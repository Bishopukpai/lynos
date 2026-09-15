import { NextResponse } from "next/server";
import {
  Environment,
  Paddle,
  type SubscriptionNotification,
} from "@paddle/paddle-node-sdk";
import {
  Collection,
  ObjectId,
} from "mongodb";

import getMongoClient from "@/lib/mongodb";
import { Organization } from "@/models/organization";

export const runtime = "nodejs";

/*
 * Paddle environment
 *
 * Use:
 * PADDLE_ENVIRONMENT=sandbox
 *
 * for local development.
 *
 * Use:
 * PADDLE_ENVIRONMENT=production
 *
 * for live.
 */
const paddleEnvironment =
  process.env.PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production;

const paddleApiKey =
  process.env.PADDLE_API_KEY;

const paddleWebhookSecret =
  process.env.PADDLE_WEBHOOK_SECRET;

const paddle = paddleApiKey
  ? new Paddle(paddleApiKey, {
      environment: paddleEnvironment,
    })
  : null;

/*
 * GET
 *
 * Useful for checking that the webhook route
 * exists when using Hookdeck or opening the
 * endpoint in a browser.
 *
 * Paddle itself sends POST webhook requests.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "paddle-webhook",
      message:
        "Paddle webhook endpoint is active.",
    },
    {
      status: 200,
    }
  );
}

/*
 * Synchronize a Paddle subscription
 * with the LYNOS organization.
 *
 * IMPORTANT:
 *
 * Paddle's webhook SDK returns a
 * SubscriptionNotification here, not the
 * full API Subscription type.
 *
 * SubscriptionNotification contains the
 * fields available in subscription webhook
 * payloads and intentionally does not contain
 * some full-resource fields such as:
 *
 * - managementUrls
 * - nextTransaction
 * - recurringTransactionDetails
 *
 * We only use fields that are available
 * in the webhook notification.
 */
async function syncSubscription(
  organizations: Collection<Organization>,
  subscription: SubscriptionNotification
) {
  const customerId =
    subscription.customerId;

  if (!customerId) {
    console.warn(
      "Paddle subscription webhook did not contain a customer ID."
    );

    return;
  }

  const subscriptionId =
    subscription.id;

  if (!subscriptionId) {
    console.warn(
      "Paddle subscription webhook did not contain a subscription ID."
    );

    return;
  }

  const organizationId =
    subscription.customData
      ?.organizationId;

  const plan =
    subscription.customData
      ?.plan;

  const billingInterval =
    subscription.customData
      ?.billingInterval;

  const updateData: Record<
    string,
    unknown
  > = {
    billingProvider: "paddle",

    billingCustomerId:
      customerId,

    billingSubscriptionId:
      subscriptionId,

    subscriptionStatus:
      subscription.status,

    updatedAt:
      new Date(),
  };

  /*
   * Only accept plans that exist in
   * the LYNOS subscription model.
   */
  if (
    plan === "pro" ||
    plan === "enterprise"
  ) {
    updateData.subscriptionPlan =
      plan;
  }

  /*
   * Only accept billing intervals that
   * exist in the LYNOS subscription model.
   */
  if (
    billingInterval === "monthly" ||
    billingInterval === "yearly"
  ) {
    updateData.billingInterval =
      billingInterval;
  }

  /*
   * Preferred lookup:
   *
   * The organization ID is passed through
   * Paddle custom data when checkout is
   * created.
   */
  if (
    organizationId &&
    ObjectId.isValid(
      organizationId
    )
  ) {
    const result =
      await organizations.updateOne(
        {
          _id:
            new ObjectId(
              organizationId
            ),
        },
        {
          $set:
            updateData,
        }
      );

    if (
      result.matchedCount === 0
    ) {
      console.warn(
        `Paddle webhook could not find organization ${organizationId}.`
      );
    }

    return;
  }

  /*
   * Fallback lookup:
   *
   * If customData does not contain the
   * organization ID, try to find the
   * organization using the Paddle
   * customer ID.
   */
  const result =
    await organizations.updateOne(
      {
        billingProvider:
          "paddle",

        billingCustomerId:
          customerId,
      },
      {
        $set:
          updateData,
      }
    );

  if (
    result.matchedCount === 0
  ) {
    console.warn(
      `Paddle webhook could not find an organization for customer ${customerId}.`
    );
  }
}

/*
 * POST
 *
 * Main Paddle webhook handler.
 */
export async function POST(
  request: Request
) {
  try {
    /*
     * Make sure the required environment
     * variables exist.
     */
    if (!paddleApiKey) {
      console.error(
        "PADDLE_API_KEY is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Paddle API key is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (!paddleWebhookSecret) {
      console.error(
        "PADDLE_WEBHOOK_SECRET is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Paddle webhook secret is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (!paddle) {
      return NextResponse.json(
        {
          error:
            "Paddle client could not be initialized.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * We must read the raw request body.
     *
     * Do not call request.json() before
     * signature verification.
     */
    const rawBody =
      await request.text();

    /*
     * Paddle sends the signature in:
     *
     * Paddle-Signature
     */
    const signature =
      request.headers.get(
        "paddle-signature"
      );

    if (!signature) {
      console.error(
        "Paddle webhook signature is missing."
      );

      return NextResponse.json(
        {
          error:
            "Missing Paddle webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verify the signature and parse
     * the webhook using Paddle's official
     * Node.js SDK.
     */
    const eventData =
      await paddle.webhooks.unmarshal(
        rawBody,
        paddleWebhookSecret,
        signature
      );

    /*
     * Get the organizations collection.
     */
    const client =
      await getMongoClient();

    const db =
      client.db();

    const organizations =
      db.collection<Organization>(
        "organizations"
      );

    /*
     * Log the event type during development.
     *
     * Do not log the complete payload because
     * webhook payloads can contain customer
     * information.
     */
    console.log(
      `Paddle webhook received: ${eventData.eventType}`
    );

    /*
     * Paddle's Node SDK uses camelCase
     * event data properties.
     */
    switch (
      eventData.eventType
    ) {
      /*
       * A new recurring subscription
       * has been created.
       */
      case "subscription.created": {
        await syncSubscription(
          organizations,
          eventData.data
        );

        break;
      }

      /*
       * Subscription became active.
       */
      case "subscription.activated": {
        await syncSubscription(
          organizations,
          eventData.data
        );

        break;
      }

      /*
       * Subscription was updated.
       *
       * This is especially important because
       * Paddle recommends using subscription.updated
       * to keep our local subscription state
       * synchronized.
       */
      case "subscription.updated": {
        await syncSubscription(
          organizations,
          eventData.data
        );

        break;
      }

      /*
       * Subscription was canceled.
       *
       * syncSubscription() stores the actual
       * Paddle subscription status, which should
       * become "canceled".
       */
      case "subscription.canceled": {
        await syncSubscription(
          organizations,
          eventData.data
        );

        break;
      }

      /*
       * Subscription became past due.
       */
      case "subscription.past_due": {
        await syncSubscription(
          organizations,
          eventData.data
        );

        break;
      }

      /*
       * Subscription was paused.
       */
      case "subscription.paused": {
        await syncSubscription(
          organizations,
          eventData.data
        );

        break;
      }

      /*
       * Subscription was resumed.
       */
      case "subscription.resumed": {
        await syncSubscription(
          organizations,
          eventData.data
        );

        break;
      }

      /*
       * Transaction completed.
       *
       * For recurring subscriptions, Paddle
       * creates the subscription as part of the
       * completed transaction flow.
       *
       * The subscription lifecycle events above
       * are responsible for maintaining our
       * subscription state.
       */
      case "transaction.completed": {
        console.log(
          "Paddle transaction completed."
        );

        break;
      }

      /*
       * Payment failed.
       *
       * We intentionally do not directly set
       * subscriptionStatus here.
       *
       * Paddle's subscription lifecycle events
       * are the authoritative source for the
       * subscription's current status.
       */
      case "transaction.payment_failed": {
        console.warn(
          "Paddle transaction payment failed."
        );

        break;
      }

      /*
       * Other Paddle events.
       *
       * We acknowledge them with HTTP 200 so
       * Paddle does not continuously retry events
       * that LYNOS does not currently need.
       */
      default: {
        console.log(
          `Ignoring unsupported Paddle event: ${eventData.eventType}`
        );

        break;
      }
    }

    /*
     * Paddle expects a successful 2xx response.
     *
     * Return 200 after the event has been
     * successfully verified and processed.
     */
    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Paddle webhook processing error:",
      error
    );

    /*
     * This can be caused by:
     *
     * - invalid webhook signature
     * - malformed webhook payload
     * - missing environment variables
     * - database errors
     * - unexpected Paddle event data
     */
    return NextResponse.json(
      {
        error:
          "Failed to process Paddle webhook.",
      },
      {
        status: 400,
      }
    );
  }
}