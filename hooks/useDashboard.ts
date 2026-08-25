"use client";

import { useState, useEffect, useMemo } from "react";
import { Organization, Invitation, Notification, Project } from "@/types/dashboard";

const SELECTED_WORKSPACE_KEY = "lynos:selected-workspace";

export function useDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Workspaces
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);

  // Create Workspace State
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [createWorkspaceError, setCreateWorkspaceError] = useState<string | null>(null);

  // Invitations State
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [resendingInvitationId, setResendingInvitationId] = useState<string | null>(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notificationActionId, setNotificationActionId] = useState<string | null>(null);

  const selectedOrganization = useMemo(() => {
    if (!selectedOrganizationId) return null;
    return organizations.find((org) => org.id === selectedOrganizationId) ?? null;
  }, [organizations, selectedOrganizationId]);

  const canManageInvitations =
    selectedOrganization?.role === "owner" || selectedOrganization?.role === "admin";

  // Fetch Projects
  async function loadProjects(orgId: string) {
    try {
      setProjectsLoading(true);
      setProjectsError(null);
      const res = await fetch(`/api/projects?organizationId=${orgId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load projects.");
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (err) {
      setProjectsError(err instanceof Error ? err.message : "Failed to load projects.");
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }

  // Fetch Organizations
  async function loadOrganizations() {
    try {
      setOrganizationsLoading(true);
      setOrganizationsError(null);
      const res = await fetch("/api/organizations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to load your workspaces.");

      const loadedOrgs = Array.isArray(data.organizations) ? data.organizations : [];
      setOrganizations(loadedOrgs);

      let savedWorkspaceId: string | null = null;
      try {
        savedWorkspaceId = window.localStorage.getItem(SELECTED_WORKSPACE_KEY);
      } catch {}

      if (savedWorkspaceId && loadedOrgs.some((org: Organization) => org.id === savedWorkspaceId)) {
        setSelectedOrganizationId(savedWorkspaceId);
      } else if (loadedOrgs.length > 0) {
        setSelectedOrganizationId(loadedOrgs[0].id);
      } else {
        setSelectedOrganizationId(null);
      }
    } catch (error) {
      setOrganizationsError(error instanceof Error ? error.message : "Unable to load workspaces.");
    } finally {
      setOrganizationsLoading(false);
    }
  }

  // Fetch Notifications
  async function loadNotifications() {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to load notifications.");

      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadNotificationCount(typeof data?.unreadCount === "number" ? data.unreadCount : 0);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Unable to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  // Fetch Invitations
  async function loadInvitations(orgId: string) {
    try {
      setInvitationsLoading(true);
      setInvitationsError(null);
      const res = await fetch(`/api/organizations/${orgId}/invitations`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to load invitations.");

      setInvitations(Array.isArray(data?.invitations) ? data.invitations : []);
    } catch (error) {
      setInvitationsError(error instanceof Error ? error.message : "Unable to load invitations.");
      setInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadOrganizations();
      loadNotifications();
    });
  }, []);

  useEffect(() => {
    if (selectedOrganizationId) {
      queueMicrotask(() => {
        loadProjects(selectedOrganizationId);
        if (canManageInvitations) {
          loadInvitations(selectedOrganizationId);
        }
      });
    } else {
      setProjects([]);
      setInvitations([]);
    }
  }, [selectedOrganizationId, canManageInvitations]);

  // Handle Create Project
  async function handleCreateProject(formData: {
    title: string;
    description: string;
    genre: string;
    budget: number;
    targetAudience: string;
  }) {
    if (!selectedOrganizationId) return;
    try {
      setCreatingProject(true);
      setCreateProjectError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, organizationId: selectedOrganizationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create project.");

      setProjects((prev) => [data.project, ...prev]);
      setCreateProjectOpen(false);
    } catch (err) {
      setCreateProjectError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setCreatingProject(false);
    }
  }

  function handleWorkspaceSwitch(orgId: string) {
    setSelectedOrganizationId(orgId);
    try {
      window.localStorage.setItem(SELECTED_WORKSPACE_KEY, orgId);
    } catch {}
    setWorkspaceMenuOpen(false);
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (workspaceName.trim().length < 2) return;
    try {
      setCreatingWorkspace(true);
      setCreateWorkspaceError(null);
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName, description: workspaceDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to create workspace.");

      setOrganizations((curr) => [...curr, data.organization]);
      setSelectedOrganizationId(data.organization.id);
      setCreateWorkspaceOpen(false);
      setWorkspaceName("");
      setWorkspaceDescription("");
    } catch (err) {
      setCreateWorkspaceError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setCreatingWorkspace(false);
    }
  }

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrganization) return;
    try {
      setSendingInvite(true);
      setInviteError(null);
      const res = await fetch(`/api/organizations/${selectedOrganization.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to send invitation.");

      setInviteSuccess("Invitation sent.");
      await loadInvitations(selectedOrganization.id);
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteEmail("");
        setInviteSuccess(null);
      }, 800);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleResendInvitation(invitationId: string) {
    if (!selectedOrganization) return;
    try {
      setResendingInvitationId(invitationId);
      await fetch(`/api/invitations/${invitationId}/resend`, { method: "POST" });
      await loadInvitations(selectedOrganization.id);
    } finally {
      setResendingInvitationId(null);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    if (!selectedOrganization) return;
    try {
      setCancellingInvitationId(invitationId);
      await fetch(`/api/organizations/${selectedOrganization.id}/invitations/${invitationId}`, {
        method: "DELETE",
      });
      await loadInvitations(selectedOrganization.id);
    } finally {
      setCancellingInvitationId(null);
    }
  }

  async function markNotificationAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((curr) => curr.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadNotificationCount((c) => Math.max(0, c - 1));
  }

  async function handleAcceptNotification(notification: Notification) {
    setNotificationActionId(notification.id);
    await fetch(`/api/notifications/${notification.id}/accept`, { method: "POST" });
    setNotificationActionId(null);
    await loadOrganizations();
    await loadNotifications();
  }

  async function handleDeclineNotification(notification: Notification) {
    setNotificationActionId(notification.id);
    await fetch(`/api/notifications/${notification.id}/decline`, { method: "POST" });
    setNotificationActionId(null);
    await loadNotifications();
  }

  return {
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
    resendingInvitationId,
    cancellingInvitationId,
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
    handleCreateProject,
    handleSendInvitation,
    handleResendInvitation,
    handleCancelInvitation,
    markNotificationAsRead,
    handleAcceptNotification,
    handleDeclineNotification,
    loadNotifications,
    loadInvitations,
    loadProjects,
    loadOrganizations,
  };
}