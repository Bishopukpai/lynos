"use client";

import { Plus, UserPlus } from "lucide-react";

import DashboardStats from "@/components/dashboard/DashboardStats";
import ProjectList from "@/components/dashboard/ProjectList";
import RecentActivity from "@/components/dashboard/RecentActivity";
import PendingInvitationsManager from "@/components/PendingInvitationsManager";

import type {
  Invitation,
  Notification,
  Organization,
  Project,
} from "@/types/dashboard";

interface DashboardOverviewProps {
  selectedOrganization: Organization | null;
  selectedOrganizationId: string | null;

  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;

  notifications: Notification[];

  canManageInvitations: boolean;

  invitations: Invitation[];
  invitationsLoading: boolean;
  invitationsError: string | null;

  resendingInvitationId: string | null;
  cancellingInvitationId: string | null;

  onCreateWorkspace: () => void;
  onInviteMember: () => void;
  onCreateProject: () => void;

  onOpenAI: (projectId: string) => void;
  onOpenResearch: (projectId: string) => void;
  onOpenPlanning: (projectId: string) => void;
  onOpenTasks: (projectId: string) => void;
  onAddMember: (projectId: string) => void;

  onResendInvitation: (
    invitationId: string
  ) => Promise<void>;

  onCancelInvitation: (
    invitationId: string
  ) => Promise<void>;
}

export default function DashboardOverview({
  selectedOrganization,
  selectedOrganizationId,
  projects,
  projectsLoading,
  projectsError,
  notifications,
  canManageInvitations,
  invitations,
  invitationsLoading,
  invitationsError,
  resendingInvitationId,
  cancellingInvitationId,
  onCreateWorkspace,
  onInviteMember,
  onCreateProject,
  onOpenAI,
  onOpenResearch,
  onOpenPlanning,
  onOpenTasks,
  onAddMember,
  onResendInvitation,
  onCancelInvitation,
}: DashboardOverviewProps) {
  const activeProjects = projects.filter(
    (project) =>
      project.productionStatus !==
      "COMPLETED"
  ).length;

  const teamMembers =
    selectedOrganization?.members ?? 1;

  const agentRuns =
    projects.length > 0 ? 1 : 0;

  const recentActivity =
    notifications.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">
              Welcome back
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {selectedOrganization?.name ||
                "Your workspace"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Manage productions, collaborate with
              your team, and use AI to accelerate
              your creative workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCreateWorkspace}
              className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              <Plus size={16} />
              New Workspace
            </button>

            {canManageInvitations && (
              <button
                type="button"
                onClick={onInviteMember}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                <UserPlus size={16} />
                Invite Member
              </button>
            )}

            <button
              type="button"
              onClick={onCreateProject}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
            >
              New Project
            </button>
          </div>
        </div>
      </section>

      <DashboardStats
        activeProjects={activeProjects}
        agentRuns={agentRuns}
        teamMembers={teamMembers}
        recentActivity={recentActivity}
      />

      {canManageInvitations &&
        selectedOrganizationId && (
          <PendingInvitationsManager
            organizationId={
              selectedOrganizationId
            }
            invitations={invitations}
            loading={invitationsLoading}
            error={invitationsError}
            resendingInvitationId={
              resendingInvitationId
            }
            cancellingInvitationId={
              cancellingInvitationId
            }
            onResend={onResendInvitation}
            onCancel={onCancelInvitation}
          />
        )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <ProjectList
          projects={projects}
          loading={projectsLoading}
          error={projectsError}
          onCreateProject={onCreateProject}
          onOpenAI={onOpenAI}
          onOpenResearch={onOpenResearch}
          onOpenPlanning={onOpenPlanning}
          onOpenTasks={onOpenTasks}
          onAddMember={onAddMember}
        />

        <RecentActivity
          notifications={notifications}
        />
      </div>
    </div>
  );
}