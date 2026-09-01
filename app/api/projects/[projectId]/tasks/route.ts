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

// Helper to construct query matching both ObjectId and string formats
function getFlexibleIdFilter(idString: string) {
  if (!idString) return [];
  const ids: (ObjectId | string)[] = [idString];
  if (ObjectId.isValid(idString)) {
    ids.push(new ObjectId(idString));
  }
  return ids;
}

// GET /api/projects/[projectId]/tasks - List tasks for project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> | { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params to support Next.js 15+ async params standard
    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;

    const client = await getMongoClientPromise();
    const db = client.db();

    const matchedProjectIds = getFlexibleIdFilter(projectId);

    const tasks = await db
      .collection("tasks")
      .aggregate([
        {
          $match: {
            projectId: { $in: matchedProjectIds },
          },
        },
        { $sort: { createdAt: -1 } },
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
            department: 1,
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

    return NextResponse.json({ tasks });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/tasks - Create task
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> | { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, department, assigneeId, priority, status, dueDate } =
      await req.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    // Await params to support Next.js 15+ async params standard
    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;

    const client = await getMongoClientPromise();
    const db = client.db();

    const matchedProjectIds = getFlexibleIdFilter(projectId);

    // Flexible project check for both string and ObjectId types in MongoDB
    const projectFilter = {
      _id: { $in: matchedProjectIds },
    } as unknown as Filter<Document>;

    const project = await db.collection("projects").findOne(projectFilter);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const rawUserId = (session.user as { id?: string }).id || session.user.email;
    const userId = rawUserId && ObjectId.isValid(rawUserId)
      ? new ObjectId(rawUserId)
      : rawUserId;

    const formattedAssigneeId =
      assigneeId && ObjectId.isValid(assigneeId)
        ? new ObjectId(assigneeId)
        : assigneeId || null;

    const now = new Date();
    const targetProjectId = ObjectId.isValid(projectId)
      ? new ObjectId(projectId)
      : projectId;

    // Normalize Priority & Status to Uppercase Enums safely
    const normalizedPriority = priority
      ? priority.toString().toUpperCase()
      : TaskPriority.MEDIUM;

    const normalizedStatus = status
      ? status.toString().toUpperCase()
      : TaskStatus.TODO;

    const newTaskData = {
      title: title.trim(),
      description: description || "",
      department: department || "General",
      projectId: targetProjectId,
      organizationId: project.organizationId || null,
      assigneeId: formattedAssigneeId,
      createdById: userId,
      priority: normalizedPriority,
      status: normalizedStatus,
      dueDate: dueDate ? new Date(dueDate) : null,
      comments: [],
      activities: [
        {
          _id: new ObjectId(),
          actor: userId,
          action: "TASK_CREATED",
          details: `Created task "${title.trim()}"`,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection("tasks").insertOne(newTaskData);

    const [populatedTask] = await db
      .collection("tasks")
      .aggregate([
        { $match: { _id: insertResult.insertedId } },
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
            localField: "activities.actor",
            foreignField: "_id",
            as: "activityActors",
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            department: 1,
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
            comments: 1,
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

    return NextResponse.json({ task: populatedTask }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}