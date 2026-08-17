import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongodb";

import {
  getOrganizationsCollection,
  ensureOrganizationIndexes,
} from "@/models/organization";

import {
  getOrganizationMembersCollection,
  ensureOrganizationMemberIndexes,
} from "@/models/organizationMember";

/**
 * ---------------------------------------------------------
 * CREATE ORGANIZATION VALIDATION
 * ---------------------------------------------------------
 */

const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Workspace name must be at least 2 characters."
    )
    .max(
      100,
      "Workspace name must not exceed 100 characters."
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Workspace description must not exceed 500 characters."
    )
    .optional(),
});

/**
 * ---------------------------------------------------------
 * SLUG GENERATOR
 * ---------------------------------------------------------
 *
 * Example:
 *
 * "My Production Studio"
 * →
 * "my-production-studio"
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * ---------------------------------------------------------
 * POST /api/organizations
 * ---------------------------------------------------------
 *
 * Creates a new workspace and automatically makes
 * the authenticated user its owner.
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
     * 4. VALIDATE REQUEST BODY
     * -------------------------------------------------------
     */

    const validation =
      createOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid workspace data.",
          details: validation.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const {
      name,
      description,
    } = validation.data;

    /*
     * -------------------------------------------------------
     * 5. GENERATE SLUG
     * -------------------------------------------------------
     */

    const slug = createSlug(name);

    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Workspace name must contain at least one valid character.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 6. GET COLLECTIONS
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * The MongoDB database name is already embedded
     * inside MONGODB_URI.
     *
     * Therefore the model functions use:
     *
     * client.db()
     *
     * and we do NOT use MONGODB_DB here.
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
     * 8. CREATE TRANSACTION
     * -------------------------------------------------------
     */

    const client = await getMongoClient();

    const dbSession = client.startSession();

    const now = new Date();

    const organizationId = new ObjectId();

    const organization = {
      _id: organizationId,

      name,

      slug,

      ownerId: userId,

      ...(description
        ? {
            description,
          }
        : {}),

      status: "active" as const,

      createdAt: now,

      updatedAt: now,
    };

    try {
      await dbSession.withTransaction(
        async () => {
          /*
           * ---------------------------------------------------
           * CREATE ORGANIZATION
           * ---------------------------------------------------
           */

          await organizations.insertOne(
            organization,
            {
              session: dbSession,
            }
          );

          /*
           * ---------------------------------------------------
           * CREATE OWNER MEMBERSHIP
           * ---------------------------------------------------
           */

          await organizationMembers.insertOne(
            {
              organizationId,

              userId,

              role: "owner",

              status: "active",

              createdAt: now,

              updatedAt: now,
            },
            {
              session: dbSession,
            }
          );
        }
      );
    } finally {
      await dbSession.endSession();
    }

    /*
     * -------------------------------------------------------
     * 9. RETURN CREATED ORGANIZATION
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        message:
          "Workspace created successfully.",

        organization: {
          id: organizationId.toString(),

          name: organization.name,

          slug: organization.slug,

          description:
            organization.description ?? null,

          ownerId:
            organization.ownerId.toString(),

          status: organization.status,

          createdAt:
            organization.createdAt,

          updatedAt:
            organization.updatedAt,
        },

        membership: {
          organizationId:
            organizationId.toString(),

          userId:
            userId.toString(),

          role: "owner",

          status: "active",
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create organization error:",
      error
    );

    /*
     * -------------------------------------------------------
     * DUPLICATE KEY ERROR
     * -------------------------------------------------------
     *
     * The unique slug index protects against two users
     * creating the same workspace slug simultaneously.
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
            "A workspace with this name already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * GENERIC ERROR
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while creating the workspace.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * ---------------------------------------------------------
 * GET /api/organizations
 * ---------------------------------------------------------
 *
 * Returns every active workspace that the authenticated
 * user belongs to.
 *
 * This endpoint is used by the dashboard workspace
 * switcher.
 */
export async function GET() {
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
          organizations: [],
          count: 0,
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
          organizations: [],
          count: 0,
        },
        {
          status: 401,
        }
      );
    }

    const userId = new ObjectId(session.user.id);

    /*
     * -------------------------------------------------------
     * 3. GET COLLECTIONS
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
     * 4. ENSURE INDEXES
     * -------------------------------------------------------
     */

    await Promise.all([
      ensureOrganizationIndexes(),
      ensureOrganizationMemberIndexes(),
    ]);

    /*
     * -------------------------------------------------------
     * 5. GET USER'S ACTIVE MEMBERSHIPS
     * -------------------------------------------------------
     *
     * We query organization_members instead of using
     * organizations.ownerId because a user may belong to
     * workspaces they did not create.
     */

    const memberships =
      await organizationMembers
        .find({
          userId,

          status: "active",
        })
        .toArray();

    /*
     * -------------------------------------------------------
     * 6. NO WORKSPACES
     * -------------------------------------------------------
     */

    if (memberships.length === 0) {
      return NextResponse.json(
        {
          organizations: [],

          count: 0,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * 7. GET ORGANIZATION IDS
     * -------------------------------------------------------
     */

    const organizationIds =
      memberships.map(
        (membership) =>
          membership.organizationId
      );

    /*
     * -------------------------------------------------------
     * 8. FETCH ACTIVE ORGANIZATIONS
     * -------------------------------------------------------
     */

    const organizationDocuments =
      await organizations
        .find({
          _id: {
            $in: organizationIds,
          },

          status: "active",
        })
        .sort({
          name: 1,
        })
        .toArray();

    /*
     * -------------------------------------------------------
     * 9. BUILD MEMBERSHIP LOOKUP
     * -------------------------------------------------------
     *
     * Maps organization ID -> authenticated user's
     * membership.
     */

    const membershipByOrganizationId =
      new Map(
        memberships.map(
          (membership) => [
            membership.organizationId.toString(),
            membership,
          ]
        )
      );

    /*
     * -------------------------------------------------------
     * 10. FORMAT RESPONSE
     * -------------------------------------------------------
     */

    const result =
      organizationDocuments.map(
        (organization) => {
          const membership =
            membershipByOrganizationId.get(
              organization._id!.toString()
            );

          return {
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

            role:
              membership?.role ?? null,

            membershipStatus:
              membership?.status ?? null,

            createdAt:
              organization.createdAt,

            updatedAt:
              organization.updatedAt,
          };
        }
      );

    /*
     * -------------------------------------------------------
     * 11. RETURN WORKSPACES
     * -------------------------------------------------------
     */

    return NextResponse.json(
      {
        organizations: result,

        count: result.length,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "List organizations error:",
      error
    );

    /*
     * IMPORTANT:
     *
     * Always return JSON, even when an internal error
     * occurs. This prevents the dashboard from receiving
     * an empty response and then failing with:
     *
     * "Unexpected end of JSON input"
     */

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while retrieving your workspaces.",

        organizations: [],

        count: 0,
      },
      {
        status: 500,
      }
    );
  }
}