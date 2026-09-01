"use client";

import { useState } from "react";
import { TabType } from "@/types/navigation";
import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Mail,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import UserProfileMenu from "@/components/auth/UserProfileMenu";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";
import InviteMemberModal from "@/components/InviteMemberModal";
import NotificationDropdown from "@/components/NotificationDropdown";
import CreateProjectModal from "@/components/CreateProjectModal";
import PendingInvitationsManager from "@/components/PendingInvitationsManager";
import { AddProjectMemberModal } from "@/components/AddProjectMemberModal";
import ProductionTasksBoard from "@/components/ProductionTasksBoard";
import ProductionPlanner from "@/components/ProductionPlanner";
import ScenePilotAI from "@/components/ScenePilotAI";
import { useDashboard } from "@/hooks/useDashboard";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { StatItem } from "@/types/dashboard";

const statusStyles: Record<string, string> = {
  IDEA: "bg-slate-100 text-slate-700 border-slate-200",
  "PRE PRODUCTION": "bg-amber-50 text-amber-700 border-amber-200",
  "IN PRODUCTION": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "POST PRODUCTION": "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function DashboardPage() {
  const {
    sidebarOpen,
    setSidebarOpen,
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    organizationsLoading,
    organizationsError,
    workspaceMenuOpen,
    setWorkspaceMenuOpen,
    createWorkspaceOpen,
    setCreateWorkspaceOpen,
    workspaceName,
    setWorkspaceName,
    workspaceDescription,
    setWorkspaceDescription,
    creatingWorkspace,
    createWorkspaceError,
    projects,
    projectsLoading,
    projectsError,
    createProjectOpen,
    setCreateProjectOpen,
    creatingProject,
    createProjectError,
    handleCreateProject,
    invitations,
    invitationsLoading,
    invitationsError,
    inviteModalOpen,
    setInviteModalOpen,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    sendingInvite,
    inviteError,
    inviteSuccess,
    notifications,
    unreadNotificationCount,
    notificationsLoading,
    notificationsError,
    notificationPanelOpen,
    setNotificationPanelOpen,
    notificationActionId,
    canManageInvitations,
    handleWorkspaceSwitch,
    handleCreateWorkspace,
    handleSendInvitation,
    markNotificationAsRead,
    handleAcceptNotification,
    handleDeclineNotification,
    loadNotifications,
    loadInvitations,
  } = useDashboard();

  // Active navigation tab state
  const [activeTab, setActiveTab] = useState<TabType | "planning" | "agents">("overview");

  // Selected project state for adding members, viewing tasks, and production planning
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Hook for managing project members separately from global dashboard state
  const {
    members,
    loading: loadingMembers,
    addingMember,
    error: projectMemberError,
    isAddModalOpen: isAddProjectMemberModalOpen,
    setIsAddModalOpen: setIsAddProjectMemberModalOpen,
    addProjectMember,
  } = useProjectMembers(selectedProjectId);

  const handleOpenAddMemberModal = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsAddProjectMemberModalOpen(true);
  };

  const handleOpenTasks = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab("tasks");
  };

  const handleOpenPlanning = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab("planning");
  };

  const handleOpenAI = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab("agents");
  };

  // Dynamic calculations for real stats data
  const activeProjectsCount = projects
    ? projects.filter((p) => p.productionStatus !== "COMPLETED").length
    : 0;
  const teamMembersCount = selectedOrganization?.members ?? 1;
  const totalNotifications = notifications ? notifications.length : 0;
  const agentRunsCount = projects.length > 0 ? 1 : 0;

  const dynamicStats: StatItem[] = [
    {
      label: "Active Projects",
      value: projectsLoading ? "..." : String(activeProjectsCount),
      change: projects ? `${projects.length} Total` : "0 Total",
      icon: FolderKanban,
    },
    {
      label: "AI Agent Runs",
      value: String(agentRunsCount),
      change: "Active",
      icon: Bot,
    },
    {
      label: "Team Members",
      value: invitationsLoading ? "..." : String(teamMembersCount),
      change: invitations?.length ? `${invitations.length} Pending` : "0 Pending",
      icon: Users,
    },
    {
      label: "Recent Activity",
      value: notificationsLoading ? "..." : String(totalNotifications),
      change:
        unreadNotificationCount > 0
          ? `${unreadNotificationCount} Unread`
          : "All read",
      icon: Activity,
    },
  ];

  const activeProject = projects.find((p) => p._id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">LYNOS</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="relative border-b border-slate-200 p-4">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
            disabled={organizationsLoading}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-indigo-200 hover:bg-slate-100/80 disabled:opacity-60"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {organizationsLoading
                  ? "Loading..."
                  : selectedOrganization
                  ? selectedOrganization.name
                  : "No workspace"}
              </p>
              {selectedOrganization && (
                <p className="mt-0.5 truncate text-xs capitalize text-slate-500">
                  {selectedOrganization.role}
                </p>
              )}
            </div>
            <ChevronDown
              className={`ml-2 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                workspaceMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {workspaceMenuOpen && !organizationsLoading && (
            <div className="absolute left-4 right-4 top-[calc(100%-0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
              <div className="max-h-64 overflow-y-auto p-1.5">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleWorkspaceSwitch(org.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-medium ${
                          org.id === selectedOrganizationId
                            ? "text-indigo-700 font-semibold"
                            : "text-slate-800"
                        }`}
                      >
                        {org.name}
                      </p>
                      <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                        {org.role}
                      </p>
                    </div>
                    {org.id === selectedOrganizationId && (
                      <Check className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    setCreateWorkspaceOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50/70"
                >
                  <Plus className="h-4 w-4" />
                  Create workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "overview"
                ? "bg-indigo-50/80 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("planning")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "planning"
                ? "bg-indigo-50/80 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Production Planning
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "tasks"
                ? "bg-indigo-50/80 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            Tasks Board
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("agents")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "agents"
                ? "bg-indigo-50/80 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Bot className="h-4 w-4" />
            AI Agents
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "team"
                ? "bg-indigo-50/80 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            Team
          </button>
          <div className="my-5 border-t border-slate-200" />
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Management
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "activity"
                ? "bg-indigo-50/80 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Activity className="h-4 w-4" />
            Activity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "settings"
                ? "bg-indigo-50/80 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </nav>
        <div className="border-t border-slate-200 p-4">
          <UserProfileMenu variant="sidebar" />
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationPanelOpen((prev) => !prev)}
                className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Open notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={notificationPanelOpen}
                onClose={() => setNotificationPanelOpen(false)}
                notifications={notifications}
                unreadCount={unreadNotificationCount}
                loading={notificationsLoading}
                error={notificationsError}
                actionId={notificationActionId}
                onAccept={handleAcceptNotification}
                onDecline={handleDeclineNotification}
                onMarkAsRead={markNotificationAsRead}
                onRefresh={loadNotifications}
              />
            </div>
            <div className="ml-1 hidden h-6 w-px bg-slate-200 sm:block" />
            <UserProfileMenu variant="navbar" />
          </div>
        </header>

        {/* Content Area */}
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {organizationsError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
              {organizationsError}
            </div>
          )}

          {activeTab === "overview" ? (
            <>
              {/* Welcome Banner */}
              <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    {selectedOrganization ? selectedOrganization.name : "Overview"}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Welcome back
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedOrganization
                      ? `Here's what's happening across ${selectedOrganization.name}.`
                      : "Create a workspace to start managing your work."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateWorkspaceOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                  >
                    <Plus className="h-4 w-4 text-slate-500" />
                    New Workspace
                  </button>
                  {canManageInvitations && (
                    <button
                      type="button"
                      onClick={() => setInviteModalOpen(true)}
                      disabled={!selectedOrganization}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100/80 disabled:opacity-50 active:scale-95"
                    >
                      <Mail className="h-4 w-4" />
                      Invite Member
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCreateProjectOpen(true)}
                    disabled={!selectedOrganization}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-100 transition hover:bg-indigo-700 disabled:opacity-50 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    New Project
                  </button>
                </div>
              </section>

              {/* Dynamic Stats Grid */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dynamicStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">
                          {stat.change}
                        </span>
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  );
                })}
              </section>

              {/* Pending Invitations Management */}
              {canManageInvitations && selectedOrganizationId && (
                <section className="mt-8">
                  {invitationsError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-700">
                      {invitationsError}
                    </div>
                  )}
                  <PendingInvitationsManager
                    organizationId={selectedOrganizationId}
                    invitations={invitations || []}
                    onRefresh={() => loadInvitations(selectedOrganizationId)}
                  />
                </section>
              )}

              {/* Main Grid: Projects & Activity */}
              <section className="mt-8 grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      Recent Projects
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCreateProjectOpen(true)}
                      disabled={!selectedOrganization}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      + Add Project
                    </button>
                  </div>
                  {projectsError && (
                    <div className="m-4 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
                      {projectsError}
                    </div>
                  )}
                  {projectsLoading ? (
                    <div className="flex items-center justify-center px-5 py-12 text-xs text-slate-500">
                      <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                      Loading projects...
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <FolderKanban className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        No projects created yet
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Click &quot;New Project&quot; to start adding production assets.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {projects.map((project) => (
                        <div
                          key={project._id}
                          className="p-6 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-sm font-bold text-slate-900">
                                  {project.title}
                                </h3>
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                    statusStyles[project.productionStatus] ||
                                    "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {project.productionStatus}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">
                                {project.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="mr-2 text-sm font-bold text-slate-900">
                                ${project.budget.toLocaleString()}
                              </span>
                              {/* Action: Open AI Intelligence */}
                              <button
                                type="button"
                                onClick={() => handleOpenAI(project._id)}
                                className="group inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100/80 active:scale-95"
                                title="Open AI Production Intelligence"
                              >
                                <Bot className="h-3.5 w-3.5" />
                                <span>AI Agent</span>
                              </button>
                              {/* Action: Planning Interface */}
                              <button
                                type="button"
                                onClick={() => handleOpenPlanning(project._id)}
                                className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-95"
                                title="Open production planning for this project"
                              >
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>Plan</span>
                              </button>
                              {/* Action: Open Task Board */}
                              <button
                                type="button"
                                onClick={() => handleOpenTasks(project._id)}
                                className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-95"
                                title="View tasks for this project"
                              >
                                <ListTodo className="h-3.5 w-3.5" />
                                <span>Tasks</span>
                              </button>
                              {/* Add Member Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenAddMemberModal(project._id)}
                                className="group inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-95"
                                title="Add team member to this project"
                              >
                                <UserPlus className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-indigo-600" />
                                <span>Add Member</span>
                              </button>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
                            <span>
                              Genre:{" "}
                              <strong className="font-semibold text-slate-600">
                                {project.genre}
                              </strong>
                            </span>
                            <span>
                              Target:{" "}
                              <strong className="font-semibold text-slate-600">
                                {project.targetAudience}
                              </strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dynamic Recent Activity Feed */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      Recent Activity
                    </h2>
                  </div>
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center p-6 text-xs text-slate-500">
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                      Loading activity...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No recent activity recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="p-4 text-xs">
                          <p className="font-medium text-slate-700">
                            {activity.title}
                          </p>
                          <p className="mt-0.5 text-slate-500">
                            {activity.message}
                          </p>
                          <p className="mt-1.5 text-[10px] text-slate-400">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : activeTab === "agents" ? (
            /* AI Production Intelligence Agents View */
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    ScenePilot AI Production Intelligence
                  </h1>
                  <p className="text-sm text-slate-500">
                    {activeProject
                      ? `Analyzing production context for: ${activeProject.title}`
                      : "Select a project to generate risk assessments, schedules, and automated tasks."}
                  </p>
                </div>
                {projects.length > 0 && (
                  <select
                    value={selectedProjectId || ""}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {selectedProjectId ? (
                <ScenePilotAI projectId={selectedProjectId} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <Bot className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-base font-semibold text-slate-800">
                    No project selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a project from the dropdown above or click &quot;AI Agent&quot; next to a project on the Overview page.
                  </p>
                </div>
              )}
            </section>
          ) : activeTab === "planning" ? (
            /* Production Planning View */
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Production Planning
                  </h1>
                  <p className="text-sm text-slate-500">
                    {activeProject
                      ? `Managing production schedule and assets for: ${activeProject.title}`
                      : "Select a project to manage timelines, schedules, and planning assets."}
                  </p>
                </div>
                {projects.length > 0 && (
                  <select
                    value={selectedProjectId || ""}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {selectedProjectId ? (
                <ProductionPlanner
                  projectId={selectedProjectId}
                  members={members}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-base font-semibold text-slate-800">
                    No project selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a project from the dropdown above or click &quot;Plan&quot; next to a project on the Overview page.
                  </p>
                </div>
              )}
            </section>
          ) : (
            /* Tasks View */
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Production Tasks
                  </h1>
                  <p className="text-sm text-slate-500">
                    {activeProject
                      ? `Managing tasks for project: ${activeProject.title}`
                      : "Select a project to view specific tasks or manage all workspace tasks."}
                  </p>
                </div>
                {projects.length > 0 && (
                  <select
                    value={selectedProjectId || ""}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {selectedProjectId ? (
                <ProductionTasksBoard
                  projectId={selectedProjectId}
                  members={members}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <ListTodo className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-base font-semibold text-slate-800">
                    No project selected
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a project from the dropdown above or click &quot;Tasks&quot; next to a project on the Overview page.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
        onSubmit={handleCreateWorkspace}
        workspaceName={workspaceName}
        setWorkspaceName={setWorkspaceName}
        workspaceDescription={workspaceDescription}
        setWorkspaceDescription={setWorkspaceDescription}
        creatingWorkspace={creatingWorkspace}
        createWorkspaceError={createWorkspaceError}
      />
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSubmit={handleSendInvitation}
        workspaceName={selectedOrganization?.name}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        sendingInvite={sendingInvite}
        inviteError={inviteError}
        inviteSuccess={inviteSuccess}
      />
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        creating={creatingProject}
        error={createProjectError}
      />
      <AddProjectMemberModal
        isOpen={isAddProjectMemberModalOpen}
        onClose={() => setIsAddProjectMemberModalOpen(false)}
        onSubmit={addProjectMember}
        isLoading={addingMember}
        error={projectMemberError}
        members={members}
        loadingMembers={loadingMembers}
      />
    </div>
  );
}