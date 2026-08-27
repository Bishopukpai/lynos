"use client";

import { useState, useCallback, useEffect } from "react";
import { ProjectMemberRole } from "@/models/ProjectMember";

export interface ProjectMember {
  _id: string;
  projectId: string;
  organizationId: string;
  userId: string;
  role: ProjectMemberRole;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail?: string;
  userImage?: string;
}

export function useProjectMembers(projectId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch all members of a specific project
  const loadProjectMembers = useCallback(async () => {
    if (!projectId) {
      setMembers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/projects/${projectId}/members`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load project members.");
      }

      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project members."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Automatically fetch members when projectId changes
  // ✅ Correct Option B: Reset inside async function block
useEffect(() => {
  let isSubscribed = true;

  async function syncMembers() {
    if (projectId) {
      await loadProjectMembers();
    } else if (isSubscribed) {
      // Async scheduling prevents synchronous cascading render warning
      Promise.resolve().then(() => {
        if (isSubscribed) setMembers([]);
      });
    }
  }

  syncMembers();

  return () => {
    isSubscribed = false;
  };
}, [projectId, loadProjectMembers]);
  // Add member using your POST endpoint
  const addProjectMember = async (
    identifier: string,
    role: ProjectMemberRole
  ) => {
    if (!projectId) return false;

    try {
      setAddingMember(true);
      setError(null);

      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to add project member.");
      }

      // Re-fetch project members to ensure full userDetails (userName, userEmail, etc.) are loaded
      await loadProjectMembers();
      setIsAddModalOpen(false);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add project member."
      );
      return false;
    } finally {
      setAddingMember(false);
    }
  };

  return {
    members,
    loading,
    addingMember,
    error,
    isAddModalOpen,
    setIsAddModalOpen,
    loadProjectMembers,
    addProjectMember,
  };
}