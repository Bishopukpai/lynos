"use client";

import { useState } from "react";

import { useDashboard } from "@/hooks/useDashboard";
import { useProjectMembers } from "@/hooks/useProjectMembers";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardTabContent from "@/components/dashboard/DashboardTabContent";
import DashboardModals from "@/components/dashboard/DashboardModals";

export type DashboardTab =
  | "overview"
  | "planning"
  | "tasks"
  | "agents"
  | "research"
  | "team"
  | "activity"
  | "settings";

export default function DashboardShell() {
  const dashboard = useDashboard();

  const [activeTab, setActiveTab] =
    useState<DashboardTab>("overview");

  const [selectedProjectId, setSelectedProjectId] =
    useState<string | null>(null);

  const {
    projects,
    selectedOrganization,
    selectedOrganizationId,
  } = dashboard;

  const {
    members,
    loading: loadingMembers,
    addingMember,
    error: projectMemberError,
    isAddModalOpen: isAddProjectMemberModalOpen,
    setIsAddModalOpen: setIsAddProjectMemberModalOpen,
    addProjectMember,
  } = useProjectMembers(selectedProjectId);

  const activeProject =
    projects.find(
      (project) => project._id === selectedProjectId
    ) ?? null;

  function handleOpenAddMemberModal(projectId: string) {
    setSelectedProjectId(projectId);
    setIsAddProjectMemberModalOpen(true);
  }

  function handleOpenTasks(projectId: string) {
    setSelectedProjectId(projectId);
    setActiveTab("tasks");
  }

  function handleOpenPlanning(projectId: string) {
    setSelectedProjectId(projectId);
    setActiveTab("planning");
  }

  function handleOpenAI(projectId: string) {
    setSelectedProjectId(projectId);
    setActiveTab("agents");
  }

  function handleOpenResearch(projectId: string) {
    setSelectedProjectId(projectId);
    setActiveTab("research");
  }

  function handleProjectSelect(projectId: string) {
    setSelectedProjectId(projectId);
  }

  function handleTabChange(tab: DashboardTab) {
    setActiveTab(tab);
    dashboard.setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        sidebarOpen={dashboard.sidebarOpen}
        setSidebarOpen={dashboard.setSidebarOpen}
        organizations={dashboard.organizations}
        selectedOrganization={selectedOrganization}
        selectedOrganizationId={selectedOrganizationId}
        organizationsLoading={
          dashboard.organizationsLoading
        }
        workspaceMenuOpen={
          dashboard.workspaceMenuOpen
        }
        setWorkspaceMenuOpen={
          dashboard.setWorkspaceMenuOpen
        }
        onWorkspaceSwitch={
          dashboard.handleWorkspaceSwitch
        }
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCreateWorkspace={() =>
          dashboard.setCreateWorkspaceOpen(true)
        }
      />

      <div className="lg:pl-64">
        <DashboardHeader
          sidebarOpen={dashboard.sidebarOpen}
          setSidebarOpen={dashboard.setSidebarOpen}
          notifications={dashboard.notifications}
          unreadNotificationCount={
            dashboard.unreadNotificationCount
          }
          notificationsLoading={
            dashboard.notificationsLoading
          }
          notificationsError={
            dashboard.notificationsError
          }
          notificationPanelOpen={
            dashboard.notificationPanelOpen
          }
          setNotificationPanelOpen={
            dashboard.setNotificationPanelOpen
          }
          notificationActionId={
            dashboard.notificationActionId
          }
          markNotificationAsRead={
            dashboard.markNotificationAsRead
          }
          handleAcceptNotification={
            dashboard.handleAcceptNotification
          }
          handleDeclineNotification={
            dashboard.handleDeclineNotification
          }
          loadNotifications={
            dashboard.loadNotifications
          }
        />

        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {dashboard.organizationsError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {dashboard.organizationsError}
            </div>
          )}

          {activeTab === "overview" ? (
            <DashboardOverview
              selectedOrganization={
                selectedOrganization
              }
              selectedOrganizationId={
                selectedOrganizationId
              }
              projects={projects}
              projectsLoading={
                dashboard.projectsLoading
              }
              projectsError={
                dashboard.projectsError
              }
              notifications={dashboard.notifications}
              canManageInvitations={
                dashboard.canManageInvitations
              }
              invitations={dashboard.invitations}
              invitationsLoading={
                dashboard.invitationsLoading
              }
              invitationsError={
                dashboard.invitationsError
              }
              resendingInvitationId={
                dashboard.resendingInvitationId
              }
              cancellingInvitationId={
                dashboard.cancellingInvitationId
              }
              onCreateWorkspace={() =>
                dashboard.setCreateWorkspaceOpen(true)
              }
              onInviteMember={() =>
                dashboard.setInviteModalOpen(true)
              }
              onCreateProject={() =>
                dashboard.setCreateProjectOpen(true)
              }
              onOpenAI={handleOpenAI}
              onOpenResearch={
                handleOpenResearch
              }
              onOpenPlanning={
                handleOpenPlanning
              }
              onOpenTasks={handleOpenTasks}
              onAddMember={
                handleOpenAddMemberModal
              }
              onResendInvitation={
                dashboard.handleResendInvitation
              }
              onCancelInvitation={
                dashboard.handleCancelInvitation
              }
            />
          ) : (
            <DashboardTabContent
              activeTab={activeTab}
              projects={projects}
              selectedProjectId={
                selectedProjectId
              }
              activeProject={activeProject}
              members={members}
              loadingMembers={loadingMembers}
              projectMemberError={
                projectMemberError
              }
              onProjectSelect={
                handleProjectSelect
              }
              onBackToOverview={() =>
                setActiveTab("overview")
              }
            />
          )}
        </main>
      </div>

      <DashboardModals
        createWorkspaceOpen={
          dashboard.createWorkspaceOpen
        }
        setCreateWorkspaceOpen={
          dashboard.setCreateWorkspaceOpen
        }
        workspaceName={
          dashboard.workspaceName
        }
        setWorkspaceName={
          dashboard.setWorkspaceName
        }
        workspaceDescription={
          dashboard.workspaceDescription
        }
        setWorkspaceDescription={
          dashboard.setWorkspaceDescription
        }
        creatingWorkspace={
          dashboard.creatingWorkspace
        }
        createWorkspaceError={
          dashboard.createWorkspaceError
        }
        handleCreateWorkspace={
          dashboard.handleCreateWorkspace
        }
        inviteModalOpen={
          dashboard.inviteModalOpen
        }
        setInviteModalOpen={
          dashboard.setInviteModalOpen
        }
        inviteEmail={
          dashboard.inviteEmail
        }
        setInviteEmail={
          dashboard.setInviteEmail
        }
        inviteRole={
          dashboard.inviteRole
        }
        setInviteRole={
          dashboard.setInviteRole
        }
        sendingInvite={
          dashboard.sendingInvite
        }
        inviteError={
          dashboard.inviteError
        }
        inviteSuccess={
          dashboard.inviteSuccess
        }
        handleSendInvitation={
          dashboard.handleSendInvitation
        }
        createProjectOpen={
          dashboard.createProjectOpen
        }
        setCreateProjectOpen={
          dashboard.setCreateProjectOpen
        }
        creatingProject={
          dashboard.creatingProject
        }
        createProjectError={
          dashboard.createProjectError
        }
        handleCreateProject={
          dashboard.handleCreateProject
        }
        isAddProjectMemberModalOpen={
          isAddProjectMemberModalOpen
        }
        setIsAddProjectMemberModalOpen={
          setIsAddProjectMemberModalOpen
        }
        selectedProjectId={
          selectedProjectId
        }
        members={members}
        addingMember={addingMember}
        projectMemberError={
          projectMemberError
        }
        addProjectMember={
          addProjectMember
        }
      />
    </div>
  );
}