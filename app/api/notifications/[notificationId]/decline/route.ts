import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongodb";

import {
  getOrganizationInvitationsCollection,
} from "@/models/organizationInvitation";

import {
  getNotificationsCollection,
  ensureNotificationIndexes,
} from "@/models/notification";

/* =========================================================
 * CUSTOM BUSINESS ERRORS
 * ========================================================= */

class NotificationAlreadyProcessedError extends Error {
  constructor() {
    super("NOTIFICATION_ALREADY_PROCESSED");
    this.name = "NotificationAlreadyProcessedError";
  }
}

class InvitationNotFoundError extends Error {
  constructor() {
    super("INVITATION_NOT_FOUND");
    this.name = "InvitationNotFoundError";
  }
}

class InvitationExpiredError extends Error {
  constructor() {
    super("INVITATION_EXPIRED");
    this.name = "InvitationExpiredError";
  }
}

/* =========================================================
 * POST
 * ========================================================= */

/**
 * POST /api/notifications/[notificationId]/decline
 *
 * Declines an organization invitation through its
 * corresponding notification.
 *
 * Security:
 *
 * 1. User must be authenticated.
 * 2. User ID must be valid.
 * 3. User must have an email.
 * 4. Notification ID must be valid.
 * 5. Notification must belong to authenticated user.
 * 6. Notification must be an organization invitation.
 * 7. Notification must have an invitationId.
 * 8. Notification must still be pending.
 * 9. Invitation must still be pending.
 * 10. Invitation email must match authenticated email.
 *
 * Transaction:
 *
 * - Invitation decline
 * - Notification update
 *
 * happen atomically.
 *
 * No membership is created or modified.
 */
export async function POST(
  request: Request,
  context: {
    params: Promise<{
      notificationId: string;
    }>;
  }
) {
  try {
    /* -------------------------------------------------------
     * 1. AUTHENTICATION
     * ------------------------------------------------------- */

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

    /* -------------------------------------------------------
     * 2. VALIDATE USER ID
     * ------------------------------------------------------- */

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

    /* -------------------------------------------------------
     * 3. VALIDATE AUTHENTICATED EMAIL
     * ------------------------------------------------------- */

    const authenticatedEmail =
      session.user.email
        ?.trim()
        .toLowerCase();

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

    /* -------------------------------------------------------
     * 4. VALIDATE NOTIFICATION ID
     * ------------------------------------------------------- */

    const { notificationId } =
      await context.params;

    if (!ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        {
          error:
            "Invalid notification ID.",
        },
        {
          status: 400,
        }
      );
    }

    const notificationObjectId =
      new ObjectId(notificationId);

    /* -------------------------------------------------------
     * 5. GET COLLECTIONS
     * ------------------------------------------------------- */

    const [
      organizationInvitations,
      notifications,
    ] = await Promise.all([
      getOrganizationInvitationsCollection(),
      getNotificationsCollection(),
    ]);

    await ensureNotificationIndexes();

    /* -------------------------------------------------------
     * 6. FIND NOTIFICATION
     * ------------------------------------------------------- */

    const notification =
      await notifications.findOne({
        _id:
          notificationObjectId,

        recipientId:
          userId,
      });

    if (!notification) {
      return NextResponse.json(
        {
          error:
            "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
     * 7. VERIFY NOTIFICATION TYPE
     * ------------------------------------------------------- */

    if (
      notification.type !==
      "organization_invitation"
    ) {
      return NextResponse.json(
        {
          error:
            "This notification does not represent a workspace invitation.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
     * 8. VERIFY INVITATION ID
     * ------------------------------------------------------- */

    if (!notification.invitationId) {
      return NextResponse.json(
        {
          error:
            "This notification is not associated with an invitation.",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
     * 9. VERIFY NOTIFICATION STATE
     * ------------------------------------------------------- */

    if (
      notification.actionStatus &&
      notification.actionStatus !==
        "pending"
    ) {
      return NextResponse.json(
        {
          error:
            "This invitation has already been processed.",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
     * 10. FIND INVITATION
     * ------------------------------------------------------- */

    const invitation =
      await organizationInvitations.findOne({
        _id:
          notification.invitationId,
      });

    if (!invitation) {
      return NextResponse.json(
        {
          error:
            "The invitation associated with this notification could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
     * 11. VERIFY INVITATION STATUS
     * ------------------------------------------------------- */

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

    /* -------------------------------------------------------
     * 12. VERIFY INVITED EMAIL
     * ------------------------------------------------------- */

    const invitationEmail =
      invitation.email
        .trim()
        .toLowerCase();

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

    /* -------------------------------------------------------
     * 13. GET MONGODB CLIENT
     * ------------------------------------------------------- */

    const client =
      await getMongoClient();

    const dbSession =
      client.startSession();

    try {
      let transactionSucceeded =
        false;

      await dbSession.withTransaction(
        async () => {
          /* -------------------------------------------------
           * 13A. RE-CHECK NOTIFICATION
           * ------------------------------------------------- */

          const currentNotification =
            await notifications.findOne(
              {
                _id:
                  notificationObjectId,

                recipientId:
                  userId,

                type:
                  "organization_invitation",

                actionStatus:
                  "pending",
              },
              {
                session:
                  dbSession,
              }
            );

          if (!currentNotification) {
            throw new NotificationAlreadyProcessedError();
          }

          /* -------------------------------------------------
           * 13B. VERIFY INVITATION ID
           * ------------------------------------------------- */

          if (
            !currentNotification.invitationId
          ) {
            throw new InvitationNotFoundError();
          }

          /* -------------------------------------------------
           * 13C. RE-CHECK INVITATION
           * ------------------------------------------------- */

          const currentInvitation =
            await organizationInvitations.findOne(
              {
                _id:
                  currentNotification.invitationId,

                status:
                  "pending",
              },
              {
                session:
                  dbSession,
              }
            );

          if (!currentInvitation) {
            throw new InvitationNotFoundError();
          }

          /* -------------------------------------------------
           * 13D. RE-CHECK EMAIL
           * ------------------------------------------------- */

          const currentInvitationEmail =
            currentInvitation.email
              .trim()
              .toLowerCase();

          if (
            currentInvitationEmail !==
            authenticatedEmail
          ) {
            throw new NotificationAlreadyProcessedError();
          }

          /* -------------------------------------------------
           * 13E. CHECK EXPIRATION
           * ------------------------------------------------- */

          const transactionNow =
            new Date();

          if (
            currentInvitation.expiresAt <=
            transactionNow
          ) {
            /*
             * Keep invitation and notification
             * synchronized.
             */

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

            await notifications.updateOne(
              {
                _id:
                  currentNotification._id,

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

          /* -------------------------------------------------
           * 13F. DECLINE INVITATION
           * ------------------------------------------------- */

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

          if (
            invitationUpdate.modifiedCount !==
            1
          ) {
            throw new NotificationAlreadyProcessedError();
          }

          /* -------------------------------------------------
           * 13G. UPDATE NOTIFICATION
           * ------------------------------------------------- */

          const notificationUpdate =
            await notifications.updateOne(
              {
                _id:
                  currentNotification._id,

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

          if (
            notificationUpdate.modifiedCount !==
            1
          ) {
            throw new NotificationAlreadyProcessedError();
          }

          transactionSucceeded =
            true;
        }
      );

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

    /* -------------------------------------------------------
     * 14. RETURN SUCCESS
     * ------------------------------------------------------- */

    return NextResponse.json(
      {
        message:
          "Workspace invitation declined successfully.",

        notification: {
          id:
            notificationObjectId.toString(),

          read:
            true,

          actionStatus:
            "declined",
        },

        invitation: {
          id:
            invitation._id?.toString() ??
            null,

          organizationId:
            invitation.organizationId.toString(),

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
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    /* -------------------------------------------------------
     * EXPECTED BUSINESS ERRORS
     * ------------------------------------------------------- */

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
      InvitationNotFoundError
    ) {
      return NextResponse.json(
        {
          error:
            "The invitation is no longer available.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof
      NotificationAlreadyProcessedError
    ) {
      return NextResponse.json(
        {
          error:
            "This notification has already been processed.",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
     * UNEXPECTED ERROR
     * ------------------------------------------------------- */

    console.error(
      "Decline notification invitation error:",
      error
    );

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