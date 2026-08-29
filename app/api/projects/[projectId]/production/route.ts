import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import getMongoClientPromise from "../../../../../lib/mongodb";
import { ObjectId, PushOperator, Document } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const client = await getMongoClientPromise();
    const db = client.db();
    const collection = db.collection("production_plans");

    const projectIdQuery = ObjectId.isValid(projectId)
      ? new ObjectId(projectId)
      : projectId;

    let plan = await collection.findOne({ projectId: projectIdQuery });

    if (!plan) {
      const newPlan = {
        projectId: projectIdQuery,
        scenes: [],
        locations: [],
        cast: [],
        crew: [],
        shootDays: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(newPlan);
      plan = { _id: result.insertedId, ...newPlan };
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("GET Production Plan Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch production plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { section, item } = body;

    const validSections = ["scenes", "locations", "cast", "crew", "shootDays", "roster"];
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: "Invalid section specified" }, { status: 400 });
    }

    // Map roster requests to crew array in database
    const targetSection = section === "roster" ? "crew" : section;

    const client = await getMongoClientPromise();
    const db = client.db();
    const collection = db.collection("production_plans");

    const projectIdQuery = ObjectId.isValid(projectId)
      ? new ObjectId(projectId)
      : projectId;

    const itemWithId = {
      _id: new ObjectId(),
      ...item,
    };

    const pushUpdate: PushOperator<Document> = {
      [targetSection]: itemWithId,
    };

    const updatedPlan = await collection.findOneAndUpdate(
      { projectId: projectIdQuery },
      {
        $push: pushUpdate,
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("PATCH Production Plan Error:", error);
    return NextResponse.json(
      { error: "Failed to update production plan" },
      { status: 500 }
    );
  }
}