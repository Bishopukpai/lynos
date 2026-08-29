import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Adjust to your NextAuth config path
import getMongoClientPromise from "../../../../../lib/mongodb"; // MongoDB native driver promise helper
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await getMongoClientPromise();
    const db = client.db();
    const collection = db.collection("production_plans");

    // Convert string projectId to ObjectId if applicable, or keep as string depending on your DB schema design
    const projectIdQuery = ObjectId.isValid(params.projectId)
      ? new ObjectId(params.projectId)
      : params.projectId;

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
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { section, item } = body; // section: 'scenes' | 'locations' | 'cast' | 'crew' | 'shootDays'

    if (!["scenes", "locations", "cast", "crew", "shootDays"].includes(section)) {
      return NextResponse.json({ error: "Invalid section specified" }, { status: 400 });
    }

    const client = await getMongoClientPromise();
    const db = client.db();
    const collection = db.collection("production_plans");

    const projectIdQuery = ObjectId.isValid(params.projectId)
      ? new ObjectId(params.projectId)
      : params.projectId;

    // Attach a generated ObjectId to the nested array item if not present
    const itemWithId = {
      _id: new ObjectId(),
      ...item,
    };

    const updatedPlan = await collection.findOneAndUpdate(
      { projectId: projectIdQuery },
      {
        $push: { [section]: itemWithId } as any,
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