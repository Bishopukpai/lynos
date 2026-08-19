"use client";

import {
  Check,
  ChevronDown,
  Clock,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  status: "active" | "archived";
  role: "owner" | "admin" | "member" | null;
  membershipStatus:
    | "active"
    | "suspended"
    | null;
  createdAt: string;
  updatedAt: string;
}

type MemberRole =
  | "owner"
  | "admin"
  | "member";

type InvitationRole =
  | "admin"
  | "member";

type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  status:
    | "active"
    | "suspended"
    | "removed";
  name?: string | null;
  email?: string | null;
  image?: string | null;
  joinedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InvitationsResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  invitations: Invitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface OrganizationMembersPanelProps {
  organization: Organization | null;
}

const INVITATIONS_PAGE_SIZE = 10;

/*
 * ---------------------------------------------------------
 * DATE HELPERS
 * ---------------------------------------------------------
 */

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isInvitationExpired(
  invitation: Invitation
): boolean {
  if (invitation.status !== "pending") {
    return invitation.status === "expired";
  }

  return (
    new Date(invitation.expiresAt).getTime() <=
    Date.now()
  );
}

function getInitials(
  name?: string | null,
  email?: string | null
): string {
  const value =
    name?.trim() ||
    email?.trim() ||
    "U";

  const parts = value.split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

/*
 * ---------------------------------------------------------
 * MAIN COMPONENT
 * ---------------------------------------------------------
 */

export default function OrganizationMembersPanel({
  organization,
}: OrganizationMembersPanelProps) {
  /*
   * -------------------------------------------------------
   * MEMBERS STATE
   * -------------------------------------------------------
   */

  const [members, setMembers] = useState<
    OrganizationMember[]
  >([]);

  const [membersLoading, setMembersLoading] =
    useState(false);

  const [membersError, setMembersError] =
    useState<string | null>(null);

  /*
   * -------------------------------------------------------
   * INVITATION STATE
   * -------------------------------------------------------
   */

  const [invitations, setInvitations] =
    useState<Invitation[]>([]);

  const [invitationsLoading, setInvitationsLoading] =
    useState(false);

  const [invitationsError, setInvitationsError] =
    useState<string | null>(null);

  const [invitationStatusFilter, setInvitationStatusFilter] =
    useState<InvitationStatus | "all">("pending");

  const [invitationPage, setInvitationPage] =
    useState(1);

  const [invitationTotal, setInvitationTotal] =
    useState(0);

  const [invitationTotalPages, setInvitationTotalPages] =
    useState(1);

  /*
   * -------------------------------------------------------
   * INVITE MODAL STATE
   * -------------------------------------------------------
   */

  const [inviteModalOpen, setInviteModalOpen] =
    useState(false);

  const [inviteEmail, setInviteEmail] =
    useState("");

  const [inviteRole, setInviteRole] =
    useState<InvitationRole>("member");

  const [inviting, setInviting] =
    useState(false);

  const [inviteError, setInviteError] =
    useState<string | null>(null);

  /*
   * -------------------------------------------------------
   * ACTION STATE
   * -------------------------------------------------------
   */

  const [actionInvitationId, setActionInvitationId] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  /*
   * -------------------------------------------------------
   * PERMISSIONS
   * -------------------------------------------------------
   *
   * Only workspace owners and admins can:
   *
   * - Send invitations
   * - Resend invitations
   * - Cancel invitations
   *
   * Invited members will:
   *
   * - Receive an in-app notification
   * - Accept invitations
   * - Decline invitations
   *
   */

  const canManageInvitations =
    organization?.role === "owner" ||
    organization?.role === "admin";

  /*
   * -------------------------------------------------------
   * LOAD MEMBERS
   * -------------------------------------------------------
   */

  const loadMembers = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    try {
      setMembersLoading(true);
      setMembersError(null);

      const response = await fetch(
        `/api/organizations/${organization.id}/members`,
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
            "Unable to load workspace members."
        );
      }

      const loadedMembers =
        Array.isArray(data?.members)
          ? data.members
          : [];

      setMembers(loadedMembers);
    } catch (error) {
      console.error(
        "Load organization members error:",
        error
      );

      setMembersError(
        error instanceof Error
          ? error.message
          : "Unable to load workspace members."
      );
    } finally {
      setMembersLoading(false);
    }
  }, [organization?.id]);

  /*
   * -------------------------------------------------------
   * LOAD INVITATIONS
   * -------------------------------------------------------
   */

  const loadInvitations = useCallback(
    async (
      requestedPage = invitationPage,
      requestedStatus = invitationStatusFilter
    ) => {
      if (!organization?.id) {
        return;
      }

      try {
        setInvitationsLoading(true);
        setInvitationsError(null);

        const params = new URLSearchParams();

        params.set(
          "page",
          String(requestedPage)
        );

        params.set(
          "limit",
          String(INVITATIONS_PAGE_SIZE)
        );

        if (requestedStatus !== "all") {
          params.set(
            "status",
            requestedStatus
          );
        }

        const response = await fetch(
          `/api/organizations/${organization.id}/invitations?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as Partial<InvitationsResponse> & {
            error?: string;
          };

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unable to load invitations."
          );
        }

        setInvitations(
          Array.isArray(data.invitations)
            ? data.invitations
            : []
        );

        setInvitationTotal(
          data.pagination?.total ?? 0
        );

        setInvitationTotalPages(
          Math.max(
            1,
            data.pagination?.totalPages ?? 1
          )
        );
      } catch (error) {
        console.error(
          "Load organization invitations error:",
          error
        );

        setInvitationsError(
          error instanceof Error
            ? error.message
            : "Unable to load invitations."
        );
      } finally {
        setInvitationsLoading(false);
      }
    },
    [
      organization?.id,
      invitationPage,
      invitationStatusFilter,
    ]
  );

  /*
   * -------------------------------------------------------
   * INITIAL DATA LOAD
   * -------------------------------------------------------
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!organization?.id) {
        return;
      }

      void loadMembers();
    }, 0);

    return () => clearTimeout(timer);
  }, [organization?.id, loadMembers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!organization?.id) {
        return;
      }

      setInvitationPage(1);
    }, 0);

    return () => clearTimeout(timer);
  }, [organization?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!organization?.id) {
        return;
      }

      void loadInvitations(
        invitationPage,
        invitationStatusFilter
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [
    organization?.id,
    invitationPage,
    invitationStatusFilter,
    loadInvitations,
  ]);

  /*
   * -------------------------------------------------------
   * OPEN INVITE MODAL
   * -------------------------------------------------------
   */

  function openInviteModal() {
    if (!canManageInvitations) {
      return;
    }

    setInviteEmail("");
    setInviteRole("member");
    setInviteError(null);
    setInviteModalOpen(true);
  }

  /*
   * -------------------------------------------------------
   * CLOSE INVITE MODAL
   * -------------------------------------------------------
   */

  function closeInviteModal() {
    if (inviting) {
      return;
    }

    setInviteModalOpen(false);
    setInviteError(null);
  }

  /*
   * -------------------------------------------------------
   * CREATE INVITATION
   * -------------------------------------------------------
   */

  async function handleInviteMember(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canManageInvitations) {
      return;
    }

    const email = inviteEmail
      .trim()
      .toLowerCase();

    if (!email) {
      setInviteError(
        "Please enter an email address."
      );

      return;
    }

    if (!organization?.id) {
      setInviteError(
        "No workspace is currently selected."
      );

      return;
    }

    try {
      setInviting(true);
      setInviteError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `/api/organizations/${organization.id}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            role: inviteRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to create invitation."
        );
      }

      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");

      setSuccessMessage(
        `Invitation sent to ${email}.`
      );

      setInvitationPage(1);

      await loadInvitations(
        1,
        invitationStatusFilter
      );
    } catch (error) {
      console.error(
        "Create invitation error:",
        error
      );

      setInviteError(
        error instanceof Error
          ? error.message
          : "Unable to create invitation."
      );
    } finally {
      setInviting(false);
    }
  }

  /*
   * -------------------------------------------------------
   * RESEND INVITATION
   * -------------------------------------------------------
   */

  async function handleResendInvitation(
    invitation: Invitation
  ) {
    if (
      !organization?.id ||
      !canManageInvitations
    ) {
      return;
    }

    try {
      setActionInvitationId(
        invitation.id
      );

      setSuccessMessage(null);
      setInvitationsError(null);

      const response = await fetch(
        `/api/organizations/${organization.id}/invitations/${invitation.id}/resend`,
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

      setSuccessMessage(
        `Invitation resent to ${invitation.email}.`
      );

      await loadInvitations(
        invitationPage,
        invitationStatusFilter
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
      setActionInvitationId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * CANCEL INVITATION
   * -------------------------------------------------------
   */

  async function handleCancelInvitation(
    invitation: Invitation
  ) {
    if (
      !organization?.id ||
      !canManageInvitations
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Cancel the invitation sent to ${invitation.email}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionInvitationId(
        invitation.id
      );

      setSuccessMessage(null);
      setInvitationsError(null);

      const response = await fetch(
        `/api/organizations/${organization.id}/invitations/${invitation.id}`,
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

      setSuccessMessage(
        `Invitation to ${invitation.email} was cancelled.`
      );

      await loadInvitations(
        invitationPage,
        invitationStatusFilter
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
      setActionInvitationId(null);
    }
  }

  /*
   * -------------------------------------------------------
   * FILTER
   * -------------------------------------------------------
   */

  function handleInvitationStatusChange(
    status: InvitationStatus | "all"
  ) {
    setInvitationStatusFilter(status);
    setInvitationPage(1);
  }

  /*
   * -------------------------------------------------------
   * REFRESH EVERYTHING
   * -------------------------------------------------------
   */

  async function handleRefresh() {
    await Promise.all([
      loadMembers(),
      loadInvitations(
        invitationPage,
        invitationStatusFilter
      ),
    ]);
  }

  /*
   * -------------------------------------------------------
   * MEMBER COUNTS
   * -------------------------------------------------------
   */

  const activeMemberCount = useMemo(
    () =>
      members.filter(
        (member) =>
          member.status === "active"
      ).length,
    [members]
  );

  const pendingInvitationCount =
    invitationStatusFilter === "pending"
      ? invitationTotal
      : 0;

  /*
   * -------------------------------------------------------
   * NO WORKSPACE
   * -------------------------------------------------------
   */

  if (!organization) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Users className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Select a workspace
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Select a workspace to manage its
          members and invitations.
        </p>
      </section>
    );
  }

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <>
      <section className="mt-8">
        {/* HEADER */}

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Members & Invitations
                </h2>

                <p className="text-sm text-slate-500">
                  Manage who has access to{" "}
                  {organization.name}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                membersLoading ||
                invitationsLoading
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  membersLoading ||
                  invitationsLoading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            {/* SEND INVITATION BUTTON */}

            {canManageInvitations && (
              <button
                type="button"
                onClick={openInviteModal}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4" />

                Send invitation
              </button>
            )}
          </div>
        </div>

        {/* SUCCESS MESSAGE */}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />

            <p>{successMessage}</p>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage(null)
              }
              className="ml-auto rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ERROR */}

        {(membersError ||
          invitationsError) && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {membersError ||
              invitationsError}
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Active
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Workspace members
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {activeMemberCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Pending
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Pending invitations
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {pendingInvitationCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Shield className="h-4 w-4" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Your role
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Workspace access
            </p>

            <p className="mt-1 text-2xl font-bold capitalize text-slate-900">
              {organization.role ??
                "Member"}
            </p>
          </div>
        </div>

        {/* MEMBERS */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Workspace members
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                People who currently have access
                to this workspace.
              </p>
            </div>
          </div>

          {membersLoading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100" />

                    <div className="flex-1">
                      <div className="h-3 w-32 rounded bg-slate-100" />

                      <div className="mt-2 h-2 w-48 rounded bg-slate-100" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : members.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No members found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Workspace members will appear
                here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map(
                (member) => {
                  const displayName =
                    member.name ||
                    member.email ||
                    "Workspace member";

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {member.image ? (
                          <img
                            src={
                              member.image
                            }
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                            {getInitials(
                              member.name,
                              member.email
                            )}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {displayName}
                          </p>

                          {member.email && (
                            <p className="truncate text-xs text-slate-500">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                            member.role ===
                            "owner"
                              ? "bg-indigo-50 text-indigo-700"
                              : member.role ===
                                  "admin"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {member.role}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                            member.status ===
                            "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {member.status}
                        </span>

                        {member.joinedAt && (
                          <span className="hidden text-xs text-slate-400 md:block">
                            Joined{" "}
                            {formatDate(
                              member.joinedAt
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* INVITATIONS */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Invitations
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Send, resend, and cancel
                  workspace invitations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canManageInvitations && (
                  <button
                    type="button"
                    onClick={openInviteModal}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <UserPlus className="h-3.5 w-3.5" />

                    Send invitation
                  </button>
                )}

                <div className="relative">
                  <select
                    value={
                      invitationStatusFilter
                    }
                    onChange={(event) =>
                      handleInvitationStatusChange(
                        event.target
                          .value as
                          | InvitationStatus
                          | "all"
                      )
                    }
                    className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="accepted">
                      Accepted
                    </option>

                    <option value="declined">
                      Declined
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>

                    <option value="expired">
                      Expired
                    </option>

                    <option value="all">
                      All invitations
                    </option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {invitationsLoading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100" />

                    <div className="flex-1">
                      <div className="h-3 w-48 rounded bg-slate-100" />

                      <div className="mt-2 h-2 w-32 rounded bg-slate-100" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : invitations.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Mail className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No invitations
              </p>

              <p className="mt-1 text-xs text-slate-500">
                There are no{" "}
                {invitationStatusFilter ===
                "all"
                  ? ""
                  : invitationStatusFilter}{" "}
                invitations for this workspace.
              </p>

              {canManageInvitations &&
                invitationStatusFilter ===
                  "pending" && (
                  <button
                    type="button"
                    onClick={
                      openInviteModal
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <UserPlus className="h-3.5 w-3.5" />

                    Send invitation
                  </button>
                )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {invitations.map(
                  (invitation) => {
                    const expired =
                      isInvitationExpired(
                        invitation
                      );

                    const isPending =
                      invitation.status ===
                        "pending" &&
                      !expired;

                    const actionLoading =
                      actionInvitationId ===
                      invitation.id;

                    return (
                      <div
                        key={
                          invitation.id
                        }
                        className="px-5 py-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <Mail className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {
                                  invitation.email
                                }
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="capitalize">
                                  {
                                    invitation.role
                                  }
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  Created{" "}
                                  {formatDate(
                                    invitation.createdAt
                                  )}
                                </span>

                                {invitation.status ===
                                  "pending" && (
                                  <>
                                    <span>
                                      •
                                    </span>

                                    <span
                                      className={
                                        expired
                                          ? "font-semibold text-red-600"
                                          : "text-slate-500"
                                      }
                                    >
                                      {expired
                                        ? "Expired"
                                        : `Expires ${formatDate(
                                            invitation.expiresAt
                                          )}`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                                invitation.status ===
                                "pending"
                                  ? expired
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                                  : invitation.status ===
                                      "accepted"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : invitation.status ===
                                        "declined"
                                      ? "bg-slate-100 text-slate-600"
                                      : invitation.status ===
                                          "cancelled"
                                        ? "bg-slate-100 text-slate-500"
                                        : "bg-red-50 text-red-600"
                              }`}
                            >
                              {expired &&
                              invitation.status ===
                                "pending"
                                ? "expired"
                                : invitation.status}
                            </span>

                            {/* ADMIN ACTIONS */}

                            {canManageInvitations &&
                              isPending && (
                                <>
                                  <button
                                    type="button"
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      handleResendInvitation(
                                        invitation
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <RefreshCw
                                      className={`h-3.5 w-3.5 ${
                                        actionLoading
                                          ? "animate-spin"
                                          : ""
                                      }`}
                                    />

                                    Resend
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      handleCancelInvitation(
                                        invitation
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" />

                                    Cancel
                                  </button>
                                </>
                              )}

                            <button
                              type="button"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              aria-label="Invitation options"
                              title={`Created ${formatDateTime(
                                invitation.createdAt
                              )}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* PAGINATION */}

              <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-xs text-slate-500">
                  {invitationTotal ===
                  0
                    ? "No invitations"
                    : `Showing page ${invitationPage} of ${invitationTotalPages}`}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      invitationPage <=
                        1 ||
                      invitationsLoading
                    }
                    onClick={() =>
                      setInvitationPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      invitationPage >=
                        invitationTotalPages ||
                      invitationsLoading
                    }
                    onClick={() =>
                      setInvitationPage(
                        (page) =>
                          Math.min(
                            invitationTotalPages,
                            page + 1
                          )
                      )
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------
          INVITE MEMBER MODAL
      --------------------------------------------------- */}

      {inviteModalOpen &&
        canManageInvitations && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-member-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* HEADER */}

              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2
                    id="invite-member-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Send invitation
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Invite someone to join{" "}
                    {organization.name}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeInviteModal
                  }
                  disabled={inviting}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close invite dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={
                  handleInviteMember
                }
              >
                <div className="space-y-5 px-6 py-6">
                  {/* EMAIL */}

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
                          event.target
                            .value
                        )
                      }
                      placeholder="colleague@example.com"
                      autoComplete="email"
                      disabled={inviting}
                      autoFocus
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      The invitation will
                      appear in the invited
                      user's LYNOS
                      notifications.
                    </p>
                  </div>

                  {/* ROLE */}

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
                          event.target
                            .value as InvitationRole
                        )
                      }
                      disabled={inviting}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
                    >
                      <option value="member">
                        Member — standard workspace
                        access
                      </option>

                      <option value="admin">
                        Admin — manage workspace
                        members
                      </option>
                    </select>
                  </div>

                  {/* SECURITY INFORMATION */}

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                    <div className="flex gap-3">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                      <div>
                        <p className="text-xs font-semibold text-indigo-900">
                          Invitation security
                        </p>

                        <p className="mt-1 text-xs leading-5 text-indigo-700">
                          Invitations expire after
                          seven days. The invited
                          user must accept the
                          invitation while
                          authenticated with the
                          invited email address.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ERROR */}

                  {inviteError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      {inviteError}
                    </div>
                  )}
                </div>

                {/* FOOTER */}

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={
                      closeInviteModal
                    }
                    disabled={inviting}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  {/* ACTUAL SEND INVITATION ACTION */}

                  <button
                    type="submit"
                    disabled={
                      inviting ||
                      inviteEmail.trim()
                        .length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {inviting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />

                        Send invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
}