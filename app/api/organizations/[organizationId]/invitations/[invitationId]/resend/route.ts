import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { createHash, randomBytes } from "crypto";

import { authOptions } from "@/lib/auth";

import {
  getOrganizationsCollection,
} from "@/models/organization";

import {
  getOrganizationMembersCollection,
} from "@/models/organizationMember";

import {
  getOrganizationInvitationsCollection,
  ensureOrganizationInvitationIndexes,
} from "@/models/organizationInvitation";

/**
 * Invitation lifetime after creation/resend.
 *
 * 7 days.
 */
const INVITATION_EXPIRATION_DAYS = 7;

/**
 * Generates a cryptographically secure invitation token.
 *
 * 32 random bytes = 256 bits of entropy.
 *
 * The raw token is NEVER stored in MongoDB.
 */
function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hashes an invitation token using SHA-256.
 *
 * MongoDB stores only this hash.
 */
function hashInvitationToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * Calculates the expiration date for a new invitation.
 */
function calculateInvitationExpiration(
  from: Date
): Date {
  return new Date(
    from.getTime() +
      INVITATION_EXPIRATION_DAYS *
        24 *
        60 *
        60 *
        1000
  );
}

/**
 * POST
 * /api/organizations/[organizationId]/invitations/[invitationId]/resend
 *
 * Resends an organization invitation.
 *
 * IMPORTANT:
 *
 * Since the application is currently using
 * in-app invitations instead of email invitations,
 * this endpoint does NOT send an email.
 *
 * Instead, it:
 *
 * 1. Generates a new secure invitation token.
 * 2. Invalidates the previous token.
 * 3. Updates tokenHash.
 * 4. Resets the expiration period.
 * 5. Keeps the invitation associated with the
 *    same organization/email/role.
 *
 * Authorization:
 *
 * Only workspace owners and admins can resend
 * invitations.
 *
 * Supported invitation states:
 *
 * - pending
 * - expired
 *
 * Invitations that are already:
 *
 * - accepted
 * - declined
 * - cancelled
 *
 * cannot be resent.
 */
export async function POST(
  request: Request,
  context: {
    params: Promise<{
      organizationId: string;
      invitationId: string;
    }>;
  }
) {
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

    if (
      !ObjectId.isValid(
        session.user.id
      )
    ) {
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

    /*
     * -------------------------------------------------------
     * 3. GET ROUTE PARAMETERS
     * -------------------------------------------------------
     */

    const {
      organizationId,
      invitationId,
    } = await context.params;

    /*
     * -------------------------------------------------------
     * 4. VALIDATE ORGANIZATION ID
     * -------------------------------------------------------
     */

    if (
      !ObjectId.isValid(
        organizationId
      )
    ) {
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

    /*
     * -------------------------------------------------------
     * 5. VALIDATE INVITATION ID
     * -------------------------------------------------------
     */

    if (
      !ObjectId.isValid(
        invitationId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid invitation ID.",
        },
        {
          status: 400,
        }
      );
    }

    const organizationObjectId =
      new ObjectId(organizationId);

    const invitationObjectId =
      new ObjectId(invitationId);

    /*
     * -------------------------------------------------------
     * 6. GET COLLECTIONS
     * -------------------------------------------------------
     */

    const [
      organizations,
      organizationMembers,
      organizationInvitations,
    ] = await Promise.all([
      getOrganizationsCollection(),
      getOrganizationMembersCollection(),
      getOrganizationInvitationsCollection(),
    ]);

    /*
     * -------------------------------------------------------
     * 7. ENSURE INVITATION INDEXES
     * -------------------------------------------------------
     */

    await ensureOrganizationInvitationIndexes();

    /*
     * -------------------------------------------------------
     * 8. VERIFY ORGANIZATION
     * -------------------------------------------------------
     */

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

    /*
     * -------------------------------------------------------
     * 9. VERIFY REQUESTER MEMBERSHIP
     * -------------------------------------------------------
     */

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

    /*
     * -------------------------------------------------------
     * 10. VERIFY AUTHORIZATION
     * -------------------------------------------------------
     *
     * Only owners and admins can resend invitations.
     */

    if (
      requesterMembership.role !==
        "owner" &&
      requesterMembership.role !==
        "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to resend workspace invitations.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 11. FIND INVITATION
     * -------------------------------------------------------
     */

    const invitation =
      await organizationInvitations.findOne({
        _id: invitationObjectId,

        organizationId:
          organizationObjectId,
      });

    if (!invitation) {
      return NextResponse.json(
        {
          error:
            "Invitation not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 12. VERIFY INVITATION STATUS
     * -------------------------------------------------------
     *
     * We allow:
     *
     * pending -> resend
     * expired -> resend
     *
     * We reject:
     *
     * accepted
     * declined
     * cancelled
     */

    if (
      invitation.status !==
        "pending" &&
      invitation.status !==
        "expired"
    ) {
      return NextResponse.json(
        {
          error:
            "Only pending or expired invitations can be resent.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 13. GENERATE NEW TOKEN
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * We intentionally generate a NEW token.
     *
     * The previous token immediately becomes invalid
     * once tokenHash is replaced.
     */

    const newToken =
      generateInvitationToken();

    const newTokenHash =
      hashInvitationToken(
        newToken
      );

    /*
     * -------------------------------------------------------
     * 14. CALCULATE NEW EXPIRATION
     * -------------------------------------------------------
     */

    const now = new Date();

    const newExpiresAt =
      calculateInvitationExpiration(
        now
      );

    /*
     * -------------------------------------------------------
     * 15. UPDATE INVITATION
     * -------------------------------------------------------
     *
     * The update condition includes:
     *
     * - invitation ID
     * - organization ID
     * - allowed status
     *
     * This prevents accidentally modifying an
     * invitation belonging to another organization.
     */

    const updateResult =
      await organizationInvitations.updateOne(
        {
          _id:
            invitationObjectId,

          organizationId:
            organizationObjectId,

          status: {
            $in: [
              "pending",
              "expired",
            ],
          },
        },
        {
          $set: {
            tokenHash:
              newTokenHash,

            status:
              "pending",

            expiresAt:
              newExpiresAt,

            updatedAt:
              now,
          },
        }
      );

    /*
     * -------------------------------------------------------
     * 16. VERIFY UPDATE
     * -------------------------------------------------------
     */

    if (
      updateResult.modifiedCount !== 1
    ) {
      return NextResponse.json(
        {
          error:
            "The invitation could not be resent because its state changed. Please try again.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 17. RETURN RESPONSE
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * tokenHash is NEVER returned.
     *
     * The raw token is returned temporarily because
     * your application is currently being tested without
     * email delivery.
     *
     * Once the in-app notification system is implemented,
     * you should remove the token from this API response.
     */

    return NextResponse.json(
      {
        message:
          "Workspace invitation resent successfully.",

        invitation: {
          id:
            invitationObjectId.toString(),

          organizationId:
            organizationObjectId.toString(),

          organizationName:
            organization.name,

          email:
            invitation.email,

          role:
            invitation.role,

          status:
            "pending",

          expiresAt:
            newExpiresAt,

          previousStatus:
            invitation.status,

          resentBy:
            userId.toString(),

          resentAt:
            now,

          createdAt:
            invitation.createdAt,

          updatedAt:
            now,

          /*
           * TEMPORARY DEVELOPMENT FIELD.
           *
           * This allows you to test the accept/decline
           * endpoints while the in-app notification
           * system is not implemented yet.
           *
           * REMOVE THIS FIELD once the frontend
           * notification system is connected.
           */
          token:
            newToken,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Resend organization invitation error:",
      error
    );

    /*
     * -------------------------------------------------------
     * DUPLICATE TOKEN HASH
     * -------------------------------------------------------
     */

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            "A secure invitation token conflict occurred. Please try resending the invitation again.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * GENERIC SERVER ERROR
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while resending the invitation.",
      },
      {
        status: 500,
      }
    );
  }
}