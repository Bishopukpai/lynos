import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  getOrganizationMembersCollection,
  ensureOrganizationMemberIndexes,
} from "@/models/organizationMember";
import {
  getOrganizationsCollection,
  ensureOrganizationIndexes,
} from "@/models/organization";

const switchOrganizationSchema = z.object({
  organizationId: z
    .string()
    .trim()
    .min(1, "Organization ID is required."),
});

/**
 * POST /api/organizations/switch
 *
 * Switches the authenticated user's active workspace.
 *
 * Security:
 *
 * - Requires authentication.
 * - Organization ID must be a valid MongoDB ObjectId.
 * - User must have an active membership.
 * - Organization must be active.
 * - Suspended members cannot switch into the organization.
 *
 * The selected organization ID is then stored in the
 * NextAuth JWT through the session update mechanism.
 */
export async function POST(request: Request) {
  try {
    /*
     * -------------------------------------------------------
     * 1. AUTHENTICATION
     * -------------------------------------------------------
     */

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

    /*
     * -------------------------------------------------------
     * 2. VALIDATE USER ID
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

    const userId = new ObjectId(session.user.id);

    /*
     * -------------------------------------------------------
     * 3. PARSE REQUEST BODY
     * -------------------------------------------------------
     */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 4. VALIDATE REQUEST
     * -------------------------------------------------------
     */

    const validation =
      switchOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid organization data.",
          details: validation.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const { organizationId } =
      validation.data;

    /*
     * -------------------------------------------------------
     * 5. VALIDATE ORGANIZATION ID
     * -------------------------------------------------------
     */

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

    /*
     * -------------------------------------------------------
     * 6. GET COLLECTIONS
     * -------------------------------------------------------
     */

    const [
      organizations,
      organizationMembers,
    ] = await Promise.all([
      getOrganizationsCollection(),
      getOrganizationMembersCollection(),
    ]);

    /*
     * -------------------------------------------------------
     * 7. ENSURE INDEXES
     * -------------------------------------------------------
     */

    await Promise.all([
      ensureOrganizationIndexes(),
      ensureOrganizationMemberIndexes(),
    ]);

    /*
     * -------------------------------------------------------
     * 8. VERIFY ORGANIZATION
     * -------------------------------------------------------
     *
     * The organization must:
     *
     * - exist
     * - be active
     */

    const organization =
      await organizations.findOne({
        _id: organizationObjectId,
        status: "active",
      });

    if (!organization) {
      return NextResponse.json(
        {
          error: "Workspace not found or inactive.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 9. VERIFY MEMBERSHIP
     * -------------------------------------------------------
     *
     * This is the important authorization boundary.
     *
     * A user cannot switch into a workspace simply because
     * they know its organization ID.
     *
     * They must have an ACTIVE membership.
     */

    const membership =
      await organizationMembers.findOne({
        organizationId: organizationObjectId,
        userId,
        status: "active",
      });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have access to this workspace.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 10. UPDATE SESSION
     * -------------------------------------------------------
     *
     * NextAuth's JWT callback handles the persistence of
     * activeOrganizationId.
     *
     * The frontend will call:
     *
     * update({
     *   activeOrganizationId: organizationId
     * })
     *
     * after this authorization check succeeds.
     *
     * The API itself cannot directly mutate the JWT through
     * getServerSession().
     *
     * Therefore we return the authorized organization and
     * membership information to the client.
     */

    return NextResponse.json(
      {
        message:
          "Workspace switch authorized successfully.",

        organization: {
          id: organization._id!.toString(),
          name: organization.name,
          slug: organization.slug,
          description:
            organization.description ?? null,
          ownerId:
            organization.ownerId.toString(),
          status: organization.status,
        },

        membership: {
          organizationId:
            membership.organizationId.toString(),
          userId:
            membership.userId.toString(),
          role: membership.role,
          status: membership.status,
        },

        activeOrganizationId:
          organization._id!.toString(),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Switch organization error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while switching workspaces.",
      },
      {
        status: 500,
      }
    );
  }
}