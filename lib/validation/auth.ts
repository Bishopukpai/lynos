import { z } from "zod";

export const signUpSchema = z.object({
  user: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .toLowerCase(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
  }),

  profile: z.object({
    country: z
      .string()
      .trim()
      .min(1, "Country is required"),

    timezone: z
      .string()
      .trim()
      .min(1, "Time zone is required"),

    language: z
      .string()
      .trim()
      .min(1, "Language is required"),

    stateRegion: z
      .string()
      .trim()
      .optional(),

    role: z
      .string()
      .trim()
      .optional(),

    useCases: z
      .array(z.string())
      .default([]),

    companyName: z
      .string()
      .trim()
      .optional(),

    teamSize: z
      .string()
      .trim()
      .optional(),
  }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;