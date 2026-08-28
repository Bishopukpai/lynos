// models/Task.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { TaskStatus, TaskPriority } from "@/types/task";

// Re-export them so your server-side API routes don't break
export { TaskStatus, TaskPriority };

export interface ITask extends Document {
  title: string;
  description?: string;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  assigneeId?: mongoose.Types.ObjectId;
  createdById: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  comments: {
    _id?: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  activities: {
    _id?: mongoose.Types.ObjectId;
    actor: mongoose.Types.ObjectId;
    action: string;
    details?: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ActivitySchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    details: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true,
    },
    dueDate: { type: Date },
    comments: [CommentSchema],
    activities: [ActivitySchema],
  },
  { timestamps: true }
);

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);