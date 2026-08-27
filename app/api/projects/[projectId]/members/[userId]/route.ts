import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import {
  ensureProjectMemberIndexes,
  getProjectMembersCollection,
  ProjectMemberRole,
} from "../../../../../../models/ProjectMember";

import {
  getProjectsCollection,
} from "../../../../../../models/projects";

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

/**
 * PATCH
 *
 * Update a project member's role.
 *
 * Only project admins can update
 * project member roles.
 */
export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      projectId: string;
      userId: string;
    }>;
  }
) {
  try {
    /*
     * Ensure project-member indexes exist.
     */
    await ensureProjectMemberIndexes();

    const { projectId, userId } = await context.params;

    /*
     * Validate project ID.
     */
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        {
          error: "Invalid project ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate target user ID.
     */
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          error: "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Authenticate requester.
     */
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Validate authenticated user ID.
     */
    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          error: "Invalid authenticated user ID.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Parse request body.
     */
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate request body.
     */
    if (
      typeof body !== "object" ||
      body === null ||
      !("role" in body)
    ) {
      return NextResponse.json(
        {
          error: "A role is required.",
        },
        {
          status: 400,
        }
      );
    }

    const role =
      (body as { role?: unknown }).role;

    /*
     * Validate project role.
     */
    if (
      typeof role !== "string" ||
      !PROJECT_MEMBER_ROLES.includes(
        role as ProjectMemberRole
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid project role. Allowed roles: ${PROJECT_MEMBER_ROLES.join(
            ", "
          )}.`,
        },
        {
          status: 400,
        }
      );
    }

    const newRole =
      role as ProjectMemberRole;

    /*
     * Convert IDs to ObjectIds.
     */
    const projectObjectId =
      new ObjectId(projectId);

    const requesterObjectId =
      new ObjectId(session.user.id);

    const targetUserObjectId =
      new ObjectId(userId);

    /*
     * Get MongoDB collections.
     */
    const projects =
      await getProjectsCollection();

    const projectMembers =
      await getProjectMembersCollection();

    /*
     * Find the project.
     */
    const project =
      await projects.findOne({
        _id: projectObjectId,
      });

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Find the requester's project membership.
     */
    const requesterProjectMembership =
      await projectMembers.findOne({
        projectId: projectObjectId,
        userId: requesterObjectId,
      });

    if (!requesterProjectMembership) {
      return NextResponse.json(
        {
          error:
            "You are not a member of this project.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Only project admins can update
     * project member roles.
     */
    if (
      requesterProjectMembership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only project admins can update project member roles.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Find the target project membership.
     */
    const targetProjectMembership =
      await projectMembers.findOne({
        projectId: projectObjectId,
        userId: targetUserObjectId,
      });

    if (!targetProjectMembership) {
      return NextResponse.json(
        {
          error:
            "This user is not a member of the project.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Nothing needs to change if the target
     * already has the requested role.
     */
    if (
      targetProjectMembership.role === newRole
    ) {
      return NextResponse.json(
        {
          message:
            "Project member role is already set to this role.",
          projectMember:
            targetProjectMembership,
        },
        {
          status: 200,
        }
      );
    }

    /*
     * Prevent demoting the last project admin.
     */
    if (
      targetProjectMembership.role === "admin" &&
      newRole !== "admin"
    ) {
      const projectAdminCount =
        await projectMembers.countDocuments({
          projectId: projectObjectId,
          role: "admin",
        });

      if (projectAdminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot remove the last project admin. Assign another project admin first.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Update the project member role.
     */
    const updatedAt = new Date();

    const result =
      await projectMembers.findOneAndUpdate(
        {
          _id: targetProjectMembership._id,
          projectId: projectObjectId,
          userId: targetUserObjectId,
        },
        {
          $set: {
            role: newRole,
            updatedAt,
          },
        },
        {
          returnDocument: "after",
        }
      );

    /*
     * Verify the update succeeded.
     */
    if (!result) {
      return NextResponse.json(
        {
          error:
            "Unable to update project member role.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        message:
          "Project member role updated successfully.",
        projectMember: result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Update project member role error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update project member role.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE
 *
 * Remove a member from a project.
 *
 * Only project admins can remove
 * project members.
 */
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      projectId: string;
      userId: string;
    }>;
  }
) {
  try {
    /*
     * Ensure project-member indexes exist.
     */
    await ensureProjectMemberIndexes();

    const { projectId, userId } =
      await context.params;

    /*
     * Validate project ID.
     */
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        {
          error: "Invalid project ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate target user ID.
     */
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          error: "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Authenticate requester.
     */
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Validate authenticated user ID.
     */
    if (!ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        {
          error:
            "Invalid authenticated user ID.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Convert IDs to ObjectIds.
     */
    const projectObjectId =
      new ObjectId(projectId);

    const requesterObjectId =
      new ObjectId(session.user.id);

    const targetUserObjectId =
      new ObjectId(userId);

    /*
     * Get MongoDB collections.
     */
    const projects =
      await getProjectsCollection();

    const projectMembers =
      await getProjectMembersCollection();

    /*
     * Find the project.
     */
    const project =
      await projects.findOne({
        _id: projectObjectId,
      });

    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Find the requester's project membership.
     */
    const requesterProjectMembership =
      await projectMembers.findOne({
        projectId: projectObjectId,
        userId: requesterObjectId,
      });

    if (!requesterProjectMembership) {
      return NextResponse.json(
        {
          error:
            "You are not a member of this project.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Only project admins can remove
     * project members.
     */
    if (
      requesterProjectMembership.role !== "admin"
    ) {
      return NextResponse.json(
        {
          error:
            "Only project admins can remove project members.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Find the target project membership.
     */
    const targetProjectMembership =
      await projectMembers.findOne({
        projectId: projectObjectId,
        userId: targetUserObjectId,
      });

    if (!targetProjectMembership) {
      return NextResponse.json(
        {
          error:
            "This user is not a member of the project.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Prevent removal of the last project admin.
     */
    if (
      targetProjectMembership.role === "admin"
    ) {
      const projectAdminCount =
        await projectMembers.countDocuments({
          projectId: projectObjectId,
          role: "admin",
        });

      if (projectAdminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot remove the last project admin.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Remove the project membership.
     */
    const result =
      await projectMembers.deleteOne({
        _id: targetProjectMembership._id,
      });

    /*
     * Verify that the membership was removed.
     */
    if (result.deletedCount !== 1) {
      return NextResponse.json(
        {
          error:
            "Unable to remove project member.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        message:
          "Project member removed successfully.",
        removedUserId: userId,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Remove project member error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to remove project member.",
      },
      {
        status: 500,
      }
    );
  }
}