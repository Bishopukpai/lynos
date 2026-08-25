"use client";

import {
  Activity,
  Bell,
  Bot,
  Check,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import UserProfileMenu from "@/components/auth/UserProfileMenu";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";
import InviteMemberModal from "@/components/InviteMemberModal";
import NotificationDropdown from "@/components/NotificationDropdown";
import CreateProjectModal from "@/components/CreateProjectModal";
import PendingInvitationsManager from "@/components/PendingInvitationsManager";
import { useDashboard } from "@/hooks/useDashboard";
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

  // Dynamic calculations for real stats data
  const activeProjectsCount = projects
    ? projects.filter((p) => p.productionStatus !== "COMPLETED").length
    : 0;
  const teamMembersCount = selectedOrganization?.members ?? 1;
  const totalNotifications = notifications ? notifications.length : 0;
  const agentRunsCount = 0;

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
      change: unreadNotificationCount > 0 ? `${unreadNotificationCount} Unread` : "All read",
      icon: Activity,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">LYNOS</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="relative border-b border-slate-200 p-4">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
            disabled={organizationsLoading}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100 disabled:opacity-60"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {organizationsLoading ? "Loading..." : selectedOrganization ? selectedOrganization.name : "No workspace"}
              </p>
              {selectedOrganization && (
                <p className="mt-0.5 truncate text-xs capitalize text-slate-500">{selectedOrganization.role}</p>
              )}
            </div>
            <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-500 transition-transform ${workspaceMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {workspaceMenuOpen && !organizationsLoading && (
            <div className="absolute left-4 right-4 top-[calc(100%-0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="max-h-64 overflow-y-auto p-1.5">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleWorkspaceSwitch(org.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${org.id === selectedOrganizationId ? "text-indigo-700" : "text-slate-800"}`}>
                        {org.name}
                      </p>
                      <p className="mt-0.5 text-[11px] capitalize text-slate-400">{org.role}</p>
                    </div>
                    {org.id === selectedOrganizationId && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    setCreateWorkspaceOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="h-4 w-4" /> Create workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
          <a href="/dashboard" className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <FolderKanban className="h-4 w-4" /> Projects
          </a>
          <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <Bot className="h-4 w-4" /> AI Agents
          </a>
          <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <Users className="h-4 w-4" /> Team
          </a>
          <div className="my-5 border-t border-slate-200" />
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Management</p>
          <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <Activity className="h-4 w-4" /> Activity
          </a>
          <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            <Settings className="h-4 w-4" /> Settings
          </a>
        </nav>
        <div className="border-t border-slate-200 p-4">
          <UserProfileMenu variant="sidebar" />
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationPanelOpen((prev) => !prev)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
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
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{organizationsError}</div>
          )}

          {/* Welcome Banner */}
          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-600">{selectedOrganization ? selectedOrganization.name : "Overview"}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">
                {selectedOrganization ? `Here's what's happening across ${selectedOrganization.name}.` : "Create a workspace to start managing your work."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateWorkspaceOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> New Workspace
              </button>
              {canManageInvitations && (
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(true)}
                  disabled={!selectedOrganization}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" /> Invite Member
                </button>
              )}
              <button
                type="button"
                onClick={() => setCreateProjectOpen(true)}
                disabled={!selectedOrganization}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> New Project
              </button>
            </div>
          </section>

          {/* Dynamic Stats Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dynamicStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">{stat.change}</span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                </div>
              );
            })}
          </section>

          {/* Pending Invitations Management (Admins/Owners Only) */}
          {canManageInvitations && selectedOrganizationId && (
            <section className="mt-8">
              <PendingInvitationsManager
                organizationId={selectedOrganizationId}
                invitations={invitations || []}
                onRefresh={() => loadInvitations(selectedOrganizationId)}
              />
            </section>
          )}

          {/* Main Grid: Projects & Activity */}
          <section className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Recent Projects</h2>
                <button
                  type="button"
                  onClick={() => setCreateProjectOpen(true)}
                  disabled={!selectedOrganization}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  + Add Project
                </button>
              </div>

              {projectsError && (
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{projectsError}</div>
              )}

              {projectsLoading ? (
                <div className="flex items-center justify-center px-5 py-12 text-xs text-slate-500">
                  <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <FolderKanban className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">No projects created yet</p>
                  <p className="mt-1 text-xs text-slate-400">Click "New Project" to start adding production assets.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projects.map((project) => (
                    <div key={project._id} className="p-5 hover:bg-slate-50">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{project.title}</h3>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                statusStyles[project.productionStatus] || "bg-slate-50 text-slate-600"
                              }`}
                            >
                              {project.productionStatus}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{project.description}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-slate-600">
                          ${project.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
                        <span>Genre: <strong className="font-medium text-slate-600">{project.genre}</strong></span>
                        <span>Target: <strong className="font-medium text-slate-600">{project.targetAudience}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Recent Activity Feed */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
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
                      <p className="font-medium text-slate-700">{activity.title}</p>
                      <p className="mt-0.5 text-slate-500">{activity.message}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
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
    </div>
  );
}