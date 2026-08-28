import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClientPromise from "@/lib/mongodb";
import { ObjectId, Filter, Document, UpdateFilter } from "mongodb";

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

interface TaskActivity {
  _id: ObjectId;
  actor: ObjectId | string;
  action: string;
  details: string;
  createdAt: Date;
}

interface TaskComment {
  _id: ObjectId;
  author: ObjectId | string;
  content: string;
  createdAt: Date;
}

function getFlexibleIdFilter(idString: string) {
  if (!idString) return [];
  const ids: (ObjectId | string)[] = [idString];
  if (ObjectId.isValid(idString)) {
    ids.push(new ObjectId(idString));
  }
  return ids;
}

// PATCH /api/tasks/[taskId] - Update task details, status, assignee, or add comments
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> | { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params for Next.js 15 compatibility
    const resolvedParams = await params;
    const taskIdStr = resolvedParams.taskId;

    const body = await req.json();
    const { status, priority, assigneeId, comment, title, description, dueDate } = body;

    const client = await getMongoClientPromise();
    const db = client.db();

    const matchedTaskIds = getFlexibleIdFilter(taskIdStr);

    const taskFilter = {
      _id: { $in: matchedTaskIds },
    } as unknown as Filter<Document>;

    const task = await db.collection("tasks").findOne(taskFilter);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const userObjectId = ObjectId.isValid(session.user.id)
      ? new ObjectId(session.user.id)
      : session.user.id;

    const now = new Date();
    const updateFields: Record<string, unknown> = { updatedAt: now };
    const activitiesToAdd: TaskActivity[] = [];

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

    const updateQuery: UpdateFilter<Document> = {
      $set: updateFields,
    };

    const pushFields: Record<string, unknown> = {};

    if (comment?.trim()) {
      const newComment: TaskComment = {
        _id: new ObjectId(),
        author: userObjectId,
        content: comment.trim(),
        createdAt: now,
      };
      pushFields.comments = newComment;

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
      updateQuery.$push = pushFields as UpdateFilter<Document>["$push"];
    }

    await db.collection("tasks").updateOne(taskFilter, updateQuery);

    const [updatedTask] = await db
      .collection("tasks")
      .aggregate([
        { $match: { _id: { $in: matchedTaskIds } } },
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
    console.error("PATCH task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}