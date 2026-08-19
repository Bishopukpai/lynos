import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

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

/* =========================================================
 * CUSTOM BUSINESS ERRORS
 * ========================================================= */

class NotificationNotFoundError extends Error {
  constructor() {
    super("NOTIFICATION_NOT_FOUND");
    this.name = "NotificationNotFoundError";
  }
}

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

class InvitationAlreadyProcessedError extends Error {
  constructor() {
    super("INVITATION_ALREADY_PROCESSED");
    this.name = "InvitationAlreadyProcessedError";
  }
}

class InvitationExpiredError extends Error {
  constructor() {
    super("INVITATION_EXPIRED");
    this.name = "InvitationExpiredError";
  }
}

class AlreadyMemberError extends Error {
  constructor() {
    super("ALREADY_MEMBER");
    this.name = "AlreadyMemberError";
  }
}

class InvitationEmailMismatchError extends Error {
  constructor() {
    super("INVITATION_EMAIL_MISMATCH");
    this.name = "InvitationEmailMismatchError";
  }
}

/* =========================================================
 * RESPONSE TYPES
 * ========================================================= */

type AcceptedOrganization = {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  ownerId: ObjectId;
  status: string;
};

type AcceptedInvitation = {
  organizationId: ObjectId;
  role: "admin" | "member";
};

type TransactionResult = {
  acceptedOrganization: AcceptedOrganization;
  acceptedInvitation: AcceptedInvitation;
};

/* =========================================================
 * POST
 * ========================================================= */

/**
 * POST /api/notifications/[notificationId]/accept
 *
 * Accepts an organization invitation through its
 * corresponding notification.
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

    const session = await getServerSession(authOptions);

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

    const userId = new ObjectId(session.user.id);

    /* -------------------------------------------------------
     * 3. VALIDATE AUTHENTICATED EMAIL
     * ------------------------------------------------------- */

    const authenticatedEmail = session.user.email
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

    const { notificationId } = await context.params;

    if (!ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        {
          error: "Invalid notification ID.",
        },
        {
          status: 400,
        }
      );
    }

    const notificationObjectId = new ObjectId(notificationId);

    /* -------------------------------------------------------
     * 5. GET COLLECTIONS
     * ------------------------------------------------------- */

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

    await ensureNotificationIndexes();

    /* -------------------------------------------------------
     * 6. FIND NOTIFICATION
     * ------------------------------------------------------- */

    const notification = await notifications.findOne({
      _id: notificationObjectId,
      recipientId: userId,
    });

    if (!notification) {
      return NextResponse.json(
        {
          error: "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
     * 7. VERIFY NOTIFICATION TYPE
     * ------------------------------------------------------- */

    if (notification.type !== "organization_invitation") {
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
     * 9. VERIFY NOTIFICATION ACTION STATE
     * ------------------------------------------------------- */

    if (
      notification.actionStatus &&
      notification.actionStatus !== "pending"
    ) {
      return NextResponse.json(
        {
          error: "This invitation has already been processed.",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
     * 10. FIND INVITATION
     * ------------------------------------------------------- */

    const invitation = await organizationInvitations.findOne({
      _id: notification.invitationId,
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

    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          error: "This invitation is no longer available.",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
     * 12. VERIFY INVITATION EMAIL
     * ------------------------------------------------------- */

    const invitationEmail = invitation.email
      .trim()
      .toLowerCase();

    if (invitationEmail !== authenticatedEmail) {
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
     * 13. VERIFY EXPIRATION
     * ------------------------------------------------------- */

    const now = new Date();

    if (invitation.expiresAt <= now) {
      const client = await getMongoClient();
      const dbSession = client.startSession();

      try {
        await dbSession.withTransaction(async () => {
          const currentInvitation =
            await organizationInvitations.findOne(
              {
                _id: invitation._id,
                status: "pending",
              },
              { session: dbSession }
            );

          if (currentInvitation) {
            await organizationInvitations.updateOne(
              {
                _id: currentInvitation._id,
                status: "pending",
              },
              {
                $set: {
                  status: "expired",
                  updatedAt: now,
                },
              },
              { session: dbSession }
            );
          }

          await notifications.updateOne(
            {
              _id: notificationObjectId,
              recipientId: userId,
              actionStatus: "pending",
            },
            {
              $set: {
                actionStatus: "expired",
                read: true,
                updatedAt: now,
              },
            },
            { session: dbSession }
          );
        });
      } finally {
        await dbSession.endSession();
      }

      return NextResponse.json(
        {
          error: "This invitation has expired.",
        },
        {
          status: 410,
        }
      );
    }

    /* -------------------------------------------------------
     * 14. START TRANSACTION & RETURN DATA DIRECTLY
     * ------------------------------------------------------- */

    const client = await getMongoClient();
    const dbSession = client.startSession();

    let transactionData: TransactionResult | null = null;

    try {
      transactionData = await dbSession.withTransaction(
        async (): Promise<TransactionResult> => {
          /* -------------------------------------------------
           * 14A. RE-CHECK NOTIFICATION
           * ------------------------------------------------- */

          const currentNotification =
            await notifications.findOne(
              {
                _id: notificationObjectId,
                recipientId: userId,
                type: "organization_invitation",
                actionStatus: "pending",
              },
              { session: dbSession }
            );

          if (!currentNotification) {
            throw new NotificationAlreadyProcessedError();
          }

          /* -------------------------------------------------
           * 14B. VERIFY INVITATION ID
           * ------------------------------------------------- */

          if (!currentNotification.invitationId) {
            throw new InvitationNotFoundError();
          }

          /* -------------------------------------------------
           * 14C. RE-CHECK INVITATION
           * ------------------------------------------------- */

          const currentInvitation =
            await organizationInvitations.findOne(
              {
                _id: currentNotification.invitationId,
                status: "pending",
              },
              { session: dbSession }
            );

          if (!currentInvitation) {
            throw new InvitationNotFoundError();
          }

          /* -------------------------------------------------
           * 14D. RE-CHECK EXPIRATION
           * ------------------------------------------------- */

          const transactionNow = new Date();

          if (currentInvitation.expiresAt <= transactionNow) {
            await organizationInvitations.updateOne(
              {
                _id: currentInvitation._id,
                status: "pending",
              },
              {
                $set: {
                  status: "expired",
                  updatedAt: transactionNow,
                },
              },
              { session: dbSession }
            );

            await notifications.updateOne(
              {
                _id: currentNotification._id,
                recipientId: userId,
                actionStatus: "pending",
              },
              {
                $set: {
                  actionStatus: "expired",
                  read: true,
                  updatedAt: transactionNow,
                },
              },
              { session: dbSession }
            );

            throw new InvitationExpiredError();
          }

          /* -------------------------------------------------
           * 14E. RE-CHECK EMAIL
           * ------------------------------------------------- */

          const currentInvitationEmail = currentInvitation.email
            .trim()
            .toLowerCase();

          if (currentInvitationEmail !== authenticatedEmail) {
            throw new InvitationEmailMismatchError();
          }

          /* -------------------------------------------------
           * 14F. VERIFY ORGANIZATION
           * ------------------------------------------------- */

          const currentOrganization =
            await organizations.findOne(
              {
                _id: currentInvitation.organizationId,
                status: "active",
              },
              { session: dbSession }
            );

          if (!currentOrganization) {
            throw new InvitationNotFoundError();
          }

          /* -------------------------------------------------
           * 14G. RE-CHECK MEMBERSHIP
           * ------------------------------------------------- */

          const membership =
            await organizationMembers.findOne(
              {
                organizationId: currentInvitation.organizationId,
                userId,
              },
              { session: dbSession }
            );

          if (membership && membership.status === "active") {
            throw new AlreadyMemberError();
          }

          /* -------------------------------------------------
           * 14H. CREATE OR REACTIVATE MEMBERSHIP
           * ------------------------------------------------- */

          if (membership) {
            await organizationMembers.updateOne(
              { _id: membership._id },
              {
                $set: {
                  role: currentInvitation.role,
                  status: "active",
                  updatedAt: transactionNow,
                },
              },
              { session: dbSession }
            );
          } else {
            await organizationMembers.insertOne(
              {
                organizationId: currentInvitation.organizationId,
                userId,
                role: currentInvitation.role,
                status: "active",
                createdAt: transactionNow,
                updatedAt: transactionNow,
              },
              { session: dbSession }
            );
          }

          /* -------------------------------------------------
           * 14I. ACCEPT INVITATION
           * ------------------------------------------------- */

          const invitationUpdate =
            await organizationInvitations.updateOne(
              {
                _id: currentInvitation._id,
                status: "pending",
              },
              {
                $set: {
                  status: "accepted",
                  acceptedBy: userId,
                  acceptedAt: transactionNow,
                  updatedAt: transactionNow,
                },
              },
              { session: dbSession }
            );

          if (invitationUpdate.modifiedCount !== 1) {
            throw new InvitationAlreadyProcessedError();
          }

          /* -------------------------------------------------
           * 14J. UPDATE NOTIFICATION
           * ------------------------------------------------- */

          const notificationUpdate =
            await notifications.updateOne(
              {
                _id: currentNotification._id,
                recipientId: userId,
                actionStatus: "pending",
              },
              {
                $set: {
                  actionStatus: "accepted",
                  read: true,
                  updatedAt: transactionNow,
                },
              },
              { session: dbSession }
            );

          if (notificationUpdate.modifiedCount !== 1) {
            throw new NotificationAlreadyProcessedError();
          }

          /* -------------------------------------------------
           * 14K. RETURN RESPONSE DATA DIRECTLY FROM TRANSACTION
           * ------------------------------------------------- */

          return {
            acceptedOrganization: {
              _id: currentOrganization._id as ObjectId,
              name: currentOrganization.name,
              slug: currentOrganization.slug,
              description: currentOrganization.description ?? null,
              ownerId: currentOrganization.ownerId as ObjectId,
              status: currentOrganization.status,
            },
            acceptedInvitation: {
              organizationId: currentInvitation.organizationId,
              role: currentInvitation.role,
            },
          };
        }
      );
    } finally {
      await dbSession.endSession();
    }

    /* -------------------------------------------------------
     * 15. VERIFY TRANSACTION RESULTS
     * ------------------------------------------------------- */

    if (!transactionData) {
      return NextResponse.json(
        {
          error: "Unable to accept the invitation.",
        },
        {
          status: 409,
        }
      );
    }

    const { acceptedOrganization, acceptedInvitation } =
      transactionData;

    /* -------------------------------------------------------
     * 16. RETURN SUCCESS
     * ------------------------------------------------------- */

    return NextResponse.json(
      {
        message: "Workspace invitation accepted successfully.",

        notification: {
          id: notificationObjectId.toString(),
          read: true,
          actionStatus: "accepted",
        },

        organization: {
          id: acceptedOrganization._id.toString(),
          name: acceptedOrganization.name,
          slug: acceptedOrganization.slug,
          description: acceptedOrganization.description ?? null,
          ownerId: acceptedOrganization.ownerId.toString(),
          status: acceptedOrganization.status,
        },

        membership: {
          organizationId: acceptedInvitation.organizationId.toString(),
          userId: userId.toString(),
          role: acceptedInvitation.role,
          status: "active",
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

    if (error instanceof InvitationExpiredError) {
      return NextResponse.json(
        {
          error: "This invitation has expired.",
        },
        {
          status: 410,
        }
      );
    }

    if (error instanceof InvitationAlreadyProcessedError) {
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

    if (error instanceof NotificationAlreadyProcessedError) {
      return NextResponse.json(
        {
          error: "This notification has already been processed.",
        },
        {
          status: 409,
        }
      );
    }

    if (error instanceof AlreadyMemberError) {
      return NextResponse.json(
        {
          error: "You are already a member of this workspace.",
        },
        {
          status: 409,
        }
      );
    }

    if (error instanceof InvitationNotFoundError) {
      return NextResponse.json(
        {
          error: "The invitation is no longer available.",
        },
        {
          status: 404,
        }
      );
    }

    if (error instanceof NotificationNotFoundError) {
      return NextResponse.json(
        {
          error: "This notification is no longer available.",
        },
        {
          status: 404,
        }
      );
    }

    if (error instanceof InvitationEmailMismatchError) {
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
     * UNEXPECTED ERROR
     * ------------------------------------------------------- */

    console.error("Accept notification invitation error:", error);

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