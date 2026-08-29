import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

// --- ZOD SCHEMAS FOR API VALIDATION ---
export const SceneSchema = z.object({
  sceneNumber: z.string().min(1, "Scene number is required"),
  description: z.string().optional(),
  characters: z.array(z.string()).default([]),
  location: z.string().optional(),
  requiredEquipment: z.array(z.string()).default([]),
  productionNotes: z.string().optional(),
});

export const LocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().optional(),
  scenes: z.array(z.string()).default([]), // Scene numbers or IDs
  notes: z.string().optional(),
});

export const CastSchema = z.object({
  character: z.string().min(1, "Character name is required"),
  actorName: z.string().min(1, "Actor name is required"),
  contactInfo: z.string().optional(),
  availability: z.string().optional(),
});

export const CrewSchema = z.object({
  role: z.string().min(1, "Role is required"),
  memberName: z.string().min(1, "Member name is required"),
  department: z.string().min(1, "Department is required"),
});

export const ShootDaySchema = z.object({
  date: z.string().min(1, "Shoot date is required"),
  location: z.string().optional(),
  scenes: z.array(z.string()).default([]),
  cast: z.array(z.string()).default([]),
  crew: z.array(z.string()).default([]),
  callTime: z.string().optional(),
  notes: z.string().optional(),
});

// --- MONGOOSE INTERFACES & SCHEMAS ---
export interface IProductionPlan extends Document {
  projectId: mongoose.Types.ObjectId;
  scenes: Array<z.infer<typeof SceneSchema> & { _id: mongoose.Types.ObjectId }>;
  locations: Array<z.infer<typeof LocationSchema> & { _id: mongoose.Types.ObjectId }>;
  cast: Array<z.infer<typeof CastSchema> & { _id: mongoose.Types.ObjectId }>;
  crew: Array<z.infer<typeof CrewSchema> & { _id: mongoose.Types.ObjectId }>;
  shootDays: Array<z.infer<typeof ShootDaySchema> & { _id: mongoose.Types.ObjectId }>;
}

const ProductionPlanSchema = new Schema<IProductionPlan>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    scenes: [
      {
        sceneNumber: { type: String, required: true },
        description: String,
        characters: [String],
        location: String,
        requiredEquipment: [String],
        productionNotes: String,
      },
    ],
    locations: [
      {
        name: { type: String, required: true },
        address: String,
        scenes: [String],
        notes: String,
      },
    ],
    cast: [
      {
        character: { type: String, required: true },
        actorName: { type: String, required: true },
        contactInfo: String,
        availability: String,
      },
    ],
    crew: [
      {
        role: { type: String, required: true },
        memberName: { type: String, required: true },
        department: { type: String, required: true },
      },
    ],
    shootDays: [
      {
        date: { type: String, required: true },
        location: String,
        scenes: [String],
        cast: [String],
        crew: [String],
        callTime: String,
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

export const ProductionPlan: Model<IProductionPlan> =
  mongoose.models.ProductionPlan || mongoose.model<IProductionPlan>("ProductionPlan", ProductionPlanSchema);