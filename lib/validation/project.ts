import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format");

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Project title is required")
    .max(150, "Project title cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .min(1, "Project description is required")
    .max(5000, "Project description cannot exceed 5000 characters"),

  genre: z
    .string()
    .trim()
    .min(1, "Genre is required")
    .max(100, "Genre cannot exceed 100 characters"),

  budget: z
    .number()
    .finite("Budget must be a finite number")
    .min(0, "Budget cannot be negative")
    .max(100_000_000_000, "Budget exceeds maximum allowed limit"),

  targetAudience: z
    .string()
    .trim()
    .min(1, "Target audience is required")
    .max(500, "Target audience cannot exceed 500 characters"),

  organizationId: objectIdSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;