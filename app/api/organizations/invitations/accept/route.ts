import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongodb";

import {
  getOrganizationsCollection,
} from "@/models/organization";

import {
  getOrganizationMembersCollection,
} from "@/models/organizationMember";

import {
  getOrganizationInvitationsCollection,
} from "@/models/organizationInvitation";

import {
  getNotificationsCollection,
  ensureNotificationIndexes,
} from "@/models/notification";

/**
 * ---------------------------------------------------------
 * VALIDATION
 * ---------------------------------------------------------
 */

const acceptInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "Invitation token is required.")
    .max(256, "Invalid invitation token."),
});

/**
 * ---------------------------------------------------------
 * TOKEN HASHING
 * ---------------------------------------------------------
 *
 * Raw invitation tokens are never stored in MongoDB.
 *
 * The invitation creation endpoint generates a random
 * token and stores only its SHA-256 hash.
 *
 * The raw token is delivered to the invited user.
 *
 * When accepting:
 *
 * raw token
 *     ↓
 * SHA-256
 *     ↓
 * tokenHash
 *     ↓
 * MongoDB lookup
 */

function hashInvitationToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * ---------------------------------------------------------
 * POST /api/organizations/invitations/accept
 * ---------------------------------------------------------
 *
 * Accepts a workspace invitation.
 *
 * Security requirements:
 *
 * 1. User must be authenticated.
 * 2. User ID must be valid.
 * 3. User must have an email address.
 * 4. Token must be valid.
 * 5. Invitation must be pending.
 * 6. Invitation must not be expired.
 * 7. Authenticated email must match invitation email.
 * 8. Organization must still be active.
 * 9. User must not already be an active member.
 * 10. Membership + invitation acceptance happen atomically.
 * 11. Invited user's notification is updated atomically.
 * 12. Organization owner is notified atomically.
 *
 * Notification behavior:
 *
 * INVITATION CREATED
 *        ↓
 * invited user receives notification
 *        ↓
 * user accepts
 *        ↓
 * invited user's notification:
 *     actionStatus = "accepted"
 *     read = true
 *
 *        AND
 *
 * organization owner receives a NEW notification:
 *     title = "Invitation accepted"
 *     read = false
 *     actionStatus = "accepted"
 *
 * The owner notification uses:
 *
 *     recipientId = organization.ownerId
 *     actorId     = accepting user's ID
 *     invitationId
 *
 * This allows the notification system to identify:
 *
 *     who accepted
 *     which organization
 *     which invitation
 */

export async function POST(request: Request) {
  try {
    /**
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

    /**
     * -------------------------------------------------------
     * 2. VALIDATE USER ID
     * -------------------------------------------------------
     */

    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          error:
            "Invalid authenticated user.",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      new ObjectId(session.user.id);

    /**
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

    /**
     * -------------------------------------------------------
     * 4. PARSE REQUEST BODY
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

    /**
     * -------------------------------------------------------
     * 5. VALIDATE REQUEST BODY
     * -------------------------------------------------------
     */

    const validation =
      acceptInvitationSchema.safeParse(body);

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
      validation.data.token;

    /**
     * -------------------------------------------------------
     * 6. HASH INVITATION TOKEN
     * -------------------------------------------------------
     */

    const tokenHash =
      hashInvitationToken(token);

    /**
     * -------------------------------------------------------
     * 7. LOAD DATABASE COLLECTIONS
     * -------------------------------------------------------
     */

    const [
      organizations,
      organizationMembers,
      organizationInvitations,
      notifications,
    ] = await Promise.all([
      getOrganizationsCollection(),

      getOrganizationMembersCollection(),

      getOrganizationInvitationsCollection(),

      getNotificationsCollection(),
    ]);

    /**
     * Ensure notification indexes exist.
     */

    await ensureNotificationIndexes();

    /**
     * -------------------------------------------------------
     * 8. FIND INVITATION
     * -------------------------------------------------------
     *
     * We intentionally search by tokenHash.
     *
     * The raw invitation token should never exist in the
     * database.
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

    /**
     * -------------------------------------------------------
     * 9. CHECK INVITATION STATUS
     * -------------------------------------------------------
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

    /**
     * -------------------------------------------------------
     * 10. CHECK INVITATION EXPIRATION
     * -------------------------------------------------------
     */

    const now = new Date();

    if (
      invitation.expiresAt <= now
    ) {
      /**
       * Mark the invitation as expired.
       *
       * The status condition protects against accidentally
       * modifying an invitation that was changed by another
       * operation.
       */

      await organizationInvitations.updateOne(
        {
          _id:
            invitation._id,

          status:
            "pending",
        },
        {
          $set: {
            status:
              "expired",

            updatedAt:
              now,
          },
        }
      );

      /**
       * If an in-app notification exists for this
       * invitation, update it to reflect that the
       * invitation has expired.
       *
       * The notification is marked as read because
       * there is no longer an action available.
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

            read:
              true,

            updatedAt:
              now,
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

    /**
     * -------------------------------------------------------
     * 11. VERIFY INVITED EMAIL
     * -------------------------------------------------------
     *
     * This prevents someone who obtained the token from
     * accepting an invitation intended for another account.
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

    /**
     * -------------------------------------------------------
     * 12. VERIFY ORGANIZATION
     * -------------------------------------------------------
     */

    const organization =
      await organizations.findOne({
        _id:
          invitation.organizationId,

        status:
          "active",
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

    /**
     * -------------------------------------------------------
     * 13. CHECK EXISTING MEMBERSHIP
     * -------------------------------------------------------
     */

    const existingMembership =
      await organizationMembers.findOne({
        organizationId:
          invitation.organizationId,

        userId,
      });

    /**
     * If the user is already an active member,
     * there is nothing to accept.
     */

    if (
      existingMembership &&
      existingMembership.status ===
        "active"
    ) {
      return NextResponse.json(
        {
          error:
            "You are already a member of this workspace.",
        },
        {
          status: 409,
        }
      );
    }

    /**
     * -------------------------------------------------------
     * 14. START TRANSACTION
     * -------------------------------------------------------
     *
     * MongoDB transactions ensure that:
     *
     * membership creation/reactivation
     *
     * AND
     *
     * invitation acceptance
     *
     * AND
     *
     * invited user's notification update
     *
     * AND
     *
     * organization owner's notification creation
     *
     * either all succeed or all fail.
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
          /**
           * -------------------------------------------------
           * 14A. RE-CHECK INVITATION
           * -------------------------------------------------
           *
           * Another request may have accepted the invitation
           * after our initial lookup.
           *
           * Therefore we MUST re-check the invitation inside
           * the transaction.
           */

          const currentInvitation =
            await organizationInvitations.findOne(
              {
                _id:
                  invitation._id,

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

          /**
           * -------------------------------------------------
           * 14B. RE-CHECK EXPIRATION
           * -------------------------------------------------
           */

          const transactionNow =
            new Date();

          if (
            currentInvitation.expiresAt <=
            transactionNow
          ) {
            await organizationInvitations.updateOne(
              {
                _id:
                  currentInvitation._id,

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

            /**
             * Update the associated in-app notification
             * inside the same transaction.
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

          /**
           * -------------------------------------------------
           * 14C. RE-CHECK MEMBERSHIP
           * -------------------------------------------------
           */

          const membership =
            await organizationMembers.findOne(
              {
                organizationId:
                  currentInvitation.organizationId,

                userId,
              },
              {
                session:
                  dbSession,
              }
            );

          /**
           * If the membership already exists and is active,
           * reject the invitation.
           */

          if (
            membership &&
            membership.status ===
              "active"
          ) {
            throw new AlreadyMemberError();
          }

          /**
           * -------------------------------------------------
           * 14D. CREATE OR REACTIVATE MEMBERSHIP
           * -------------------------------------------------
           */

          if (membership) {
            /**
             * A previous inactive membership exists.
             *
             * Reactivate it with the role granted by the
             * invitation.
             */

            await organizationMembers.updateOne(
              {
                _id:
                  membership._id,
              },
              {
                $set: {
                  role:
                    currentInvitation.role,

                  status:
                    "active",

                  updatedAt:
                    transactionNow,
                },
              },
              {
                session:
                  dbSession,
              }
            );
          } else {
            /**
             * No previous membership exists.
             *
             * Create a new active membership.
             */

            await organizationMembers.insertOne(
              {
                organizationId:
                  currentInvitation.organizationId,

                userId,

                role:
                  currentInvitation.role,

                status:
                  "active",

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
          }

          /**
           * -------------------------------------------------
           * 14E. ACCEPT INVITATION
           * -------------------------------------------------
           *
           * IMPORTANT:
           *
           * The status condition guarantees that only a
           * pending invitation can transition to accepted.
           */

          const invitationUpdate =
            await organizationInvitations.updateOne(
              {
                _id:
                  currentInvitation._id,

                status:
                  "pending",
              },
              {
                $set: {
                  status:
                    "accepted",

                  acceptedBy:
                    userId,

                  acceptedAt:
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

          /**
           * If no invitation was modified, another operation
           * won the race.
           */

          if (
            invitationUpdate.modifiedCount !==
            1
          ) {
            throw new InvitationAlreadyProcessedError();
          }

          /**
           * -------------------------------------------------
           * 14F. UPDATE INVITED USER'S NOTIFICATION
           * -------------------------------------------------
           *
           * The notification created by the invitation
           * creation route has:
           *
           *     invitationId
           *     recipientId
           *     actionStatus: "pending"
           *
           * When the user accepts:
           *
           *     actionStatus → "accepted"
           *     read         → true
           *
           * We intentionally include:
           *
           *     invitationId
           *     recipientId
           *     actionStatus
           *
           * in the query.
           *
           * This prevents unrelated notifications from
           * being modified.
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
                  "accepted",

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

          /**
           * -------------------------------------------------
           * 14G. CREATE OWNER NOTIFICATION
           * -------------------------------------------------
           *
           * The organization owner did not previously have
           * the invitation action notification.
           *
           * Therefore we INSERT a new notification for the
           * organization owner.
           *
           * The owner notification contains:
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
           * This allows the frontend to know:
           *
           *     who accepted
           *     which organization
           *     which invitation
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
                "Invitation accepted",

              message:
                `${authenticatedEmail} accepted your invitation to join ${organization.name}.`,

              invitationId:
                currentInvitation._id,

              read:
                false,

              actionStatus:
                "accepted",

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

          /**
           * -------------------------------------------------
           * 14H. MARK TRANSACTION SUCCESSFUL
           * -------------------------------------------------
           */

          transactionSucceeded =
            true;
        }
      );

      /**
       * Transaction must have completed successfully.
       */

      if (!transactionSucceeded) {
        return NextResponse.json(
          {
            error:
              "Unable to accept the invitation.",
          },
          {
            status: 409,
          }
        );
      }
    } finally {
      await dbSession.endSession();
    }

    /**
     * -------------------------------------------------------
     * 15. RETURN SUCCESS
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        message:
          "Workspace invitation accepted successfully.",

        organization: {
          id:
            organization._id!.toString(),

          name:
            organization.name,

          slug:
            organization.slug,

          description:
            organization.description ??
            null,

          ownerId:
            organization.ownerId.toString(),

          status:
            organization.status,
        },

        membership: {
          organizationId:
            invitation.organizationId.toString(),

          userId:
            userId.toString(),

          role:
            invitation.role,

          status:
            "active",
        },

        notifications: {
          invitedUser: {
            actionStatus:
              "accepted",

            read:
              true,
          },

          organizationOwner: {
            created:
              true,

            actionStatus:
              "accepted",

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
    /**
     * -------------------------------------------------------
     * EXPECTED BUSINESS ERRORS
     * -------------------------------------------------------
     */

    if (
      error instanceof InvitationExpiredError
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
      error instanceof InvitationAlreadyProcessedError
    ) {
      return NextResponse.json(
        {
          error:
            "This invitation has already been accepted or is no longer available.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      error instanceof AlreadyMemberError
    ) {
      return NextResponse.json(
        {
          error:
            "You are already a member of this workspace.",
        },
        {
          status: 409,
        }
      );
    }

    /**
     * -------------------------------------------------------
     * LOG UNEXPECTED ERROR
     * -------------------------------------------------------
     */

    console.error(
      "Accept organization invitation error:",
      error
    );

    /**
     * -------------------------------------------------------
     * GENERIC SERVER ERROR
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while accepting the invitation.",
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
 *
 * These errors allow the transaction to abort cleanly while
 * allowing the outer handler to return an appropriate HTTP
 * response.
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

class AlreadyMemberError extends Error {
  constructor() {
    super("ALREADY_MEMBER");

    this.name =
      "AlreadyMemberError";
  }
}