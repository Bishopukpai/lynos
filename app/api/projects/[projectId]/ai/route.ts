import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI, Type } from "@google/genai";
import { getProjectContext } from "@/lib/ai/context";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(
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
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Aggregate relational data context
    const context = await getProjectContext(projectId);

    // 2. Construct System Instructions (Strict JSON requirement)
    const systemInstruction = `
You are ScenePilot AI, an elite film & TV production intelligence assistant.
Analyze the provided project context and answer the user's request accurately.

Current Project Context:
${JSON.stringify(context, null, 2)}

CRITICAL INSTRUCTION:
You MUST respond ONLY with valid raw JSON that conforms to the schema. 
Do NOT include any conversational intro text, explanations, or markdown formatting outside of the JSON payload.
`;

    // 3. Call Gemini Model with gemini-3.6-flash and Structured Output Config
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              enum: ["analysis", "task_generation", "production_plan", "status_report", "general_chat"],
            },
            summary: { type: Type.STRING },
            projectHealth: {
              type: Type.STRING,
              enum: ["Healthy", "Moderate Risk", "High Risk", "Critical"],
            },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            blockers: { type: Type.ARRAY, items: { type: Type.STRING } },
            generatedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  department: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
                },
                required: ["title", "description", "department", "priority"],
              },
            },
            suggestedTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  keyMilestones: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["phase", "duration", "keyMilestones"],
              },
            },
          },
          required: ["intent", "summary"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini AI");

    // 4. Clean potential markdown wrappers (e.g. ```json ... ```)
    const cleanedText = resultText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsedData = JSON.parse(cleanedText);
    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    console.error("AI Production Intelligence Error:", error);
    return NextResponse.json(
      { error: "Failed to process AI production intelligence request" },
      { status: 500 }
    );
  }
}