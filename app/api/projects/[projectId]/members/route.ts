import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import {
  ensureProjectMemberIndexes,
  getProjectMembersCollection,
  ProjectMemberRole,
} from "../../../../../models/ProjectMember";

import { getProjectsCollection } from "../../../../../models/projects";

import {
  getOrganizationMembersCollection,
} from "../../../../../models/organizationMember";

const PROJECT_MEMBER_ROLES: ProjectMemberRole[] = [
  "admin",
  "producer",
  "director",
  "editor",
  "writer",
  "cinematographer",
  "designer",
  "member",
];

interface RequestBody {
  userId: string;
  role?: ProjectMemberRole;
}

/**
 * POST
 *
 * Add an organization member to a project.
 */
export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ projectId: string }>;
  }
) {
  try {
    /*
     * Ensure project-member indexes exist.
     */
    await ensureProjectMemberIndexes();

    const { projectId } = await context.params;

    /*
     * Validate project ID.
     */
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID." },
        { status: 400 }
      );
    }

    /*
     * Get the authenticated user from NextAuth.
     */
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    /*
     * Validate authenticated user ID.
     */
    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: "Invalid authenticated user ID." },
        { status: 401 }
      );
    }

    /*
     * Parse request body.
     */
    let body: RequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const {
      userId: targetUserId,
      role = "member",
    } = body;

    /*
     * Validate target user ID.
     */
    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { error: "A valid userId is required." },
        { status: 400 }
      );
    }

    /*
     * Validate project role.
     */
    if (!PROJECT_MEMBER_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: `Invalid project role. Allowed roles: ${PROJECT_MEMBER_ROLES.join(
            ", "
          )}.`,
        },
        { status: 400 }
      );
    }

    const projectObjectId = new ObjectId(projectId);
    const requesterObjectId = new ObjectId(session.user.id);
    const targetUserObjectId = new ObjectId(targetUserId);

    const projects = await getProjectsCollection();

    const organizationMembers =
      await getOrganizationMembersCollection();

    const projectMembers =
      await getProjectMembersCollection();

    /*
     * Find the project.
     */
    const project = await projects.findOne({
      _id: projectObjectId,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    /*
     * Find the requester's organization membership.
     */
    const requesterMembership =
      await organizationMembers.findOne({
        organizationId: project.organizationId,
        userId: requesterObjectId,
        status: "active",
      });

    if (!requesterMembership) {
      return NextResponse.json(
        {
          error:
            "You are not an active member of this organization.",
        },
        { status: 403 }
      );
    }

    /*
     * Only organization owners and admins can
     * manage project membership.
     */
    if (
      requesterMembership.role !== "owner" &&
      requesterMembership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only organization owners and admins can manage project members.",
        },
        { status: 403 }
      );
    }

    /*
     * Verify that the target user belongs to the
     * same organization.
     */
    const targetMembership =
      await organizationMembers.findOne({
        organizationId: project.organizationId,
        userId: targetUserObjectId,
        status: "active",
      });

    if (!targetMembership) {
      return NextResponse.json(
        {
          error:
            "The selected user is not an active member of this organization.",
        },
        { status: 400 }
      );
    }

    /*
     * Prevent duplicate project membership.
     */
    const existingMembership =
      await projectMembers.findOne({
        projectId: projectObjectId,
        userId: targetUserObjectId,
      });

    if (existingMembership) {
      return NextResponse.json(
        {
          error:
            "This user is already a member of the project.",
        },
        { status: 409 }
      );
    }

    /*
     * Create project membership.
     */
    const now = new Date();

    const projectMember = {
      projectId: projectObjectId,
      organizationId: project.organizationId,
      userId: targetUserObjectId,
      role,
      createdAt: now,
      updatedAt: now,
    };

    const result =
      await projectMembers.insertOne(projectMember);

    return NextResponse.json(
      {
        message: "Project member added successfully.",
        projectMember: {
          _id: result.insertedId,
          ...projectMember,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add project member error:", error);

    return NextResponse.json(
      {
        error: "Unable to add project member.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET
 *
 * Retrieve all members assigned to a project.
 */
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ projectId: string }>;
  }
) {
  try {
    /*
     * Ensure project-member indexes exist.
     */
    await ensureProjectMemberIndexes();

    const { projectId } = await context.params;

    /*
     * Validate project ID.
     */
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID." },
        { status: 400 }
      );
    }

    /*
     * Get the authenticated user from NextAuth.
     */
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    /*
     * Validate authenticated user ID.
     */
    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { error: "Invalid authenticated user ID." },
        { status: 401 }
      );
    }

    const projectObjectId = new ObjectId(projectId);
    const requesterObjectId = new ObjectId(session.user.id);

    const projects = await getProjectsCollection();

    const organizationMembers =
      await getOrganizationMembersCollection();

    const projectMembers =
      await getProjectMembersCollection();

    /*
     * Find the project.
     */
    const project = await projects.findOne({
      _id: projectObjectId,
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    /*
     * Verify that the requester is an active member
     * of the project's organization.
     */
    const requesterMembership =
      await organizationMembers.findOne({
        organizationId: project.organizationId,
        userId: requesterObjectId,
        status: "active",
      });

    if (!requesterMembership) {
      return NextResponse.json(
        {
          error:
            "You are not an active member of this organization.",
        },
        { status: 403 }
      );
    }

    /*
     * Retrieve all members assigned to the project.
     *
     * Sort by creation time so the earliest assigned
     * members appear first.
     */
    const members = await projectMembers
      .find({
        projectId: projectObjectId,
      })
      .sort({
        createdAt: 1,
      })
      .toArray();

    return NextResponse.json(
      {
        projectId,
        organizationId: project.organizationId.toString(),
        members,
        count: members.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get project members error:", error);

    return NextResponse.json(
      {
        error: "Unable to retrieve project members.",
      },
      { status: 500 }
    );
  }
}