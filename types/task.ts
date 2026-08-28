// types/task.ts

export enum TaskStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface TaskMember {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

export interface ITaskComment {
  _id?: string;
  author: TaskMember | string;
  content: string;
  createdAt: string | Date;
}

export interface ITaskActivity {
  _id?: string;
  actor: TaskMember | string;
  action: string;
  details?: string;
  createdAt: string | Date;
}