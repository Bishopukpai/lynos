import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { createHash, randomBytes } from "crypto";
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
  ensureOrganizationInvitationIndexes,
  type OrganizationInvitationStatus,
} from "@/models/organizationInvitation";

import {
  getNotificationsCollection,
  ensureNotificationIndexes,
} from "@/models/notification";

/* =========================================================
 * VALIDATION
 * ========================================================= */

const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(320, "Email address is too long."),

  role: z
    .enum(["admin", "member"])
    .default("member"),
});

/* =========================================================
 * CONSTANTS
 * ========================================================= */

const INVITATION_EXPIRATION_DAYS = 7;

const ALLOWED_INVITATION_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
] as const;

/* =========================================================
 * HELPERS
 * ========================================================= */

/**
 * Generates a cryptographically secure invitation token.
 *
 * The raw token is never stored in MongoDB.
 */
function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hashes an invitation token using SHA-256.
 *
 * MongoDB stores only the hash.
 */
function hashInvitationToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * Normalizes an email address.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Converts a MongoDB ObjectId into a string safely.
 */
function serializeObjectId(
  value?: ObjectId
): string | null {
  return value ? value.toString() : null;
}

/**
 * Checks whether a value is a valid invitation status.
 */
function isValidInvitationStatus(
  value: string
): value is OrganizationInvitationStatus {
  return (
    ALLOWED_INVITATION_STATUSES as readonly string[]
  ).includes(value);
}

/* =========================================================
 * POST
 * ========================================================= */

/**
 * POST /api/organizations/[organizationId]/invitations
 *
 * Creates an invitation for a user to join
 * a workspace.
 *
 * Only workspace owners and admins can
 * invite users.
 *
 * If the invited email belongs to an existing
 * LYNOS user, an in-app notification is also
 * created for that user.
 *
 * The notification is linked to the invitation
 * through invitationId and starts with:
 *
 * actionStatus: "pending"
 */
export async function POST(
  request: Request,
  context: {
    params: Promise<{
      organizationId: string;
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
     * 2. VALIDATE AUTHENTICATED USER ID
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

    const userId = new ObjectId(
      session.user.id
    );

    /* -------------------------------------------------------
     * 3. VALIDATE ORGANIZATION ID
     * ------------------------------------------------------- */

    const { organizationId } =
      await context.params;

    if (!ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        {
          error: "Invalid organization ID.",
        },
        {
          status: 400,
        }
      );
    }

    const organizationObjectId =
      new ObjectId(organizationId);

    /* -------------------------------------------------------
     * 4. VALIDATE REQUEST BODY
     * ------------------------------------------------------- */

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
      createInvitationSchema.safeParse(body);

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

    const email = normalizeEmail(
      validation.data.email
    );

    const role = validation.data.role;

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

    /* -------------------------------------------------------
     * 6. ENSURE REQUIRED INDEXES
     * ------------------------------------------------------- */

    await Promise.all([
      ensureOrganizationInvitationIndexes(),
      ensureNotificationIndexes(),
    ]);

    /* -------------------------------------------------------
     * 7. VERIFY ORGANIZATION
     * ------------------------------------------------------- */

    const organization =
      await organizations.findOne({
        _id: organizationObjectId,
        status: "active",
      });

    if (!organization) {
      return NextResponse.json(
        {
          error: "Workspace not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
     * 8. VERIFY REQUESTER MEMBERSHIP
     * ------------------------------------------------------- */

    const requesterMembership =
      await organizationMembers.findOne({
        organizationId:
          organizationObjectId,

        userId,

        status: "active",
      });

    if (!requesterMembership) {
      return NextResponse.json(
        {
          error:
            "You are not an active member of this workspace.",
        },
        {
          status: 403,
        }
      );
    }

    /* -------------------------------------------------------
     * 9. VERIFY REQUESTER AUTHORIZATION
     * ------------------------------------------------------- */

    if (
      requesterMembership.role !== "owner" &&
      requesterMembership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to invite users to this workspace.",
        },
        {
          status: 403,
        }
      );
    }

    /* -------------------------------------------------------
     * 10. PREVENT SELF-INVITATION
     * ------------------------------------------------------- */

    const requesterEmail =
      session.user.email
        ? normalizeEmail(
            session.user.email
          )
        : null;

    if (
      requesterEmail &&
      requesterEmail === email
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot invite yourself to your own workspace.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
     * 11. GET USERS COLLECTION
     * ------------------------------------------------------- */

    const client =
      await getMongoClient();

    /*
     * The database name is embedded inside
     * MONGODB_URI.
     *
     * Therefore:
     *
     *     client.db()
     *
     * is intentionally used.
     */

    const db = client.db();

    const users = db.collection<{
      _id?: ObjectId;
      email?: string;
    }>("users");

    /* -------------------------------------------------------
     * 12. CHECK EXISTING USER
     * ------------------------------------------------------- */

    const existingUser =
      await users.findOne({
        email,
      });

    /* -------------------------------------------------------
     * 13. CHECK EXISTING MEMBERSHIP
     * ------------------------------------------------------- */

    if (existingUser?._id) {
      const existingMembership =
        await organizationMembers.findOne({
          organizationId:
            organizationObjectId,

          userId:
            existingUser._id,
        });

      if (
        existingMembership &&
        existingMembership.status ===
          "active"
      ) {
        return NextResponse.json(
          {
            error:
              "This user is already a member of the workspace.",
          },
          {
            status: 409,
          }
        );
      }
    }

    /* -------------------------------------------------------
     * 14. CHECK EXISTING PENDING INVITATION
     * ------------------------------------------------------- */

    const existingInvitation =
      await organizationInvitations.findOne({
        organizationId:
          organizationObjectId,

        email,

        status: "pending",
      });

    if (existingInvitation) {
      return NextResponse.json(
        {
          error:
            "A pending invitation already exists for this email address.",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
     * 15. GENERATE INVITATION TOKEN
     * ------------------------------------------------------- */

    const invitationId =
      new ObjectId();

    const token =
      generateInvitationToken();

    const tokenHash =
      hashInvitationToken(token);

    const now = new Date();

    const expiresAt =
      new Date(
        now.getTime() +
          INVITATION_EXPIRATION_DAYS *
            24 *
            60 *
            60 *
            1000
      );

    /* -------------------------------------------------------
     * 16. CREATE INVITATION DOCUMENT
     * ------------------------------------------------------- */

    const invitation = {
      _id: invitationId,

      organizationId:
        organizationObjectId,

      invitedBy: userId,

      email,

      role,

      /*
       * SECURITY:
       *
       * Only the SHA-256 hash is stored.
       *
       * The raw token is never persisted.
       */
      tokenHash,

      status: "pending" as const,

      expiresAt,

      createdAt: now,

      updatedAt: now,
    };

    /* -------------------------------------------------------
     * 17. INSERT INVITATION
     * ------------------------------------------------------- */

    await organizationInvitations.insertOne(
      invitation
    );

    /* -------------------------------------------------------
     * 18. CREATE IN-APP NOTIFICATION
     * ------------------------------------------------------- */

    /*
     * Only registered users receive an immediate
     * in-app notification.
     *
     * If the email does not belong to an existing
     * user, the invitation still exists and can
     * later be delivered through email.
     *
     * IMPORTANT:
     *
     * The notification references the exact
     * invitation through invitationId.
     *
     * The invitation is initially pending, so
     * the notification must also start with:
     *
     *     actionStatus: "pending"
     *
     * Later invitation actions such as accept,
     * decline, cancellation, or expiration should
     * update both the invitation status and the
     * corresponding notification actionStatus.
     */

    let notificationId: ObjectId | null = null;

    if (existingUser?._id) {
      notificationId = new ObjectId();

      await notifications.insertOne({
        _id: notificationId,

        recipientId:
          existingUser._id,

        organizationId:
          organizationObjectId,

        actorId:
          userId,

        type:
          "organization_invitation",

        title:
          "Workspace invitation",

        message:
          `${organization.name} has invited you to join their workspace as a ${role}.`,

        invitationId,

        read: false,

        actionStatus:
          "pending",

        createdAt: now,

        updatedAt: now,
      });
    }

    /* -------------------------------------------------------
     * 19. RETURN RESPONSE
     * ------------------------------------------------------- */

    return NextResponse.json(
      {
        message:
          "Workspace invitation created successfully.",

        invitation: {
          id:
            invitationId.toString(),

          organizationId:
            organizationObjectId.toString(),

          organizationName:
            organization.name,

          email:
            invitation.email,

          role:
            invitation.role,

          status:
            invitation.status,

          expiresAt:
            invitation.expiresAt,

          createdAt:
            invitation.createdAt,

          /*
           * TEMPORARY DEVELOPMENT TOKEN.
           *
           * Remove this when email delivery
           * is implemented.
           */
          token,
        },

        notification:
          notificationId
            ? {
                id:
                  notificationId.toString(),

                recipientId:
                  existingUser!._id!.toString(),

                invitationId:
                  invitationId.toString(),

                actionStatus:
                  "pending",

                read: false,
              }
            : null,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create organization invitation error:",
      error
    );

    /* -------------------------------------------------------
     * DUPLICATE KEY
     * ------------------------------------------------------- */

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            "A pending invitation already exists for this email address.",
        },
        {
          status: 409,
        }
      );
    }

    /* -------------------------------------------------------
     * GENERIC ERROR
     * ------------------------------------------------------- */

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while creating the invitation.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
 * GET
 * ========================================================= */

/**
 * GET /api/organizations/[organizationId]/invitations
 *
 * Lists invitations belonging to a workspace.
 *
 * Only workspace owners and admins can view
 * workspace invitations.
 *
 * Supported query parameters:
 *
 * ?status=pending
 * ?status=accepted
 * ?status=declined
 * ?status=cancelled
 * ?status=expired
 *
 * Pagination:
 *
 * ?page=1
 * ?limit=20
 */
export async function GET(
  request: Request,
  context: {
    params: Promise<{
      organizationId: string;
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

    /* -------------------------------------------------------
     * 3. VALIDATE ORGANIZATION ID
     * ------------------------------------------------------- */

    const { organizationId } =
      await context.params;

    if (!ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        {
          error:
            "Invalid organization ID.",
        },
        {
          status: 400,
        }
      );
    }

    const organizationObjectId =
      new ObjectId(organizationId);

    /* -------------------------------------------------------
     * 4. GET COLLECTIONS
     * ------------------------------------------------------- */

    const [
      organizations,
      organizationMembers,
      organizationInvitations,
    ] = await Promise.all([
      getOrganizationsCollection(),
      getOrganizationMembersCollection(),
      getOrganizationInvitationsCollection(),
    ]);

    await ensureOrganizationInvitationIndexes();

    /* -------------------------------------------------------
     * 5. VERIFY ORGANIZATION
     * ------------------------------------------------------- */

    const organization =
      await organizations.findOne({
        _id: organizationObjectId,
        status: "active",
      });

    if (!organization) {
      return NextResponse.json(
        {
          error:
            "Workspace not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
     * 6. VERIFY MEMBERSHIP
     * ------------------------------------------------------- */

    const membership =
      await organizationMembers.findOne({
        organizationId:
          organizationObjectId,

        userId,

        status: "active",
      });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You are not an active member of this workspace.",
        },
        {
          status: 403,
        }
      );
    }

    /* -------------------------------------------------------
     * 7. VERIFY AUTHORIZATION
     * ------------------------------------------------------- */

    if (
      membership.role !== "owner" &&
      membership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view workspace invitations.",
        },
        {
          status: 403,
        }
      );
    }

    /* -------------------------------------------------------
     * 8. QUERY PARAMETERS
     * ------------------------------------------------------- */

    const url =
      new URL(request.url);

    const requestedStatus =
      url.searchParams.get(
        "status"
      );

    let statusFilter:
      | OrganizationInvitationStatus
      | undefined;

    if (requestedStatus) {
      if (
        !isValidInvitationStatus(
          requestedStatus
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid invitation status.",

            allowedStatuses:
              ALLOWED_INVITATION_STATUSES,
          },
          {
            status: 400,
          }
        );
      }

      statusFilter =
        requestedStatus;
    }

    /* -------------------------------------------------------
     * 9. PAGINATION
     * ------------------------------------------------------- */

    const pageParameter =
      url.searchParams.get(
        "page"
      );

    const limitParameter =
      url.searchParams.get(
        "limit"
      );

    const rawPage =
      pageParameter === null
        ? 1
        : Number(pageParameter);

    const rawLimit =
      limitParameter === null
        ? 20
        : Number(limitParameter);

    /*
     * Reject malformed pagination
     * parameters rather than silently
     * accepting them.
     */

    if (
      !Number.isInteger(rawPage) ||
      rawPage < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Page must be a positive integer.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(rawLimit) ||
      rawLimit < 1 ||
      rawLimit > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Limit must be an integer between 1 and 100.",
        },
        {
          status: 400,
        }
      );
    }

    const page = rawPage;

    const limit = rawLimit;

    const skip =
      (page - 1) * limit;

    /* -------------------------------------------------------
     * 10. BUILD QUERY
     * ------------------------------------------------------- */

    const query: {
      organizationId: ObjectId;
      status?:
        OrganizationInvitationStatus;
    } = {
      organizationId:
        organizationObjectId,
    };

    if (statusFilter) {
      query.status =
        statusFilter;
    }

    /* -------------------------------------------------------
     * 11. QUERY INVITATIONS
     * ------------------------------------------------------- */

    const [
      invitations,
      total,
    ] = await Promise.all([
      organizationInvitations
        .find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .toArray(),

      organizationInvitations.countDocuments(
        query
      ),
    ]);

    /* -------------------------------------------------------
     * 12. SERIALIZE RESPONSE
     * ------------------------------------------------------- */

    /*
     * SECURITY:
     *
     * tokenHash is intentionally excluded.
     *
     * Raw invitation tokens are never returned
     * by the GET endpoint.
     */

    const serializedInvitations =
      invitations.map(
        (invitation) => ({
          id:
            serializeObjectId(
              invitation._id
            ),

          organizationId:
            invitation.organizationId.toString(),

          email:
            invitation.email,

          role:
            invitation.role,

          status:
            invitation.status,

          invitedBy:
            invitation.invitedBy.toString(),

          expiresAt:
            invitation.expiresAt,

          acceptedBy:
            serializeObjectId(
              invitation.acceptedBy
            ),

          acceptedAt:
            invitation.acceptedAt ??
            null,

          declinedAt:
            invitation.declinedAt ??
            null,

          cancelledAt:
            invitation.cancelledAt ??
            null,

          createdAt:
            invitation.createdAt,

          updatedAt:
            invitation.updatedAt,
        })
      );

    /* -------------------------------------------------------
     * 13. PAGINATION METADATA
     * ------------------------------------------------------- */

    const totalPages =
      Math.ceil(
        total / limit
      );

    const hasNextPage =
      skip +
        invitations.length <
      total;

    const hasPreviousPage =
      page > 1;

    /* -------------------------------------------------------
     * 14. RETURN RESPONSE
     * ------------------------------------------------------- */

    return NextResponse.json(
      {
        organization: {
          id:
            organization._id!.toString(),

          name:
            organization.name,

          slug:
            organization.slug,
        },

        invitations:
          serializedInvitations,

        pagination: {
          page,

          limit,

          total,

          totalPages,

          hasNextPage,

          hasPreviousPage,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "List organization invitations error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while loading workspace invitations.",
      },
      {
        status: 500,
      }
    );
  }
}
