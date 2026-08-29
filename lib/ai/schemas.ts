import { z } from "zod";

// 1. Task Generation Schema
export const GeneratedTasksSchema = z.object({
  suggestedTasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      department: z.string(),
      priority: z.enum(["low", "medium", "high", "critical"]),
      estimatedDaysToComplete: z.number(),
    })
  ),
});

// 2. Full AI Assistant Response Schema
export const AIAssistantResponseSchema = z.object({
  intent: z.enum(["analysis", "task_generation", "production_plan", "status_report", "general_chat"]),
  summary: z.string(),
  projectHealth: z.enum(["Healthy", "Moderate Risk", "High Risk", "Critical"]).optional(),
  risks: z.array(z.string()).optional(),
  missingInformation: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
  generatedTasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        department: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]),
      })
    )
    .optional(),
  suggestedTimeline: z
    .array(
      z.object({
        phase: z.string(),
        duration: z.string(),
        keyMilestones: z.array(z.string()),
      })
    )
    .optional(),
});

export type AIAssistantResponse = z.infer<typeof AIAssistantResponseSchema>;