"use client";

import { Plus, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  workspaceName: string;
  setWorkspaceName: (val: string) => void;
  workspaceDescription: string;
  setWorkspaceDescription: (val: string) => void;
  creatingWorkspace: boolean;
  createWorkspaceError: string | null;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
  workspaceName,
  setWorkspaceName,
  workspaceDescription,
  setWorkspaceDescription,
  creatingWorkspace,
  createWorkspaceError,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create workspace</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a workspace for your projects, agents, and team.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={creatingWorkspace}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div>
              <label htmlFor="workspace-name" className="block text-sm font-medium text-slate-700">
                Workspace name
              </label>
              <input
                id="workspace-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Production Studio"
                maxLength={100}
                disabled={creatingWorkspace}
                autoFocus
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
              />
              <p className="mt-1.5 text-xs text-slate-400">{workspaceName.length}/100</p>
            </div>

            <div>
              <label htmlFor="workspace-description" className="block text-sm font-medium text-slate-700">
                Description <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="workspace-description"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
                placeholder="What will this workspace be used for?"
                maxLength={500}
                rows={4}
                disabled={creatingWorkspace}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
              />
              <p className="mt-1.5 text-xs text-slate-400">{workspaceDescription.length}/500</p>
            </div>

            {createWorkspaceError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {createWorkspaceError}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={creatingWorkspace}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingWorkspace || workspaceName.trim().length < 2}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creatingWorkspace ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}