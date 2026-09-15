"use client";

import {
  Activity,
  Bot,
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

import UserProfileMenu from "@/components/UserProfileMenu";

import type { Organization } from "@/types/dashboard";

import type { DashboardTab } from "./DashboardShell";

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  organizations: Organization[];
  selectedOrganization: Organization | null;
  selectedOrganizationId: string | null;
  organizationsLoading: boolean;

  workspaceMenuOpen: boolean;
  setWorkspaceMenuOpen: (open: boolean) => void;

  onWorkspaceSwitch: (organizationId: string) => void;
  onCreateWorkspace: () => void;

  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const navigation: {
  id: DashboardTab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "planning",
    label: "Planning",
    icon: FolderKanban,
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: Activity,
  },
  {
    id: "agents",
    label: "AI Agents",
    icon: Bot,
  },
  {
    id: "research",
    label: "Research",
    icon: Sparkles,
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
  },
  {
    id: "activity",
    label: "Activity",
    icon: Activity,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function DashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
  organizations,
  selectedOrganization,
  organizationsLoading,
  workspaceMenuOpen,
  setWorkspaceMenuOpen,
  onWorkspaceSwitch,
  onCreateWorkspace,
  activeTab,
  onTabChange,
}: DashboardSidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <span className="text-sm font-bold">
                L
              </span>
            </div>

            <span className="text-lg font-bold tracking-tight text-slate-900">
              LYNOS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setWorkspaceMenuOpen(
                  !workspaceMenuOpen
                )
              }
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left hover:bg-slate-100"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Workspace
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {organizationsLoading
                    ? "Loading..."
                    : selectedOrganization?.name ||
                      "No workspace"}
                </p>
              </div>

              <ChevronDown
                size={16}
                className="shrink-0 text-slate-400"
              />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="max-h-64 overflow-y-auto p-1">
                  {organizations.map(
                    (organization) => (
                      <button
                        key={organization.id}
                        type="button"
                        onClick={() =>
                          onWorkspaceSwitch(
                            organization.id
                          )
                        }
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          selectedOrganization?.id ===
                          organization.id
                            ? "bg-slate-100 font-semibold text-slate-900"
                            : "text-slate-700"
                        }`}
                      >
                        {organization.name}
                      </button>
                    )
                  )}

                  {organizations.length === 0 && (
                    <p className="px-3 py-3 text-xs text-slate-500">
                      No workspaces yet.
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-100 p-1">
                  <button
                    type="button"
                    onClick={onCreateWorkspace}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus size={15} />
                    Create workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onTabChange(item.id)
                }
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <UserProfileMenu />
        </div>
      </aside>
    </>
  );
}