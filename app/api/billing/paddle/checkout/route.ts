import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  Environment,
  Paddle,
} from "@paddle/paddle-node-sdk";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  getOrganizationMembersCollection,
} from "@/models/organizationMember";
import {
  getOrganizationsCollection,
} from "@/models/organization";

export const runtime = "nodejs";

type Plan = "pro" | "enterprise";
type BillingInterval = "monthly" | "yearly";

interface CheckoutRequestBody {
  organizationId?: unknown;
  plan?: unknown;
  billingInterval?: unknown;
}

const VALID_PLANS: Plan[] = [
  "pro",
  "enterprise",
];

const VALID_BILLING_INTERVALS: BillingInterval[] = [
  "monthly",
  "yearly",
];

function getPriceId(
  plan: Plan,
  billingInterval: BillingInterval
): string | null {
  const priceMap: Record<
    Plan,
    Record<BillingInterval, string | undefined>
  > = {
    pro: {
      monthly:
        process.env.PADDLE_PRO_MONTHLY_PRICE_ID,
      yearly:
        process.env.PADDLE_PRO_YEARLY_PRICE_ID,
    },
    enterprise: {
      monthly:
        process.env.PADDLE_ENTERPRISE_MONTHLY_PRICE_ID,
      yearly:
        process.env.PADDLE_ENTERPRISE_YEARLY_PRICE_ID,
    },
  };

  return priceMap[plan][billingInterval] ?? null;
}

function getPaddleClient(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "PADDLE_API_KEY is not configured."
    );
  }

  const environment =
    process.env.PADDLE_ENVIRONMENT === "sandbox"
      ? Environment.sandbox
      : Environment.production;

  return new Paddle(apiKey, {
    environment,
  });
}

export async function POST(request: Request) {
  try {
    /*
     * -------------------------------------------------------
     * 1. AUTHENTICATION
     * -------------------------------------------------------
     */

    const session =
      await getServerSession(authOptions);

    if (
      !session?.user?.id ||
      !ObjectId.isValid(session.user.id)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const userId = new ObjectId(
      session.user.id
    );

    /*
     * -------------------------------------------------------
     * 2. PARSE REQUEST BODY
     * -------------------------------------------------------
     */

    let body: CheckoutRequestBody;

    try {
      body =
        (await request.json()) as CheckoutRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 3. VALIDATE ORGANIZATION ID
     * -------------------------------------------------------
     */

    if (
      typeof body.organizationId !== "string" ||
      !ObjectId.isValid(body.organizationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid organization ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const organizationId =
      new ObjectId(body.organizationId);

    /*
     * -------------------------------------------------------
     * 4. VALIDATE PLAN
     * -------------------------------------------------------
     */

    if (
      typeof body.plan !== "string" ||
      !VALID_PLANS.includes(
        body.plan as Plan
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid subscription plan. Choose pro or enterprise.",
        },
        {
          status: 400,
        }
      );
    }

    const plan = body.plan as Plan;

    /*
     * -------------------------------------------------------
     * 5. VALIDATE BILLING INTERVAL
     * -------------------------------------------------------
     */

    if (
      typeof body.billingInterval !== "string" ||
      !VALID_BILLING_INTERVALS.includes(
        body.billingInterval as BillingInterval
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid billing interval. Choose monthly or yearly.",
        },
        {
          status: 400,
        }
      );
    }

    const billingInterval =
      body.billingInterval as BillingInterval;

    /*
     * -------------------------------------------------------
     * 6. VERIFY ORGANIZATION EXISTS
     * -------------------------------------------------------
     */

    const organizations =
      await getOrganizationsCollection();

    const organization =
      await organizations.findOne({
        _id: organizationId,
        status: "active",
      });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected organization was not found or is inactive.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 7. VERIFY ACTIVE MEMBERSHIP
     * -------------------------------------------------------
     *
     * Only an active organization member can initiate
     * billing for the organization.
     *
     * Billing authorization is deliberately based on
     * organization membership rather than trusting the
     * organization ID sent by the client.
     */

    const organizationMembers =
      await getOrganizationMembersCollection();

    const membership =
      await organizationMembers.findOne({
        organizationId,
        userId,
        status: "active",
      });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not an active member of this organization.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 8. VERIFY BILLING PERMISSION
     * -------------------------------------------------------
     *
     * Subscription billing changes the organization's
     * billing state, so only owners and admins may initiate
     * checkout.
     */

    if (
      membership.role !== "owner" &&
      membership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only organization owners and admins can manage billing.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 9. RESOLVE PADDLE PRICE ID
     * -------------------------------------------------------
     */

    const priceId = getPriceId(
      plan,
      billingInterval
    );

    if (!priceId) {
      console.error(
        "Missing Paddle price configuration:",
        {
          plan,
          billingInterval,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The selected subscription price is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 10. INITIALIZE PADDLE
     * -------------------------------------------------------
     */

    const paddle = getPaddleClient();

    /*
     * -------------------------------------------------------
     * 11. CREATE PADDLE TRANSACTION
     * -------------------------------------------------------
     *
     * We intentionally create a draft transaction without
     * customerId/addressId.
     *
     * Paddle Checkout will collect the customer's billing
     * details during checkout.
     *
     * customData is the critical integration metadata:
     *
     * organizationId
     * plan
     * billingInterval
     *
     * Paddle carries this metadata from the transaction to
     * the recurring subscription.
     */

    const transaction =
      await paddle.transactions.create({
        items: [
          {
            priceId,
            quantity: 1,
          },
        ],

        customData: {
          organizationId:
            organizationId.toString(),
          plan,
          billingInterval,
        },
      });

    /*
     * -------------------------------------------------------
     * 12. VERIFY CHECKOUT URL
     * -------------------------------------------------------
     */

    const checkoutUrl =
      transaction.checkout?.url;

    if (!checkoutUrl) {
      console.error(
        "Paddle transaction created without checkout URL.",
        {
          transactionId: transaction.id,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Paddle created the transaction, but no checkout URL was returned.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 13. RETURN CHECKOUT INFORMATION
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        url: checkoutUrl,
        transactionId: transaction.id,
        plan,
        billingInterval,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Paddle checkout creation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create the Paddle checkout. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}