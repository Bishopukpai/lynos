import { LucideIcon } from "lucide-react";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  status: "active" | "archived";
  role: "owner" | "admin" | "member" | null;
  membershipStatus: "active" | "suspended" | null;
  createdAt: string;
  updatedAt: string;
  members: number;
}

export interface Invitation {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
  invitedBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface Notification {
  id: string;
  recipientId: string;
  organizationId: string;
  actorId: string | null;
  invitationId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionStatus: "pending" | "accepted" | "declined" | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  organizationId: string;
  title: string;
  description: string;
  genre: string;
  budget: number;
  targetAudience: string;
  productionStatus: "IDEA" | "PRE PRODUCTION" | "IN PRODUCTION" | "POST PRODUCTION" | "COMPLETED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatItem {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
}

export interface ActivityItem {
  title: string;
  time: string;
}