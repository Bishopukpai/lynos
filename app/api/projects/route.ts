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
import { getOrganizationsCollection } from "../../../models/organization";
import { getOrganizationMembersCollection } from "../../../models/organizationMember";

/**
 * POST /api/projects
 *
 * Creates a new production project.
 *
 * Only organization owners and admins
 * can create projects.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // 2. Read request body safely
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

    // 3. Validate request body with Zod
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

    // 4. Convert IDs to MongoDB ObjectIds
    const userId = new ObjectId(session.user.id);
    const orgId = new ObjectId(organizationId);

    // 5. Get existing MongoDB collections
    const organizations = await getOrganizationsCollection();
    const members = await getOrganizationMembersCollection();

    // 6. Query organization and membership in parallel
    const [organization, membership] = await Promise.all([
      organizations.findOne({
        _id: orgId,
      }),

      members.findOne({
        organizationId: orgId,
        userId,
        status: "active",
      }),
    ]);

    // 7. Verify organization exists
    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    // 8. Verify organization is active
    if (organization.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot create a project in an archived organization",
        },
        { status: 403 }
      );
    }

    // 9. Verify active membership
    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not an active member of this organization",
        },
        { status: 403 }
      );
    }

    // 10. Verify required organization role
    if (
      membership.role !== "owner" &&
      membership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: You must be an admin or owner to create projects",
        },
        { status: 403 }
      );
    }

    // 11. Get projects collection
    const projects = await getProjectsCollection();

    // 12. Ensure project indexes exist
    await ensureProjectIndexes();

    // 13. Create the project
    const now = new Date();

    const project: Project = {
      organizationId: orgId,
      title,
      description,
      genre,
      budget,
      targetAudience,

      // Server-controlled fields
      productionStatus: "IDEA",
      createdBy: userId,

      createdAt: now,
      updatedAt: now,
    };

    const result = await projects.insertOne(project);

    // 14. Build the created project response
    const createdProject: Project & { _id: ObjectId } = {
      _id: result.insertedId,
      ...project,
    };

    // 15. Return the created project
    return NextResponse.json(
      {
        success: true,
        project: createdProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);

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
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // 2. Get organizationId from query string
    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organizationId is required",
        },
        { status: 400 }
      );
    }

    // 3. Validate organizationId
    if (!ObjectId.isValid(organizationId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid organizationId",
        },
        { status: 400 }
      );
    }

    // 4. Convert IDs to MongoDB ObjectIds
    const userId = new ObjectId(session.user.id);
    const orgId = new ObjectId(organizationId);

    // 5. Get existing MongoDB collections
    const organizations = await getOrganizationsCollection();
    const members = await getOrganizationMembersCollection();

    // 6. Verify organization and membership in parallel
    const [organization, membership] = await Promise.all([
      organizations.findOne({
        _id: orgId,
      }),

      members.findOne({
        organizationId: orgId,
        userId,
        status: "active",
      }),
    ]);

    // 7. Verify organization exists
    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    // 8. Verify organization is active
    if (organization.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot access projects from an archived organization",
        },
        { status: 403 }
      );
    }

    // 9. Verify active membership
    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not an active member of this organization",
        },
        { status: 403 }
      );
    }

    // 10. Get projects collection
    const projects = await getProjectsCollection();

    // 11. Fetch projects belonging to the organization
    const projectList = await projects
      .find({
        organizationId: orgId,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    // 12. Return projects
    return NextResponse.json(
      {
        success: true,
        projects: projectList,
        count: projectList.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get projects error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}