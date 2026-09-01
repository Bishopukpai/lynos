import getMongoClientPromise from "@/lib/mongodb";
import { ObjectId, Filter, Document } from "mongodb";

export async function getProjectContext(projectId: string) {
  const client = await getMongoClientPromise();
  const db = client.db();

  // Explicitly cast the query to Filter<Document> to allow string or ObjectId matching
  const projectQuery = (
    ObjectId.isValid(projectId)
      ? { _id: new ObjectId(projectId) }
      : { _id: projectId }
  ) as Filter<Document>;

  const projectReferenceQuery = (
    ObjectId.isValid(projectId)
      ? { $or: [{ projectId: new ObjectId(projectId) }, { projectId }] }
      : { projectId }
  ) as Filter<Document>;

  // 1. Load Project
  const project = await db.collection("projects").findOne(projectQuery);
  if (!project) throw new Error("Project not found");

  // 2. Load Tasks
  const tasks = await db
    .collection("tasks")
    .find(projectReferenceQuery)
    .toArray();

  // 3. Load Production Plan
  const productionPlan = await db
    .collection("production_plans")
    .findOne(projectReferenceQuery);

  // 4. Load Team Members
  const team = await db
    .collection("project_members")
    .find(projectReferenceQuery)
    .toArray();

  return {
    project: {
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
    },
    tasks: tasks.map((t) => ({
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      assignee: t.assigneeName,
      department: t.department,
    })),
    productionPlan: {
      scenesCount: productionPlan?.scenes?.length || 0,
      scenes: productionPlan?.scenes || [],
      locationsCount: productionPlan?.locations?.length || 0,
      locations: productionPlan?.locations || [],
      castCount: productionPlan?.cast?.length || 0,
      crewCount: productionPlan?.crew?.length || 0,
      shootDaysCount: productionPlan?.shootDays?.length || 0,
      shootDays: productionPlan?.shootDays || [],
    },
    team: team.map((m) => ({
      name: m.name,
      role: m.role,
      department: m.department,
    })),
    currentDate: new Date().toISOString(),
  };
}