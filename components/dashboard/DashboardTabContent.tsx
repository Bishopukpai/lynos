"use client";

import {
  ArrowLeft,
  Bot,
  ClipboardList,
  FlaskConical,
  Loader2,
} from "lucide-react";

import ScenePilotAI from "@/components/ScenePilotAI";
import ResearchIntelligence from "@/components/ResearchIntelligence";
import ProductionPlanner from "@/components/ProductionPlanner";
import ProductionTasksBoard from "@/components/ProductionTasksBoard";

import type { Project } from "@/types/dashboard";
import type { ProjectMember } from "@/hooks/useProjectMembers";

import type { DashboardTab } from "./DashboardShell";

interface DashboardTabContentProps {
  activeTab: DashboardTab;

  projects: Project[];
  selectedProjectId: string | null;
  activeProject: Project | null;

  members: ProjectMember[];
  loadingMembers: boolean;
  projectMemberError: string | null;

  onProjectSelect: (projectId: string) => void;
  onBackToOverview: () => void;
}

export default function DashboardTabContent({
  activeTab,
  projects,
  selectedProjectId,
  activeProject,
  members,
  loadingMembers,
  projectMemberError,
  onProjectSelect,
  onBackToOverview,
}: DashboardTabContentProps) {
  const requiresProject =
    activeTab === "agents" ||
    activeTab === "research" ||
    activeTab === "planning" ||
    activeTab === "tasks";

  if (!requiresProject) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {activeTab === "team"
              ? "Team"
              : activeTab === "activity"
                ? "Activity"
                : "Settings"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This section is ready for the next dashboard module.
          </p>
        </div>
      </div>
    );
  }

  const titles = {
    agents: {
      title: "AI Agents",
      description:
        "Use AI agents to analyze and develop your production.",
      icon: Bot,
    },

    research: {
      title: "Research Intelligence",
      description:
        "Research markets, audiences, talent, and production intelligence.",
      icon: FlaskConical,
    },

    planning: {
      title: "Production Planning",
      description:
        "Turn your production into an actionable plan.",
      icon: ClipboardList,
    },

    tasks: {
      title: "Production Tasks",
      description:
        "Manage and track your production tasks.",
      icon: ClipboardList,
    },
  };

  const config =
    titles[activeTab as keyof typeof titles];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBackToOverview}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Icon size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {config.title}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <label
            htmlFor="dashboard-project"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Project
          </label>

          <select
            id="dashboard-project"
            value={selectedProjectId ?? ""}
            onChange={(event) =>
              onProjectSelect(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
          >
            <option value="">
              Select a project
            </option>

            {projects.map((project) => (
              <option
                key={project._id}
                value={project._id}
              >
                {project.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedProjectId || !activeProject ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="font-semibold text-slate-900">
            Select a project
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Choose a project above to use this workspace.
          </p>
        </div>
      ) : (
        <>
          {loadingMembers && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              <Loader2
                size={16}
                className="animate-spin"
              />
              Loading project members...
            </div>
          )}

          {projectMemberError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {projectMemberError}
            </div>
          )}

          {activeTab === "agents" && (
            <ScenePilotAI
              projectId={activeProject._id}
            />
          )}

          {activeTab === "research" && (
            <ResearchIntelligence
              projectId={activeProject._id}
            />
          )}

          {activeTab === "planning" && (
            <ProductionPlanner
              projectId={activeProject._id}
              members={members}
            />
          )}

          {activeTab === "tasks" && (
            <ProductionTasksBoard
              projectId={activeProject._id}
              members={members}
            />
          )}
        </>
      )}
    </div>
  );
}