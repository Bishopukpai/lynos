import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createHash } from "crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongodb";

import {
  getOrganizationsCollection,
} from "@/models/organization";

import {
  getOrganizationInvitationsCollection,
  ensureOrganizationInvitationIndexes,
} from "@/models/organizationInvitation";

import {
  getNotificationsCollection,
  ensureNotificationIndexes,
} from "@/models/notification";

/**
 * ---------------------------------------------------------
 * REQUEST VALIDATION
 * ---------------------------------------------------------
 */

const declineInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "Invitation token is required.")
    .max(256, "Invitation token is too long."),
});

/**
 * ---------------------------------------------------------
 * TOKEN HASHING
 * ---------------------------------------------------------
 *
 * The raw invitation token is never stored in MongoDB.
 *
 * Client sends:
 *
 *     token
 *
 * MongoDB stores:
 *
 *     SHA-256(token)
 */

function hashInvitationToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * ---------------------------------------------------------
 * POST /api/organizations/invitations/decline
 * ---------------------------------------------------------
 *
 * Declines a workspace invitation.
 *
 * Security requirements:
 *
 * 1. User must be authenticated.
 * 2. Authenticated user must have a valid ObjectId.
 * 3. Authenticated user must have an email.
 * 4. Invitation token must be valid.
 * 5. Invitation must still be pending.
 * 6. Invitation must not be expired.
 * 7. Authenticated user's email must match
 *    the invitation email.
 * 8. Organization must still exist.
 * 9. Invitation decline must happen atomically.
 * 10. Invited user's notification is updated.
 * 11. Organization owner is notified.
 *
 * Notification behavior:
 *
 * Invited user's notification:
 *
 *     pending
 *        ↓
 *     declined
 *
 *     read → true
 *
 * Organization owner's notification:
 *
 *     new notification
 *     actionStatus: "declined"
 *
 * The owner notification contains:
 *
 *     recipientId = organization.ownerId
 *     actorId     = declining user's ID
 *     invitationId
 *
 * This allows the owner to see who declined the invitation.
 */
export async function POST(request: Request) {
  try {
    /*
     * -------------------------------------------------------
     * 1. AUTHENTICATION
     * -------------------------------------------------------
     */

    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 2. VALIDATE AUTHENTICATED USER ID
     * -------------------------------------------------------
     */

    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          error: "Invalid authenticated user.",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      new ObjectId(session.user.id);

    /*
     * -------------------------------------------------------
     * 3. VALIDATE AUTHENTICATED EMAIL
     * -------------------------------------------------------
     */

    const authenticatedEmail =
      session.user.email
        ?.toLowerCase()
        .trim();

    if (!authenticatedEmail) {
      return NextResponse.json(
        {
          error:
            "Your authenticated account does not have an email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 4. VALIDATE REQUEST BODY
     * -------------------------------------------------------
     */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    const validation =
      declineInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            "Invalid invitation data.",
          details:
            validation.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const token =
      validation.data.token.trim();

    /*
     * -------------------------------------------------------
     * 5. HASH INVITATION TOKEN
     * -------------------------------------------------------
     */

    const tokenHash =
      hashInvitationToken(token);

    /*
     * -------------------------------------------------------
     * 6. GET COLLECTIONS
     * -------------------------------------------------------
     */

    const [
      organizations,
      organizationInvitations,
      notifications,
    ] = await Promise.all([
      getOrganizationsCollection(),
      getOrganizationInvitationsCollection(),
      getNotificationsCollection(),
    ]);

    /*
     * -------------------------------------------------------
     * 7. ENSURE REQUIRED INDEXES
     * -------------------------------------------------------
     */

    await Promise.all([
      ensureOrganizationInvitationIndexes(),
      ensureNotificationIndexes(),
    ]);

    /*
     * -------------------------------------------------------
     * 8. FIND INVITATION
     * -------------------------------------------------------
     *
     * We intentionally search by tokenHash.
     *
     * The raw invitation token must never exist
     * in MongoDB.
     */

    const invitation =
      await organizationInvitations.findOne({
        tokenHash,
      });

    if (!invitation) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired invitation.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 9. VERIFY INVITATION STATUS
     * -------------------------------------------------------
     *
     * Only pending invitations can be declined.
     */

    if (
      invitation.status !==
      "pending"
    ) {
      return NextResponse.json(
        {
          error:
            "This invitation is no longer available.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 10. VERIFY EXPIRATION
     * -------------------------------------------------------
     */

    const now = new Date();

    if (
      invitation.expiresAt <= now
    ) {
      /*
       * Mark invitation as expired.
       */

      await organizationInvitations.updateOne(
        {
          _id: invitation._id,
          tokenHash,
          status: "pending",
        },
        {
          $set: {
            status: "expired",
            updatedAt: now,
          },
        }
      );

      /*
       * Update the invited user's notification.
       *
       * The notification is marked as read because
       * the invitation can no longer be acted upon.
       */

      await notifications.updateMany(
        {
          invitationId:
            invitation._id,

          recipientId:
            userId,

          actionStatus:
            "pending",
        },
        {
          $set: {
            actionStatus:
              "expired",

            read: true,

            updatedAt: now,
          },
        }
      );

      return NextResponse.json(
        {
          error:
            "This invitation has expired.",
        },
        {
          status: 410,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 11. VERIFY INVITED EMAIL
     * -------------------------------------------------------
     *
     * Only the account whose email was invited can
     * decline the invitation.
     */

    const invitationEmail =
      invitation.email
        .toLowerCase()
        .trim();

    if (
      invitationEmail !==
      authenticatedEmail
    ) {
      return NextResponse.json(
        {
          error:
            "This invitation was issued to a different email address.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 12. VERIFY ORGANIZATION
     * -------------------------------------------------------
     *
     * We need the organization owner ID because the
     * organization owner must be notified when the
     * invitation is declined.
     */

    const organization =
      await organizations.findOne({
        _id:
          invitation.organizationId,

        status: "active",
      });

    if (!organization) {
      return NextResponse.json(
        {
          error:
            "This workspace is no longer available.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 13. START TRANSACTION
     * -------------------------------------------------------
     *
     * The following operations happen atomically:
     *
     * 1. invitation pending → declined
     *
     * 2. invited user's notification:
     *      pending → declined
     *      read → true
     *
     * 3. organization owner notification is created
     *
     * If any operation fails, the transaction is rolled back.
     */

    const client =
      await getMongoClient();

    const dbSession =
      client.startSession();

    try {
      let transactionSucceeded =
        false;

      await dbSession.withTransaction(
        async () => {
          /*
           * -------------------------------------------------
           * 13A. RE-CHECK INVITATION
           * -------------------------------------------------
           *
           * Another request may have accepted,
           * declined, or cancelled this invitation
           * after the initial lookup.
           *
           * Therefore we MUST re-check it inside
           * the transaction.
           */

          const currentInvitation =
            await organizationInvitations.findOne(
              {
                _id:
                  invitation._id,

                tokenHash,

                status:
                  "pending",
              },
              {
                session:
                  dbSession,
              }
            );

          if (!currentInvitation) {
            throw new InvitationAlreadyProcessedError();
          }

          /*
           * -------------------------------------------------
           * 13B. RE-CHECK EXPIRATION
           * -------------------------------------------------
           */

          const transactionNow =
            new Date();

          if (
            currentInvitation.expiresAt <=
            transactionNow
          ) {
            /*
             * Mark invitation as expired.
             */

            await organizationInvitations.updateOne(
              {
                _id:
                  currentInvitation._id,

                tokenHash,

                status:
                  "pending",
              },
              {
                $set: {
                  status:
                    "expired",

                  updatedAt:
                    transactionNow,
                },
              },
              {
                session:
                  dbSession,
              }
            );

            /*
             * Update invited user's notification.
             */

            await notifications.updateMany(
              {
                invitationId:
                  currentInvitation._id,

                recipientId:
                  userId,

                actionStatus:
                  "pending",
              },
              {
                $set: {
                  actionStatus:
                    "expired",

                  read:
                    true,

                  updatedAt:
                    transactionNow,
                },
              },
              {
                session:
                  dbSession,
              }
            );

            throw new InvitationExpiredError();
          }

          /*
           * -------------------------------------------------
           * 13C. DECLINE INVITATION
           * -------------------------------------------------
           *
           * IMPORTANT:
           *
           * The status condition guarantees that only
           * a pending invitation can become declined.
           */

          const invitationUpdate =
            await organizationInvitations.updateOne(
              {
                _id:
                  currentInvitation._id,

                tokenHash,

                status:
                  "pending",
              },
              {
                $set: {
                  status:
                    "declined",

                  declinedAt:
                    transactionNow,

                  updatedAt:
                    transactionNow,
                },
              },
              {
                session:
                  dbSession,
              }
            );

          /*
           * If nothing was modified, another operation
           * won the race.
           */

          if (
            invitationUpdate.modifiedCount !==
            1
          ) {
            throw new InvitationAlreadyProcessedError();
          }

          /*
           * -------------------------------------------------
           * 13D. UPDATE INVITED USER NOTIFICATION
           * -------------------------------------------------
           *
           * The notification created when the invitation
           * was sent has:
           *
           *     invitationId
           *     recipientId
           *     actionStatus: "pending"
           *
           * After decline:
           *
           *     actionStatus → "declined"
           *     read         → true
           *
           * The invitation ID and recipient ID ensure
           * that only the invited user's notification
           * is modified.
           */

          await notifications.updateMany(
            {
              invitationId:
                currentInvitation._id,

              recipientId:
                userId,

              actionStatus:
                "pending",
            },
            {
              $set: {
                actionStatus:
                  "declined",

                read:
                  true,

                updatedAt:
                  transactionNow,
              },
            },
            {
              session:
                dbSession,
            }
          );

          /*
           * -------------------------------------------------
           * 13E. CREATE ORGANIZATION OWNER NOTIFICATION
           * -------------------------------------------------
           *
           * The organization owner needs to know that
           * the invitation was declined.
           *
           * recipientId:
           *     organization.ownerId
           *
           * actorId:
           *     userId
           *
           * invitationId:
           *     currentInvitation._id
           *
           * This allows the notification system to identify:
           *
           *     WHO declined
           *
           *     WHICH invitation was declined
           *
           *     WHICH organization was involved
           */

          await notifications.insertOne(
            {
              recipientId:
                organization.ownerId,

              organizationId:
                currentInvitation.organizationId,

              actorId:
                userId,

              type:
                "organization_invitation",

              title:
                "Workspace invitation declined",

              message:
                `${authenticatedEmail} declined the invitation to join ${organization.name} as a ${currentInvitation.role}.`,

              invitationId:
                currentInvitation._id,

              read:
                false,

              actionStatus:
                "declined",

              createdAt:
                transactionNow,

              updatedAt:
                transactionNow,
            },
            {
              session:
                dbSession,
            }
          );

          /*
           * -------------------------------------------------
           * 13F. MARK TRANSACTION SUCCESSFUL
           * -------------------------------------------------
           */

          transactionSucceeded =
            true;
        }
      );

      /*
       * -----------------------------------------------------
       * VERIFY TRANSACTION
       * -----------------------------------------------------
       */

      if (!transactionSucceeded) {
        return NextResponse.json(
          {
            error:
              "Unable to decline the invitation.",
          },
          {
            status: 409,
          }
        );
      }
    } finally {
      await dbSession.endSession();
    }

    /*
     * -------------------------------------------------------
     * 14. RETURN SUCCESS
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        message:
          "Workspace invitation declined successfully.",

        invitation: {
          id:
            invitation._id?.toString() ??
            null,

          organizationId:
            invitation.organizationId.toString(),

          organizationName:
            organization.name,

          email:
            invitation.email,

          role:
            invitation.role,

          status:
            "declined",

          expiresAt:
            invitation.expiresAt,

          declinedAt:
            new Date(),

          createdAt:
            invitation.createdAt,

          updatedAt:
            new Date(),
        },

        notification: {
          user: {
            actionStatus:
              "declined",

            read:
              true,
          },

          organizationOwner: {
            notified:
              true,

            actionStatus:
              "declined",

            read:
              false,
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /*
     * -------------------------------------------------------
     * EXPECTED BUSINESS ERRORS
     * -------------------------------------------------------
     */

    if (
      error instanceof
      InvitationExpiredError
    ) {
      return NextResponse.json(
        {
          error:
            "This invitation has expired.",
        },
        {
          status: 410,
        }
      );
    }

    if (
      error instanceof
      InvitationAlreadyProcessedError
    ) {
      return NextResponse.json(
        {
          error:
            "This invitation has already been accepted, declined, or is no longer available.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * LOG UNEXPECTED ERROR
     * -------------------------------------------------------
     */

    console.error(
      "Decline organization invitation error:",
      error
    );

    /*
     * -------------------------------------------------------
     * GENERIC SERVER ERROR
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while declining the invitation.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ---------------------------------------------------------
 * CUSTOM BUSINESS ERRORS
 * ---------------------------------------------------------
 */

class InvitationExpiredError extends Error {
  constructor() {
    super("INVITATION_EXPIRED");

    this.name =
      "InvitationExpiredError";
  }
}

class InvitationAlreadyProcessedError extends Error {
  constructor() {
    super(
      "INVITATION_ALREADY_PROCESSED"
    );

    this.name =
      "InvitationAlreadyProcessedError";
  }
}