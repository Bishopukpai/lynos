import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI, Type, GenerateContentConfig } from "@google/genai";
import { getProjectContext } from "@/lib/ai/context";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Helper function to handle retries with exponential backoff and fallback model
async function generateContentWithRetry(prompt: string, config: GenerateContentConfig) {
  const models = ["gemini-3.6-flash", "gemini-2.5-flash"];
  const maxRetriesPerModel = 2;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });
        return response;
      } catch (error: unknown) {
        const err = error as { status?: number; code?: number; message?: string };
        const is503 =
          err?.status === 503 ||
          err?.code === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("UNAVAILABLE");

        // Retry on 503 unavailable with exponential delay (1s, 2s)
        if (is503 && attempt < maxRetriesPerModel) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Switch to the fallback model if max retries reached for the current model
        if (is503 && attempt === maxRetriesPerModel) {
          console.warn(`Model ${model} unavailable due to high demand. Retrying with fallback model...`);
          break;
        }

        throw error;
      }
    }
  }

  throw new Error("AI service is currently experiencing high demand. Please try again shortly.");
}

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

    // 3. Configure Gemini Request
    const generateConfig: GenerateContentConfig = {
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
                priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
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
    };

    // 4. Generate content with automatic backoff retry and model fallback
    const response = await generateContentWithRetry(prompt, generateConfig);

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini AI");

    // 5. Clean potential markdown wrappers (e.g. ```json ... ```)
    const cleanedText = resultText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsedData = JSON.parse(cleanedText);
    return NextResponse.json(parsedData);
  } catch (error: unknown) {
    console.error("AI Production Intelligence Error:", error);

    const err = error as { status?: number; code?: number; message?: string };
    const is503 =
      err?.status === 503 ||
      err?.code === 503 ||
      err?.message?.includes("503") ||
      err?.message?.includes("UNAVAILABLE");

    if (is503) {
      return NextResponse.json(
        { error: "The AI service is experiencing heavy demand. Please try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Failed to process AI production intelligence request" },
      { status: 500 }
    );
  }
}