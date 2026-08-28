import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClientPromise from "@/lib/mongodb";
import { ObjectId, Filter, Document } from "mongodb";

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// PATCH /api/tasks/[taskId] - Update task details, status, assignee, or add comments
export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status, priority, assigneeId, comment, title, description, dueDate } = body;

    const client = await getMongoClientPromise();
    const db = client.db();

    const taskFilter = {
      _id: ObjectId.isValid(params.taskId)
        ? new ObjectId(params.taskId)
        : params.taskId,
    } as unknown as Filter<Document>;

    const task = await db.collection("tasks").findOne(taskFilter);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const userObjectId = ObjectId.isValid(session.user.id)
      ? new ObjectId(session.user.id)
      : session.user.id;

    const now = new Date();
    const updateFields: Record<string, any> = { updatedAt: now };
    const activitiesToAdd: any[] = [];

    if (status && status !== task.status) {
      activitiesToAdd.push({
        _id: new ObjectId(),
        actor: userObjectId,
        action: "STATUS_UPDATED",
        details: `Changed status from ${task.status} to ${status}`,
        createdAt: now,
      });
      updateFields.status = status;
    }

    if (priority && priority !== task.priority) {
      activitiesToAdd.push({
        _id: new ObjectId(),
        actor: userObjectId,
        action: "PRIORITY_UPDATED",
        details: `Changed priority from ${task.priority} to ${priority}`,
        createdAt: now,
      });
      updateFields.priority = priority;
    }

    if (assigneeId !== undefined) {
      const formattedAssigneeId =
        assigneeId && ObjectId.isValid(assigneeId)
          ? new ObjectId(assigneeId)
          : assigneeId || null;

      if (String(formattedAssigneeId) !== String(task.assigneeId)) {
        activitiesToAdd.push({
          _id: new ObjectId(),
          actor: userObjectId,
          action: "ASSIGNEE_UPDATED",
          details: assigneeId ? "Assigned task" : "Unassigned task",
          createdAt: now,
        });
        updateFields.assigneeId = formattedAssigneeId;
      }
    }

    if (title) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (dueDate !== undefined) {
      updateFields.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updateQuery: Record<string, any> = {
      $set: updateFields,
    };

    const pushFields: Record<string, any> = {};

    if (comment?.trim()) {
      pushFields.comments = {
        _id: new ObjectId(),
        author: userObjectId,
        content: comment.trim(),
        createdAt: now,
      };

      activitiesToAdd.push({
        _id: new ObjectId(),
        actor: userObjectId,
        action: "COMMENT_ADDED",
        details: "Added a comment",
        createdAt: now,
      });
    }

    if (activitiesToAdd.length > 0) {
      pushFields.activities = { $each: activitiesToAdd };
    }

    if (Object.keys(pushFields).length > 0) {
      updateQuery.$push = pushFields;
    }

    await db.collection("tasks").updateOne(taskFilter, updateQuery);

    const targetTaskId = ObjectId.isValid(params.taskId)
      ? new ObjectId(params.taskId)
      : params.taskId;

    const [updatedTask] = await db
      .collection("tasks")
      .aggregate([
        { $match: { _id: targetTaskId } },
        {
          $lookup: {
            from: "users",
            localField: "assigneeId",
            foreignField: "_id",
            as: "assigneeId",
          },
        },
        {
          $unwind: {
            path: "$assigneeId",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            as: "createdById",
          },
        },
        {
          $unwind: {
            path: "$createdById",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "comments.author",
            foreignField: "_id",
            as: "commentAuthors",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "activities.actor",
            foreignField: "_id",
            as: "activityActors",
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            projectId: 1,
            organizationId: 1,
            priority: 1,
            status: 1,
            dueDate: 1,
            createdAt: 1,
            updatedAt: 1,
            "assigneeId._id": 1,
            "assigneeId.name": 1,
            "assigneeId.email": 1,
            "assigneeId.image": 1,
            "createdById._id": 1,
            "createdById.name": 1,
            "createdById.email": 1,
            "createdById.image": 1,
            comments: {
              $map: {
                input: { $ifNull: ["$comments", []] },
                as: "comment",
                in: {
                  _id: "$$comment._id",
                  content: "$$comment.content",
                  createdAt: "$$comment.createdAt",
                  author: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$commentAuthors",
                          as: "user",
                          cond: { $eq: ["$$user._id", "$$comment.author"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
            activities: {
              $map: {
                input: { $ifNull: ["$activities", []] },
                as: "activity",
                in: {
                  _id: "$$activity._id",
                  action: "$$activity.action",
                  details: "$$activity.details",
                  createdAt: "$$activity.createdAt",
                  actor: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$activityActors",
                          as: "user",
                          cond: { $eq: ["$$user._id", "$$activity.actor"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
      ])
      .toArray();

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}