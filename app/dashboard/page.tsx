"use client";


import {Activity, Bell, Bot, Check, ChevronDown, FolderKanban, LayoutDashboard, Mail, Menu, Plus, Search, Send, Settings, Sparkles, Users, X, } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "member";
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "cancelled"
    | "expired";
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
  invitedBy?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface Notification {
  id: string;
  recipientId: string;
  organizationId: string;
  actorId: string | null;
  invitationId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionStatus:
    | "pending"
    | "accepted"
    | "declined"
    | null;
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

  const [_notificationsOpen, _setNotificationsOpen] = useState(false);


  const [_notificationRef] = useState<HTMLDivElement | null>(null);
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
   * INVITATION STATE
   * -------------------------------------------------------
   */

  const [invitations, setInvitations] = useState<
    Invitation[]
  >([]);

  const [invitationsLoading, setInvitationsLoading] =
    useState(false);

  const [invitationsError, setInvitationsError] =
    useState<string | null>(null);

  const [inviteModalOpen, setInviteModalOpen] =
    useState(false);

  const [inviteEmail, setInviteEmail] =
    useState("");

  const [inviteRole, setInviteRole] =
    useState<"admin" | "member">("member");

  const [sendingInvite, setSendingInvite] =
    useState(false);

  const [inviteError, setInviteError] =
    useState<string | null>(null);

  const [inviteSuccess, setInviteSuccess] =
    useState<string | null>(null);

  const [resendingInvitationId, setResendingInvitationId] =
    useState<string | null>(null);

  const [cancellingInvitationId, setCancellingInvitationId] =
    useState<string | null>(null);

  /*
   * -------------------------------------------------------
   * NOTIFICATION STATE
   * -------------------------------------------------------
   */

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  const [notificationsError, setNotificationsError] =
    useState<string | null>(null);

  const [notificationPanelOpen, setNotificationPanelOpen] =
    useState(false);

  const [notificationActionId, setNotificationActionId] =
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
   * ADMIN PERMISSION
   * -------------------------------------------------------
   */

  const canManageInvitations =
    selectedOrganization?.role === "owner" ||
    selectedOrganization?.role === "admin";

  /*
   * -------------------------------------------------------
   * LOAD USER WORKSPACES
   * -------------------------------------------------------
   */

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

      const loadedOrganizations =
        Array.isArray(data.organizations)
          ? data.organizations
          : [];

      setOrganizations(loadedOrganizations);

      let savedWorkspaceId: string | null = null;

      try {
        savedWorkspaceId =
          window.localStorage.getItem(
            SELECTED_WORKSPACE_KEY
          );
      } catch {
        // Ignore localStorage failures.
      }

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
          // Ignore localStorage failures.
        }
      } else {
        setSelectedOrganizationId(null);
      }
    } catch (error) {
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
      setOrganizationsLoading(false);
    }
  }

  useEffect(() => {
  queueMicrotask(() => {
    loadOrganizations();
  });
}, []);

  /*
   * -------------------------------------------------------
   * LOAD NOTIFICATIONS
   * -------------------------------------------------------
   */

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);

      const response = await fetch(
        "/api/notifications",
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
            "Unable to load notifications."
        );
      }

      setNotifications(
        Array.isArray(data?.notifications)
          ? data.notifications
          : []
      );

      setUnreadNotificationCount(
        typeof data?.unreadCount === "number"
          ? data.unreadCount
          : 0
      );
    } catch (error) {
      console.error(
        "Load notifications error:",
        error
      );

      setNotificationsError(
        error instanceof Error
          ? error.message
          : "Unable to load notifications."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  /*
   * -------------------------------------------------------
   * LOAD NOTIFICATIONS ON PAGE LOAD
   * -------------------------------------------------------
   */

  useEffect(() => {
  queueMicrotask(() => {
    loadNotifications();
  });
}, []);

  /*
   * -------------------------------------------------------
   * MARK NOTIFICATION AS READ
   * -------------------------------------------------------
   */

  async function markNotificationAsRead(
    notificationId: string
  ) {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );

      setUnreadNotificationCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  }

  /*
   * -------------------------------------------------------
   * OPEN NOTIFICATION PANEL
   * -------------------------------------------------------
   */

  async function handleNotificationPanelToggle() {
    const willOpen = !notificationPanelOpen;

    setNotificationPanelOpen(willOpen);

    if (willOpen) {
      await loadNotifications();
    }
  }

  /*
   * -------------------------------------------------------
   * ACCEPT NOTIFICATION
   * -------------------------------------------------------
   */

  async function handleAcceptNotification(
    notification: Notification
  ) {
    if (
      notification.actionStatus !== "pending" ||
      !notification.invitationId
    ) {
      return;
    }

    try {
      setNotificationActionId(
        notification.id
      );
      setNotificationsError(null);

      const response = await fetch(
        `/api/notifications/${notification.id}/accept`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to accept invitation."
        );
      }

      /*
       * Update the notification immediately
       * so the UI feels responsive.
       */
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
                actionStatus: "accepted",
              }
            : item
        )
      );

      setUnreadNotificationCount((current) =>
        notification.read
          ? current
          : Math.max(0, current - 1)
      );

      /*
       * Reload workspaces because the accepted
       * invitation should now create an active
       * membership for the user.
       */
      await loadOrganizations();

      /*
       * Refresh notifications from the server
       * to ensure the client matches the database.
       */
      await loadNotifications();
    } catch (error) {
      console.error(
        "Accept notification error:",
        error
      );

      setNotificationsError(
        error instanceof Error
          ? error.message
          : "Unable to accept invitation."
      );
    } finally {
      setNotificationActionId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * DECLINE NOTIFICATION
   * -------------------------------------------------------
   */

  async function handleDeclineNotification(
    notification: Notification
  ) {
    if (
      notification.actionStatus !== "pending" ||
      !notification.invitationId
    ) {
      return;
    }

    try {
      setNotificationActionId(
        notification.id
      );
      setNotificationsError(null);

      const response = await fetch(
        `/api/notifications/${notification.id}/decline`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to decline invitation."
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
                actionStatus: "declined",
              }
            : item
        )
      );

      setUnreadNotificationCount((current) =>
        notification.read
          ? current
          : Math.max(0, current - 1)
      );

      await loadNotifications();
    } catch (error) {
      console.error(
        "Decline notification error:",
        error
      );

      setNotificationsError(
        error instanceof Error
          ? error.message
          : "Unable to decline invitation."
      );
    } finally {
      setNotificationActionId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * NOTIFICATION DATE
   * -------------------------------------------------------
   */

  function formatNotificationDate(
    date: string
  ) {
    try {
      const notificationDate =
        new Date(date);

      const now = new Date();

      const difference =
        now.getTime() -
        notificationDate.getTime();

      const minutes = Math.floor(
        difference / 60000
      );

      if (minutes < 1) {
        return "Just now";
      }

      if (minutes < 60) {
        return `${minutes}m ago`;
      }

      const hours = Math.floor(
        minutes / 60
      );

      if (hours < 24) {
        return `${hours}h ago`;
      }

      const days = Math.floor(
        hours / 24
      );

      if (days < 7) {
        return `${days}d ago`;
      }

      return new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      ).format(notificationDate);
    } catch {
      return date;
    }
  }

  /*
   * -------------------------------------------------------
   * LOAD INVITATIONS
   * -------------------------------------------------------
   */

  async function loadInvitations(
    organizationId: string
  ) {
    try {
      setInvitationsLoading(true);
      setInvitationsError(null);

      const response = await fetch(
        `/api/organizations/${organizationId}/invitations`,
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
            "Unable to load workspace invitations."
        );
      }

      const loadedInvitations = Array.isArray(
        data?.invitations
      )
        ? data.invitations
        : [];

      setInvitations(loadedInvitations);
    } catch (error) {
      console.error(
        "Load invitations error:",
        error
      );

      setInvitationsError(
        error instanceof Error
          ? error.message
          : "Unable to load workspace invitations."
      );

      setInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }

  /*
   * -------------------------------------------------------
   * LOAD INVITATIONS WHEN WORKSPACE CHANGES
   * -------------------------------------------------------
   */

useEffect(() => {
  if (!selectedOrganizationId || !canManageInvitations) {
    queueMicrotask(() => {
      setInvitations([]);
      setInvitationsError(null);
    });
    return;
  }

  queueMicrotask(() => {
    loadInvitations(selectedOrganizationId);
  });
}, [selectedOrganizationId, canManageInvitations]);
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
      // Ignore localStorage failures.
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

      const newOrganization: Organization = {
        id: createdOrganization.id,
        name: createdOrganization.name,
        slug: createdOrganization.slug,
        description:
          createdOrganization.description ??
          null,
        ownerId:
          createdOrganization.ownerId,
        status:
          createdOrganization.status,
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

      setSelectedOrganizationId(
        newOrganization.id
      );

      try {
        window.localStorage.setItem(
          SELECTED_WORKSPACE_KEY,
          newOrganization.id
        );
      } catch {
        // Ignore localStorage failures.
      }

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
   * CLOSE CREATE WORKSPACE
   * -------------------------------------------------------
   */

  function closeCreateWorkspace() {
    if (creatingWorkspace) {
      return;
    }

    setCreateWorkspaceOpen(false);
    setCreateWorkspaceError(null);
  }

  /*
   * -------------------------------------------------------
   * OPEN INVITE MODAL
   * -------------------------------------------------------
   */

  function openInviteModal() {
    if (!selectedOrganization) {
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setInviteError(null);
    setInviteSuccess(null);
    setInviteModalOpen(true);
  }

  /*
   * -------------------------------------------------------
   * CLOSE INVITE MODAL
   * -------------------------------------------------------
   */

  function closeInviteModal() {
    if (sendingInvite) {
      return;
    }

    setInviteModalOpen(false);
    setInviteEmail("");
    setInviteRole("member");
    setInviteError(null);
    setInviteSuccess(null);
  }

  /*
   * -------------------------------------------------------
   * SEND INVITATION
   * -------------------------------------------------------
   */

  async function handleSendInvitation(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedOrganization) {
      setInviteError(
        "Please select a workspace first."
      );

      return;
    }

    if (!canManageInvitations) {
      setInviteError(
        "You do not have permission to invite members to this workspace."
      );

      return;
    }

    const trimmedEmail =
      inviteEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      setInviteError(
        "Please enter an email address."
      );

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      setInviteError(
        "Please enter a valid email address."
      );

      return;
    }

    try {
      setSendingInvite(true);
      setInviteError(null);
      setInviteSuccess(null);

      const response = await fetch(
        `/api/organizations/${selectedOrganization.id}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
            role: inviteRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to send invitation."
        );
      }

      setInviteSuccess(
        "Invitation sent successfully."
      );

      await loadInvitations(
        selectedOrganization.id
      );

      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteEmail("");
        setInviteRole("member");
        setInviteSuccess(null);
      }, 800);
    } catch (error) {
      console.error(
        "Send invitation error:",
        error
      );

      setInviteError(
        error instanceof Error
          ? error.message
          : "Unable to send invitation."
      );
    } finally {
      setSendingInvite(false);
    }
  }

  /*
   * -------------------------------------------------------
   * RESEND INVITATION
   * -------------------------------------------------------
   */

  async function handleResendInvitation(
    invitationId: string
  ) {
    if (!selectedOrganization) {
      return;
    }

    try {
      setResendingInvitationId(
        invitationId
      );
      setInvitationsError(null);

      const response = await fetch(
        `/api/invitations/${invitationId}/resend`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to resend invitation."
        );
      }

      await loadInvitations(
        selectedOrganization.id
      );
    } catch (error) {
      console.error(
        "Resend invitation error:",
        error
      );

      setInvitationsError(
        error instanceof Error
          ? error.message
          : "Unable to resend invitation."
      );
    } finally {
      setResendingInvitationId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * CANCEL INVITATION
   * -------------------------------------------------------
   */

  async function handleCancelInvitation(
    invitationId: string
  ) {
    if (!selectedOrganization) {
      return;
    }

    try {
      setCancellingInvitationId(
        invitationId
      );
      setInvitationsError(null);

      const response = await fetch(
        `/api/organizations/${selectedOrganization.id}/invitations/${invitationId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to cancel invitation."
        );
      }

      await loadInvitations(
        selectedOrganization.id
      );
    } catch (error) {
      console.error(
        "Cancel invitation error:",
        error
      );

      setInvitationsError(
        error instanceof Error
          ? error.message
          : "Unable to cancel invitation."
      );
    } finally {
      setCancellingInvitationId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * FORMAT INVITATION DATE
   * -------------------------------------------------------
   */

  function formatInvitationDate(
    date: string
  ) {
    try {
      return new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      ).format(new Date(date));
    } catch {
      return date;
    }
  }

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ---------------------------------------------------
          MOBILE OVERLAY
      --------------------------------------------------- */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setSidebarOpen(false)
          }
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

        {/* Workspace Switcher */}

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

          {/* -------------------------------------------------
              HEADER ACTIONS
          ------------------------------------------------- */}

          <div className="flex items-center gap-2">
  <div className="relative">
    <button
      type="button"
      onClick={handleNotificationPanelToggle}
      className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      aria-label="Notifications"
      aria-expanded={notificationPanelOpen}
    >
      <Bell className="h-5 w-5" />

      {unreadNotificationCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
          {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
        </span>
      )}
    </button>

    {/* -------------------------------------------------
        NOTIFICATION DROPDOWN
    ------------------------------------------------- */}

    {notificationPanelOpen && (
      <>
        {/* Transparent backdrop to click outside and close */}
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNotificationPanelOpen(false)}
        />

        <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Stay up to date with your workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadNotificationCount > 0 && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                  {unreadNotificationCount} unread
                </span>
              )}

              {/* Close (X) button inside the header */}
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setNotificationPanelOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Error */}
          {notificationsError && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              {notificationsError}
            </div>
          )}

          {/* Loading */}
          {notificationsLoading ? (
            <div className="flex items-center justify-center px-5 py-12">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                Loading notifications...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Bell className="h-5 w-5" />
              </div>

              <h3 className="mt-3 text-sm font-semibold text-slate-800">
                You &apos;re all caught up
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                You don&apos;t have any notifications right now.
              </p>
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto">
              {notifications.map((notification) => {
                const isInvitation =
                  notification.type === "organization_invitation" ||
                  notification.type === "invitation";

                const isPending = notification.actionStatus === "pending";
                const isActing = notificationActionId === notification.id;

                return (
                  <div
                    key={notification.id}
                    className={`border-b border-slate-100 px-5 py-4 transition last:border-b-0 ${
                      !notification.read ? "bg-indigo-50/40" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Notification icon */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isInvitation
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isInvitation ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold ${
                                notification.read
                                  ? "text-slate-700"
                                  : "text-slate-900"
                              }`}
                            >
                              {notification.title}
                            </p>

                            {!notification.read && (
                              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600" />
                            )}
                          </div>

                          <span className="shrink-0 text-[10px] text-slate-400">
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>

                        {/* Invitation actions */}
                        {isInvitation &&
                          isPending &&
                          notification.invitationId && (
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAcceptNotification(notification)
                                }
                                disabled={isActing}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActing ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                {isActing ? "Processing..." : "Accept"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeclineNotification(notification)
                                }
                                disabled={isActing}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                                Decline
                              </button>
                            </div>
                          )}

                        {/* Accepted state */}
                        {isInvitation &&
                          notification.actionStatus === "accepted" && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
                              <Check className="h-3 w-3" />
                              Invitation accepted
                            </div>
                          )}

                        {/* Declined state */}
                        {isInvitation &&
                          notification.actionStatus === "declined" && (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                              <X className="h-3 w-3" />
                              Invitation declined
                            </div>
                          )}

                        {/* Mark as read */}
                        {!notification.read &&
                          !(isInvitation && isPending) && (
                            <button
                              type="button"
                              onClick={() =>
                                markNotificationAsRead(notification.id)
                              }
                              className="mt-2 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              Mark as read
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button
              type="button"
              onClick={() => loadNotifications()}
              className="w-full rounded-lg py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              Refresh notifications
            </button>
          </div>
        </div>
      </>
    )}
  </div>

  <div className="ml-1 hidden h-6 w-px bg-slate-200 sm:block" />

  <UserProfileMenu variant="navbar" />
</div>
        </header>

        {/* -------------------------------------------------
            CONTENT
        ------------------------------------------------- */}

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
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

              {canManageInvitations && (
                <button
                  type="button"
                  onClick={openInviteModal}
                  disabled={
                    !selectedOrganization
                  }
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  Invite Member
                </button>
              )}

              <button
                type="button"
                disabled={
                  !selectedOrganization
                }
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            </div>
          </section>

          {/* Empty workspace */}

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

          {/* -------------------------------------------------
              PENDING INVITATIONS
          ------------------------------------------------- */}

          {canManageInvitations &&
            selectedOrganization && (
              <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Mail className="h-4 w-4" />
                      </div>

                      <h2 className="text-base font-semibold text-slate-900">
                        Pending Invitations
                      </h2>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Manage invitations sent to people
                      you want to add to this workspace.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      openInviteModal
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                    Send Invite
                  </button>
                </div>

                {invitationsError && (
                  <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {invitationsError}
                  </div>
                )}

                {invitationsLoading ? (
                  <div className="flex items-center justify-center px-5 py-10">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                      Loading invitations...
                    </div>
                  </div>
                ) : invitations.filter(
                    (invitation) =>
                      invitation.status ===
                      "pending"
                  ).length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Mail className="h-5 w-5" />
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-slate-800">
                      No pending invitations
                    </h3>

                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                      Send an invitation to add another
                      person to this workspace.
                    </p>

                    <button
                      type="button"
                      onClick={
                        openInviteModal
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      <Send className="h-4 w-4" />
                      Send Invite
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invitations
                      .filter(
                        (invitation) =>
                          invitation.status ===
                          "pending"
                      )
                      .map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                              <Mail className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {invitation.email}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-indigo-700">
                                  {invitation.role}
                                </span>

                                <span className="text-[11px] text-slate-400">
                                  Sent{" "}
                                  {formatInvitationDate(
                                    invitation.createdAt
                                  )}
                                </span>

                                <span className="text-[11px] text-slate-400">
                                  Expires{" "}
                                  {formatInvitationDate(
                                    invitation.expiresAt
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleResendInvitation(
                                  invitation.id
                                )
                              }
                              disabled={
                                resendingInvitationId ===
                                  invitation.id ||
                                cancellingInvitationId ===
                                  invitation.id
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {resendingInvitationId ===
                              invitation.id ? (
                                <>
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
                                  Resending...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5" />
                                  Resend
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleCancelInvitation(
                                  invitation.id
                                )
                              }
                              disabled={
                                resendingInvitationId ===
                                  invitation.id ||
                                cancellingInvitationId ===
                                  invitation.id
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {cancellingInvitationId ===
                              invitation.id ? (
                                <>
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <X className="h-3.5 w-3.5" />
                                  Cancel
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            )}

          {/* -------------------------------------------------
              MAIN GRID
          ------------------------------------------------- */}

          <section className="mt-8 grid gap-6 xl:grid-cols-3">
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
                disabled={
                  !selectedOrganization
                }
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

            <form
              onSubmit={
                handleCreateWorkspace
              }
            >
              <div className="space-y-5 px-6 py-6">
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

                {createWorkspaceError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {createWorkspaceError}
                  </div>
                )}
              </div>

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

      {/* ---------------------------------------------------
          INVITE MEMBER MODAL
      --------------------------------------------------- */}

      {inviteModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-member-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Mail className="h-5 w-5" />
                  </div>

                  <h2
                    id="invite-member-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Invite to workspace
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Invite someone to join{" "}
                  <span className="font-medium text-slate-700">
                    {selectedOrganization?.name}
                  </span>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={closeInviteModal}
                disabled={sendingInvite}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close invite dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                handleSendInvitation
              }
            >
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label
                    htmlFor="invite-email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) =>
                      setInviteEmail(
                        event.target.value
                      )
                    }
                    placeholder="person@example.com"
                    disabled={sendingInvite}
                    autoFocus
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    The invitation will be sent to this
                    email address.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="invite-role"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Workspace role
                  </label>

                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(
                        event.target.value as
                          | "admin"
                          | "member"
                      )
                    }
                    disabled={sendingInvite}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
                  >
                    <option value="member">
                      Member
                    </option>

                    <option value="admin">
                      Admin
                    </option>
                  </select>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Admins can manage workspace members
                    and invitations.
                  </p>
                </div>

                {inviteError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {inviteError}
                  </div>
                )}

                {inviteSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                    <Check className="h-4 w-4 shrink-0" />
                    {inviteSuccess}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={sendingInvite}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    sendingInvite ||
                    !inviteEmail.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingInvite ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Invite
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