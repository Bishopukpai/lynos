"use client";

import React, { useState } from "react";
import { ProjectMemberRole } from "@/models/ProjectMember";
import { ProjectMember } from "@/hooks/useProjectMembers";

const PROJECT_MEMBER_ROLES: ProjectMemberRole[] = [
  "admin",
  "producer",
  "director",
  "editor",
  "writer",
  "cinematographer",
  "designer",
  "member",
];

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (identifier: string, role: ProjectMemberRole) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  members?: ProjectMember[];
  loadingMembers?: boolean;
}

export function AddProjectMemberModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  members = [],
  loadingMembers = false,
}: AddProjectMemberModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<ProjectMemberRole>("member");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    const success = await onSubmit(identifier.trim(), role);
    if (success) {
      setIdentifier("");
      setRole("member");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Add Member to Project
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the user's registered name or email address to add them to this project.
        </p>

        {error && (
          <div className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              User Name or Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. john@example.com or John Doe"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Project Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {PROJECT_MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>

        <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

        {/* Current Members List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Current Project Members
            </h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {members.length}
            </span>
          </div>

          {loadingMembers ? (
            <div className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No members assigned yet.
            </div>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {member.userName ? member.userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {member.userName || "Unknown Member"}
                      </p>
                      {member.userEmail && (
                        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {member.userEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}