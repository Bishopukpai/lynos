import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

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
 * DELETE /api/organizations/[organizationId]/invitations/[invitationId]
 *
 * Cancels a pending workspace invitation.
 *
 * Only workspace owners and admins can cancel invitations.
 *
 * Important:
 *
 * The invitation is not physically deleted.
 *
 * Instead, its lifecycle status is changed:
 *
 *     pending → cancelled
 *
 * This preserves an audit trail.
 */
export async function DELETE(
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

    /*
     * -------------------------------------------------------
     * 3. GET + VALIDATE ROUTE PARAMETERS
     * -------------------------------------------------------
     */

    const {
      organizationId,
      invitationId,
    } = await context.params;

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

    if (!ObjectId.isValid(invitationId)) {
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
     * 4. GET COLLECTIONS
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
     * 5. ENSURE INVITATION INDEXES
     * -------------------------------------------------------
     */

    await ensureOrganizationInvitationIndexes();

    /*
     * -------------------------------------------------------
     * 6. VERIFY ORGANIZATION
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
     * 7. VERIFY REQUESTER MEMBERSHIP
     * -------------------------------------------------------
     */

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

    /*
     * -------------------------------------------------------
     * 8. VERIFY AUTHORIZATION
     * -------------------------------------------------------
     *
     * Only owners and admins can cancel
     * workspace invitations.
     */

    if (
      membership.role !== "owner" &&
      membership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to cancel workspace invitations.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 9. FIND INVITATION
     * -------------------------------------------------------
     *
     * The organizationId is included in the query.
     *
     * This prevents an administrator from one
     * workspace manipulating an invitation belonging
     * to another workspace.
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
     * 10. VERIFY INVITATION STATUS
     * -------------------------------------------------------
     *
     * Only pending invitations can be cancelled.
     */

    if (
      invitation.status !== "pending"
    ) {
      return NextResponse.json(
        {
          error:
            `This invitation cannot be cancelled because its current status is "${invitation.status}".`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 11. CANCEL INVITATION
     * -------------------------------------------------------
     */

    const now = new Date();

    const updateResult =
      await organizationInvitations.updateOne(
        {
          _id: invitationObjectId,

          organizationId:
            organizationObjectId,

          status: "pending",
        },
        {
          $set: {
            status: "cancelled",

            cancelledAt: now,

            updatedAt: now,
          },
        }
      );

    /*
     * -------------------------------------------------------
     * 12. HANDLE RACE CONDITION
     * -------------------------------------------------------
     *
     * Another request could have changed the invitation
     * between the initial lookup and the update.
     */

    if (
      updateResult.modifiedCount === 0
    ) {
      return NextResponse.json(
        {
          error:
            "The invitation could not be cancelled because it may have already changed state.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 13. RETURN SUCCESS
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        message:
          "Workspace invitation cancelled successfully.",

        invitation: {
          id:
            invitationObjectId.toString(),

          organizationId:
            organizationObjectId.toString(),

          email:
            invitation.email,

          role:
            invitation.role,

          status:
            "cancelled",

          cancelledAt:
            now,

          updatedAt:
            now,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Cancel organization invitation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while cancelling the invitation.",
      },
      {
        status: 500,
      }
    );
  }
}