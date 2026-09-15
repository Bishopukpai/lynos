"use client";

import {
  Bot,
  ClipboardList,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";

import type { Project } from "@/types/dashboard";

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  error: string | null;

  onCreateProject: () => void;
  onOpenAI: (projectId: string) => void;
  onOpenResearch: (projectId: string) => void;
  onOpenPlanning: (projectId: string) => void;
  onOpenTasks: (projectId: string) => void;
  onAddMember: (projectId: string) => void;
}

const statusStyles: Record<
  string,
  string
> = {
  DEVELOPMENT:
    "bg-blue-50 text-blue-700 border-blue-200",
  PRE_PRODUCTION:
    "bg-purple-50 text-purple-700 border-purple-200",
  PRODUCTION:
    "bg-amber-50 text-amber-700 border-amber-200",
  POST_PRODUCTION:
    "bg-orange-50 text-orange-700 border-orange-200",
  COMPLETED:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  ON_HOLD:
    "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ProjectList({
  projects,
  loading,
  error,
  onCreateProject,
  onOpenAI,
  onOpenResearch,
  onOpenPlanning,
  onOpenTasks,
  onAddMember,
}: ProjectListProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Recent Projects
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Loading your projects...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-900">
          Projects
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {error}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="font-semibold text-slate-900">
            Recent Projects
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest productions.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateProject}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus size={15} />
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Search
              size={20}
              className="text-slate-400"
            />
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">
            No projects yet
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Create your first production project
            to start using LYNOS.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {projects.map((project) => {
            const status =
              String(project.productionStatus);

            return (
              <div
                key={project._id}
                className="p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {project.title}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          statusStyles[
                            status
                          ] ??
                          "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {status.replace(
                          /_/g,
                          " "
                        )}
                      </span>
                    </div>

                    {project.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {project.genre && (
                        <span>
                          Genre:{" "}
                          <strong className="text-slate-700">
                            {project.genre}
                          </strong>
                        </span>
                      )}

                      {project.targetAudience && (
                        <span>
                          Audience:{" "}
                          <strong className="text-slate-700">
                            {
                              project.targetAudience
                            }
                          </strong>
                        </span>
                      )}

                      {typeof project.budget ===
                        "number" && (
                        <span>
                          Budget:{" "}
                          <strong className="text-slate-700">
                            $
                            {project.budget.toLocaleString()}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenAI(project._id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Bot size={14} />
                      AI Agent
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenResearch(
                          project._id
                        )
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Research
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenPlanning(
                          project._id
                        )
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Plan
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenTasks(project._id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <ClipboardList
                        size={14}
                      />
                      Tasks
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onAddMember(project._id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <UserPlus size={14} />
                      Member
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}