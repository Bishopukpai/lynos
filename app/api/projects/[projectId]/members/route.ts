import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import getMongoClient from "@/lib/mongodb";

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
  identifier?: string;
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
     *
     * This is the ID of the person making the request.
     * It is NOT the identifier of the person being added.
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

    /*
     * The frontend sends:
     *
     * {
     *   identifier: "john@example.com",
     *   role: "editor"
     * }
     *
     * OR:
     *
     * {
     *   identifier: "John Doe",
     *   role: "editor"
     * }
     */
    const {
      identifier,
      role = "member",
    } = body;

    /*
     * Validate target user identifier.
     */
    if (
      !identifier ||
      typeof identifier !== "string" ||
      identifier.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error: "A user email or name is required.",
        },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.trim();

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

    const requesterObjectId = new ObjectId(
      session.user.id
    );

    /*
     * Get collections.
     */
    const projects =
      await getProjectsCollection();

    const organizationMembers =
      await getOrganizationMembersCollection();

    const projectMembers =
      await getProjectMembersCollection();

    // Directly access the database and users collection
    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection("users");

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
     * Find the target user by email OR name.
     */
    const targetUser = await users.findOne({
      $or: [
        {
          email: normalizedIdentifier.toLowerCase(),
        },
        {
          name: normalizedIdentifier,
        },
      ],
    });

    /*
     * Target user does not exist.
     */
    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            "No user was found with that email address or name.",
        },
        { status: 404 }
      );
    }

    /*
     * Ensure the target user has a valid ID.
     */
    if (!targetUser._id) {
      return NextResponse.json(
        {
          error:
            "The selected user has an invalid user ID.",
        },
        { status: 500 }
      );
    }

    const targetUserObjectId = targetUser._id as ObjectId;

    /*
     * Verify that the target user belongs to
     * the same organization.
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
      await projectMembers.insertOne(
        projectMember
      );

    /*
     * Return the created project membership.
     */
    return NextResponse.json(
      {
        message:
          "Project member added successfully.",
        projectMember: {
          _id: result.insertedId,
          ...projectMember,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Add project member error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to add project member.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET
 *
 * Retrieve all members assigned to a project along with user profile details.
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
     * Use $lookup to join with the users collection to retrieve name, email, image.
     */
    const members = await projectMembers
      .aggregate([
        {
          $match: {
            projectId: projectObjectId,
          },
        },
        {
          $sort: {
            createdAt: 1,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            projectId: 1,
            organizationId: 1,
            userId: 1,
            role: 1,
            createdAt: 1,
            updatedAt: 1,
            userName: {
              $ifNull: [
                "$userDetails.name",
                "$userDetails.username",
                "Unknown Member",
              ],
            },
            userEmail: "$userDetails.email",
            userImage: "$userDetails.image",
          },
        },
      ])
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