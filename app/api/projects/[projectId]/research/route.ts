import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { GoogleGenAI, Type, GenerateContentConfig } from "@google/genai";
import { getProjectContext } from "@/lib/ai/context";
import { executeParallelResearch } from "@/lib/ai/parallel";
import {
  getResearchResultsCollection,
  ensureResearchResultIndexes,
  ResearchCategory,
  ResearchResult,
} from "../../../../../models/ResearchResult";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
    }

    const body = await req.json();
    const { objective, category = "general_research" } = body as {
      objective: string;
      category?: ResearchCategory;
    };

    if (!objective) {
      return NextResponse.json({ error: "Research objective is required" }, { status: 400 });
    }

    // Step 1: Execute Parallel Web Search for external data
    const rawSearchResults = await executeParallelResearch(objective);

    // Step 2: Fetch internal project context
    const projectContext = await getProjectContext(projectId);

    // Step 3: Synthesize research findings with Gemini
    const systemInstruction = `
You are ScenePilot's External Intelligence Research Agent.
Analyze external market research gathered via Parallel web search alongside internal project context to deliver structured, high-value production intelligence.

Current Internal Project Context:
${JSON.stringify(projectContext, null, 2)}

External Research Data from Parallel API:
${JSON.stringify(rawSearchResults, null, 2)}

CRITICAL INSTRUCTION:
You MUST respond ONLY with valid raw JSON matching the requested schema.
`;

    const generateConfig: GenerateContentConfig = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
          marketOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          competitorsOrComps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                metrics: { type: Type.STRING },
                relevance: { type: Type.STRING },
              },
              required: ["title", "relevance"],
            },
          },
          strategicRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["executiveSummary", "keyFindings", "strategicRecommendations"],
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Perform comprehensive research synthesis for objective: "${objective}"`,
      config: generateConfig,
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response received from Gemini");

    const cleanedText = resultText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const aiAnalysis = JSON.parse(cleanedText);

    // Step 4: Save to MongoDB via native driver collection
    await ensureResearchResultIndexes();
    const collection = await getResearchResultsCollection();

    const now = new Date();
    const userId = (session.user as { id?: string }).id || session.user.email || "unknown_user";

    const newResearchDoc: ResearchResult = {
      projectId: new ObjectId(projectId),
      userId,
      category,
      objective,
      rawSearchResults,
      aiAnalysis,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await collection.insertOne(newResearchDoc);

    return NextResponse.json(
      { _id: insertResult.insertedId, ...newResearchDoc },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("External Research Agent Error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Failed to execute external research intelligence query" },
      { status: 500 }
    );
  }
}

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
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
    }

    await ensureResearchResultIndexes();
    const collection = await getResearchResultsCollection();

    const history = await collection
      .find({ projectId: new ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(history);
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message || "Failed to fetch research history" },
      { status: 500 }
    );
  }
}