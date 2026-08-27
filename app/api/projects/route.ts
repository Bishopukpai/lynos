import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validation/project";

import {
  getProjectsCollection,
  ensureProjectIndexes,
  type Project,
} from "../../../models/projects";

import {
  getOrganizationsCollection,
} from "../../../models/organization";

import {
  getOrganizationMembersCollection,
} from "../../../models/organizationMember";

import {
  ensureProjectMemberIndexes,
  getProjectMembersCollection,
  type ProjectMember,
} from "../../../models/ProjectMember";

/**
 * POST /api/projects
 *
 * Creates a new production project.
 *
 * Only organization owners and admins
 * can create projects.
 *
 * The authenticated user who creates the project
 * is automatically assigned as the first project admin.
 */
export async function POST(request: Request) {
  try {
    /*
     * 1. Authenticate the user.
     */
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.id ||
      !ObjectId.isValid(session.user.id)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    /*
     * The authenticated session user is the
     * authoritative project creator.
     *
     * This ID must be used for both:
     *
     * - project.createdBy
     * - project_members.userId
     */
    const userId = new ObjectId(session.user.id);

    /*
     * 2. Read request body safely.
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    /*
     * 3. Validate request body.
     */
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      genre,
      budget,
      targetAudience,
      organizationId,
    } = parsed.data;

    /*
     * 4. Validate organization ID.
     */
    if (!ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid organizationId",
        },
        { status: 400 }
      );
    }

    /*
     * 5. Convert organization ID.
     */
    const orgId = new ObjectId(organizationId);

    /*
     * 6. Get required collections.
     */
    const organizations =
      await getOrganizationsCollection();

    const organizationMembers =
      await getOrganizationMembersCollection();

    const projects =
      await getProjectsCollection();

    const projectMembers =
      await getProjectMembersCollection();

    /*
     * 7. Ensure required indexes exist.
     */
    await Promise.all([
      ensureProjectIndexes(),
      ensureProjectMemberIndexes(),
    ]);

    /*
     * 8. Find the organization and the
     * authenticated user's organization membership.
     */
    const [organization, membership] =
      await Promise.all([
        organizations.findOne({
          _id: orgId,
        }),

        organizationMembers.findOne({
          organizationId: orgId,
          userId,
          status: "active",
        }),
      ]);

    /*
     * 9. Verify organization exists.
     */
    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    /*
     * 10. Verify organization is active.
     */
    if (organization.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot create a project in an archived organization",
        },
        { status: 403 }
      );
    }

    /*
     * 11. Verify the authenticated user
     * is an active member of the organization.
     */
    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not an active member of this organization",
        },
        { status: 403 }
      );
    }

    /*
     * 12. Only organization owners and admins
     * can create projects.
     */
    if (
      membership.role !== "owner" &&
      membership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: You must be an admin or owner to create a project",
        },
        { status: 403 }
      );
    }

    /*
     * 13. Create project data.
     *
     * IMPORTANT:
     *
     * createdBy comes ONLY from the authenticated
     * session user.
     *
     * It does not come from the request body.
     */
    const now = new Date();

    const project: Project = {
      organizationId: orgId,
      title,
      description,
      genre,
      budget,
      targetAudience,

      productionStatus: "IDEA",

      createdBy: userId,

      createdAt: now,
      updatedAt: now,
    };

    /*
     * 14. Insert the project.
     */
    const projectResult =
      await projects.insertOne(project);

    const projectId =
      projectResult.insertedId;

    /*
     * 15. Create the project creator's
     * project membership.
     *
     * The creator MUST become the first
     * project admin.
     */
    const creatorProjectMember: ProjectMember = {
      projectId,
      organizationId: orgId,
      userId,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    };

    try {
      /*
       * Insert the creator as project admin.
       */
      await projectMembers.insertOne(
        creatorProjectMember
      );

      /*
       * 16. Verify that the creator membership
       * was actually created.
       *
       * We explicitly search using:
       *
       * projectId
       * organizationId
       * userId
       * role: admin
       */
      const verifiedCreatorMembership =
        await projectMembers.findOne({
          projectId,
          organizationId: orgId,
          userId,
          role: "admin",
        });

      if (!verifiedCreatorMembership) {
        /*
         * Something went wrong.
         *
         * Remove any project memberships belonging
         * to this newly created project.
         */
        await projectMembers.deleteMany({
          projectId,
        });

        /*
         * Remove the project as well.
         */
        await projects.deleteOne({
          _id: projectId,
        });

        return NextResponse.json(
          {
            success: false,
            error:
              "Project was created but the project creator could not be assigned as an admin.",
          },
          { status: 500 }
        );
      }
    } catch (error) {
      /*
       * If creating the project membership fails,
       * remove the project so we don't leave an
       * orphan project without an administrator.
       */
      await projects.deleteOne({
        _id: projectId,
      });

      throw error;
    }

    /*
     * 17. Build the created project response.
     */
    const createdProject: Project & {
      _id: ObjectId;
    } = {
      _id: projectId,
      ...project,
    };

    /*
     * 18. Return the created project.
     */
    return NextResponse.json(
      {
        success: true,

        project: createdProject,

        /*
         * Explicit information about the
         * automatically created project admin.
         */
        projectAdmin: {
          projectId: projectId.toString(),

          organizationId: orgId.toString(),

          /*
           * This MUST equal session.user.id.
           */
          userId: userId.toString(),

          role: "admin",
        },

        /*
         * Explicitly expose the creator.
         *
         * This is useful for verifying the
         * frontend receives the correct user.
         */
        createdBy: userId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects?organizationId=<id>
 *
 * Returns all projects belonging to an organization.
 *
 * Any active organization member can view projects.
 */
export async function GET(request: Request) {
  try {
    /*
     * 1. Authenticate the user.
     */
    const session = await getServerSession(authOptions);

    if (
      !session?.user?.id ||
      !ObjectId.isValid(session.user.id)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    /*
     * 2. Get organizationId from query string.
     */
    const { searchParams } =
      new URL(request.url);

    const organizationId =
      searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required",
        },
        { status: 400 }
      );
    }

    /*
     * 3. Validate organizationId.
     */
    if (!ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid organizationId",
        },
        { status: 400 }
      );
    }

    /*
     * 4. Convert IDs.
     */
    const userId =
      new ObjectId(session.user.id);

    const orgId =
      new ObjectId(organizationId);

    /*
     * 5. Get collections.
     */
    const organizations =
      await getOrganizationsCollection();

    const organizationMembers =
      await getOrganizationMembersCollection();

    /*
     * 6. Verify organization and membership
     * in parallel.
     */
    const [organization, membership] =
      await Promise.all([
        organizations.findOne({
          _id: orgId,
        }),

        organizationMembers.findOne({
          organizationId: orgId,
          userId,
          status: "active",
        }),
      ]);

    /*
     * 7. Verify organization exists.
     */
    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    /*
     * 8. Verify organization is active.
     */
    if (organization.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot access projects from an archived organization",
        },
        { status: 403 }
      );
    }

    /*
     * 9. Verify active membership.
     */
    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not an active member of this organization",
        },
        { status: 403 }
      );
    }

    /*
     * 10. Get projects collection.
     */
    const projects =
      await getProjectsCollection();

    /*
     * 11. Fetch projects belonging to
     * this organization.
     */
    const projectList =
      await projects
        .find({
          organizationId: orgId,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

    /*
     * 12. Return projects.
     */
    return NextResponse.json(
      {
        success: true,
        projects: projectList,
        count: projectList.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Get projects error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}