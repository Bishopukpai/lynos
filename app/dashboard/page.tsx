"use client";

import {
  Activity,
  Bell,
  Bot,
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
import { useState } from "react";

import UserProfileMenu from "@/components/auth/UserProfileMenu";

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

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
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
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace */}
        <div className="border-b border-slate-200 p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100"
          >
            <div>
              <p className="text-xs font-medium text-slate-500">
                Workspace
              </p>

              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                My Workspace
              </p>
            </div>
          </button>
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

      {/* Main area */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
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
          {/* Welcome */}
          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                Overview
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back 👋
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Here&apos;s what&apos;s happening across your
                workspace.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </section>

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
                    Deploy LYNOS agents to research markets,
                    plan production, analyze opportunities, and
                    automate repetitive workflows.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                Explore Agents
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

