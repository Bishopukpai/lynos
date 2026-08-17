"use client";

import {
  Activity,
  Bell,
  Bot,
  Check,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import UserProfileMenu from "@/components/auth/UserProfileMenu";

interface Organization {
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
}

const stats = [
  {
    label: "Active Projects",
    value: "12",
    change: "+18%",
    icon: FolderKanban,
  },
  {
    label: "AI Agent Runs",
    value: "248",
    change: "+24%",
    icon: Bot,
  },
  {
    label: "Team Members",
    value: "8",
    change: "+2",
    icon: Users,
  },
  {
    label: "Recent Activity",
    value: "36",
    change: "+12%",
    icon: Activity,
  },
];

const projects = [
  {
    name: "Market Research",
    description:
      "Analyze market opportunities and competitors.",
    status: "In Progress",
    progress: 72,
  },
  {
    name: "Product Launch",
    description:
      "Coordinate product development and launch activities.",
    status: "Planning",
    progress: 42,
  },
  {
    name: "AI Automation",
    description:
      "Build automated workflows using LYNOS agents.",
    status: "In Progress",
    progress: 61,
  },
];

const activities = [
  {
    title: "Market Research Agent completed a run",
    time: "12 minutes ago",
  },
  {
    title: 'New project "AI Automation" was created',
    time: "1 hour ago",
  },
  {
    title:
      "Production Planning Agent generated a plan",
    time: "3 hours ago",
  },
  {
    title: "Team member joined the workspace",
    time: "Yesterday",
  },
];

const SELECTED_WORKSPACE_KEY =
  "lynos:selected-workspace";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /*
   * -------------------------------------------------------
   * WORKSPACE STATE
   * -------------------------------------------------------
   */

  const [organizations, setOrganizations] = useState<
    Organization[]
  >([]);

  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string | null>(null);

  const [organizationsLoading, setOrganizationsLoading] =
    useState(true);

  const [organizationsError, setOrganizationsError] =
    useState<string | null>(null);

  const [workspaceMenuOpen, setWorkspaceMenuOpen] =
    useState(false);

  /*
   * -------------------------------------------------------
   * CREATE WORKSPACE STATE
   * -------------------------------------------------------
   */

  const [createWorkspaceOpen, setCreateWorkspaceOpen] =
    useState(false);

  const [workspaceName, setWorkspaceName] =
    useState("");

  const [workspaceDescription, setWorkspaceDescription] =
    useState("");

  const [creatingWorkspace, setCreatingWorkspace] =
    useState(false);

  const [createWorkspaceError, setCreateWorkspaceError] =
    useState<string | null>(null);

  /*
   * -------------------------------------------------------
   * CURRENT WORKSPACE
   * -------------------------------------------------------
   */

  const selectedOrganization = useMemo(() => {
    if (!selectedOrganizationId) {
      return null;
    }

    return (
      organizations.find(
        (organization) =>
          organization.id === selectedOrganizationId
      ) ?? null
    );
  }, [
    organizations,
    selectedOrganizationId,
  ]);

  /*
   * -------------------------------------------------------
   * LOAD USER WORKSPACES
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizations() {
      try {
        setOrganizationsLoading(true);
        setOrganizationsError(null);

        const response = await fetch(
          "/api/organizations",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to load your workspaces."
          );
        }

        if (cancelled) {
          return;
        }

        const loadedOrganizations =
          Array.isArray(data.organizations)
            ? data.organizations
            : [];

        setOrganizations(loadedOrganizations);

        /*
         * Restore the previously selected workspace.
         */
        let savedWorkspaceId: string | null = null;

        try {
          savedWorkspaceId =
            window.localStorage.getItem(
              SELECTED_WORKSPACE_KEY
            );
        } catch {
          /*
           * localStorage may be unavailable in some
           * browser environments. This is not fatal.
           */
        }

        /*
         * If the saved workspace still exists,
         * select it.
         */
        const savedWorkspaceExists =
          savedWorkspaceId &&
          loadedOrganizations.some(
            (organization: Organization) =>
              organization.id === savedWorkspaceId
          );

        if (savedWorkspaceExists) {
          setSelectedOrganizationId(
            savedWorkspaceId
          );

          return;
        }

        /*
         * Otherwise select the first workspace.
         */
        if (loadedOrganizations.length > 0) {
          const firstWorkspace =
            loadedOrganizations[0];

          setSelectedOrganizationId(
            firstWorkspace.id
          );

          try {
            window.localStorage.setItem(
              SELECTED_WORKSPACE_KEY,
              firstWorkspace.id
            );
          } catch {
            /*
             * Ignore localStorage failures.
             */
          }
        } else {
          setSelectedOrganizationId(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Load organizations error:",
          error
        );

        setOrganizationsError(
          error instanceof Error
            ? error.message
            : "Unable to load your workspaces."
        );
      } finally {
        if (!cancelled) {
          setOrganizationsLoading(false);
        }
      }
    }

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * -------------------------------------------------------
   * SWITCH WORKSPACE
   * -------------------------------------------------------
   */

  function handleWorkspaceSwitch(
    organizationId: string
  ) {
    setSelectedOrganizationId(
      organizationId
    );

    try {
      window.localStorage.setItem(
        SELECTED_WORKSPACE_KEY,
        organizationId
      );
    } catch {
      /*
       * Ignore localStorage failures.
       */
    }

    setWorkspaceMenuOpen(false);
  }

  /*
   * -------------------------------------------------------
   * OPEN CREATE WORKSPACE
   * -------------------------------------------------------
   */

  function openCreateWorkspace() {
    setWorkspaceMenuOpen(false);

    setWorkspaceName("");
    setWorkspaceDescription("");
    setCreateWorkspaceError(null);

    setCreateWorkspaceOpen(true);
  }

  /*
   * -------------------------------------------------------
   * CREATE WORKSPACE
   * -------------------------------------------------------
   */

  async function handleCreateWorkspace(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName =
      workspaceName.trim();

    const trimmedDescription =
      workspaceDescription.trim();

    if (trimmedName.length < 2) {
      setCreateWorkspaceError(
        "Workspace name must be at least 2 characters."
      );

      return;
    }

    if (trimmedName.length > 100) {
      setCreateWorkspaceError(
        "Workspace name must not exceed 100 characters."
      );

      return;
    }

    if (trimmedDescription.length > 500) {
      setCreateWorkspaceError(
        "Workspace description must not exceed 500 characters."
      );

      return;
    }

    try {
      setCreatingWorkspace(true);
      setCreateWorkspaceError(null);

      const response = await fetch(
        "/api/organizations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            ...(trimmedDescription
              ? {
                  description:
                    trimmedDescription,
                }
              : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create workspace."
        );
      }

      const createdOrganization =
        data?.organization;

      if (!createdOrganization?.id) {
        throw new Error(
          "Workspace was created, but the server returned an invalid workspace."
        );
      }

      /*
       * The POST endpoint returns the newly created
       * organization and membership.
       *
       * Add it to the local workspace list.
       */
      const newOrganization: Organization = {
        id: createdOrganization.id,
        name: createdOrganization.name,
        slug: createdOrganization.slug,
        description:
          createdOrganization.description ??
          null,
        ownerId: createdOrganization.ownerId,
        status: createdOrganization.status,
        role:
          data?.membership?.role ??
          "owner",
        membershipStatus:
          data?.membership?.status ??
          "active",
        createdAt:
          createdOrganization.createdAt,
        updatedAt:
          createdOrganization.updatedAt,
      };

      setOrganizations((current) => [
        ...current,
        newOrganization,
      ]);

      /*
       * Automatically switch to the new workspace.
       */
      setSelectedOrganizationId(
        newOrganization.id
      );

      try {
        window.localStorage.setItem(
          SELECTED_WORKSPACE_KEY,
          newOrganization.id
        );
      } catch {
        /*
         * Ignore localStorage failures.
         */
      }

      /*
       * Close the modal.
       */
      setCreateWorkspaceOpen(false);

      setWorkspaceName("");
      setWorkspaceDescription("");
      setCreateWorkspaceError(null);
    } catch (error) {
      console.error(
        "Create workspace error:",
        error
      );

      setCreateWorkspaceError(
        error instanceof Error
          ? error.message
          : "Unable to create workspace."
      );
    } finally {
      setCreatingWorkspace(false);
    }
  }

  /*
   * -------------------------------------------------------
   * CLOSE CREATE WORKSPACE MODAL
   * -------------------------------------------------------
   */

  function closeCreateWorkspace() {
    if (creatingWorkspace) {
      return;
    }

    setCreateWorkspaceOpen(false);
    setCreateWorkspaceError(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ---------------------------------------------------
          MOBILE OVERLAY
      --------------------------------------------------- */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* ---------------------------------------------------
          SIDEBAR
      --------------------------------------------------- */}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}

        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>

            <span className="text-lg font-bold tracking-tight">
              LYNOS
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* -------------------------------------------------
            WORKSPACE SWITCHER
        ------------------------------------------------- */}

        <div className="relative border-b border-slate-200 p-4">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <button
            type="button"
            onClick={() =>
              setWorkspaceMenuOpen(
                (open) => !open
              )
            }
            disabled={organizationsLoading}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {selectedOrganization.role ===
                  "owner"
                    ? "Owner"
                    : selectedOrganization.role ===
                        "admin"
                      ? "Admin"
                      : "Member"}
                </p>
              )}
            </div>

            <ChevronDown
              className={`ml-2 h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                workspaceMenuOpen
                  ? "rotate-180"
                  : ""
              }`}
            />
          </button>

          {/* Workspace dropdown */}

          {workspaceMenuOpen &&
            !organizationsLoading && (
              <div className="absolute left-4 right-4 top-[calc(100%-0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="max-h-64 overflow-y-auto p-1.5">
                  {organizations.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        No workspaces yet
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Create your first workspace
                        to get started.
                      </p>
                    </div>
                  ) : (
                    organizations.map(
                      (organization) => {
                        const isSelected =
                          organization.id ===
                          selectedOrganizationId;

                        return (
                          <button
                            key={
                              organization.id
                            }
                            type="button"
                            onClick={() =>
                              handleWorkspaceSwitch(
                                organization.id
                              )
                            }
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm font-medium ${
                                  isSelected
                                    ? "text-indigo-700"
                                    : "text-slate-800"
                                }`}
                              >
                                {
                                  organization.name
                                }
                              </p>

                              <p className="mt-0.5 text-[11px] capitalize text-slate-400">
                                {
                                  organization.role
                                }
                              </p>
                            </div>

                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                            )}
                          </button>
                        );
                      }
                    )
                  )}
                </div>

                <div className="border-t border-slate-200 p-1.5">
                  <button
                    type="button"
                    onClick={
                      openCreateWorkspace
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
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

          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-700"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </a>

          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </a>

          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bot className="h-4 w-4" />
            AI Agents
          </a>

          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Users className="h-4 w-4" />
            Team
          </a>

          <div className="my-5 border-t border-slate-200" />

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Management
          </p>

          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Activity className="h-4 w-4" />
            Activity
          </a>

          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Settings className="h-4 w-4" />
            Settings
          </a>
        </nav>

        {/* Sidebar User Profile */}

        <div className="border-t border-slate-200 p-4">
          <UserProfileMenu variant="sidebar" />
        </div>
      </aside>

      {/* ---------------------------------------------------
          MAIN AREA
      --------------------------------------------------- */}

      <div className="lg:pl-64">
        {/* Header */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}

            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-600" />
            </button>

            <div className="ml-1 hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Navbar User Profile */}

            <UserProfileMenu variant="navbar" />
          </div>
        </header>

        {/* Content */}

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Workspace loading/error status */}

          {organizationsError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {organizationsError}
            </div>
          )}

          {/* Welcome */}

          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                {selectedOrganization
                  ? selectedOrganization.name
                  : "Overview"}
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back 👋
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {selectedOrganization
                  ? `Here&apos;s what&apos;s happening across ${selectedOrganization.name}.`
                  : "Create a workspace to start managing your work."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  openCreateWorkspace
                }
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                New Workspace
              </button>

              <button
                type="button"
                disabled={!selectedOrganization}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>
          </section>

          {/* Empty workspace state */}

          {!organizationsLoading &&
            organizations.length === 0 && (
              <section className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>

                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  Create your first workspace
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  Workspaces keep your projects,
                  AI agents, team members, and activity
                  organized in one place.
                </p>

                <button
                  type="button"
                  onClick={
                    openCreateWorkspace
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Create workspace
                </button>
              </section>
            )}

          {/* Stats */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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

          {/* Main grid */}

          <section className="mt-8 grid gap-6 xl:grid-cols-3">
            {/* Projects */}

            <div className="xl:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Recent Projects
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Your latest workspace projects
                    </p>
                  </div>

                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View all
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {projects.map((project) => (
                    <div
                      key={project.name}
                      className="p-5 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {project.name}
                            </h3>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                project.status ===
                                "In Progress"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {project.status}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {project.description}
                          </p>
                        </div>

                        <span className="text-xs font-semibold text-slate-600">
                          {project.progress}%
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{
                            width: `${project.progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity */}

            <div>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="text-base font-semibold text-slate-900">
                    Recent Activity
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Latest workspace events
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {activities.map((activity) => (
                    <div
                      key={`${activity.title}-${activity.time}`}
                      className="flex gap-3 p-4"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Activity className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-5 text-slate-700">
                          {activity.title}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 p-4">
                  <button
                    type="button"
                    className="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    View activity
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* AI Agents */}

          <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    AI Agents are ready
                  </h2>

                  <p className="mt-1 max-w-xl text-sm text-slate-600">
                    Deploy LYNOS agents to research
                    markets, plan production, analyze
                    opportunities, and automate repetitive
                    workflows.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedOrganization}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Explore Agents
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* ---------------------------------------------------
          CREATE WORKSPACE MODAL
      --------------------------------------------------- */}

      {createWorkspaceOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-workspace-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal header */}

            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="create-workspace-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Create workspace
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a workspace for your projects,
                  agents, and team.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCreateWorkspace
                }
                disabled={creatingWorkspace}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close create workspace dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal form */}

            <form
              onSubmit={
                handleCreateWorkspace
              }
            >
              <div className="space-y-5 px-6 py-6">
                {/* Workspace name */}

                <div>
                  <label
                    htmlFor="workspace-name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Workspace name
                  </label>

                  <input
                    id="workspace-name"
                    type="text"
                    value={workspaceName}
                    onChange={(event) =>
                      setWorkspaceName(
                        event.target.value
                      )
                    }
                    placeholder="My Production Studio"
                    maxLength={100}
                    disabled={creatingWorkspace}
                    autoFocus
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    {workspaceName.length}/100
                  </p>
                </div>

                {/* Workspace description */}

                <div>
                  <label
                    htmlFor="workspace-description"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Description
                    <span className="ml-1 font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="workspace-description"
                    value={
                      workspaceDescription
                    }
                    onChange={(event) =>
                      setWorkspaceDescription(
                        event.target.value
                      )
                    }
                    placeholder="What will this workspace be used for?"
                    maxLength={500}
                    rows={4}
                    disabled={creatingWorkspace}
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    {
                      workspaceDescription.length
                    }
                    /500
                  </p>
                </div>

                {/* Error */}

                {createWorkspaceError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {createWorkspaceError}
                  </div>
                )}
              </div>

              {/* Modal footer */}

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={
                    closeCreateWorkspace
                  }
                  disabled={creatingWorkspace}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingWorkspace ||
                    workspaceName.trim()
                      .length < 2
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      )}
    </div>
  );
}