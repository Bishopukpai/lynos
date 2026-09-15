"use client";

import {
  RefreshCw,
  Trash2,
  Mail,
  AlertCircle,
} from "lucide-react";

import type { Invitation } from "@/types/dashboard";

interface Props {
  organizationId: string;
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  resendingInvitationId: string | null;
  cancellingInvitationId: string | null;
  onResend: (invitationId: string) => Promise<void>;
  onCancel: (invitationId: string) => Promise<void>;
}

export default function PendingInvitationsManager({
  organizationId,
  invitations,
  loading,
  error,
  resendingInvitationId,
  cancellingInvitationId,
  onResend,
  onCancel,
}: Props) {
  const pendingInvitations = invitations.filter(
    (invitation) =>
      invitation.status === "pending" ||
      invitation.status === "expired"
  );

  const handleResend = async (
    invitationId: string
  ) => {
    try {
      await onResend(invitationId);
    } catch {
      // The parent hook owns and exposes the error state.
    }
  };

  const handleCancel = async (
    invitationId: string
  ) => {
    try {
      await onCancel(invitationId);
    } catch {
      // The parent hook owns and exposes the error state.
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Pending Workspace Invitations
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            Manage outgoing workspace invites. Resend or revoke active links.
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            Workspace: {organizationId}
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {pendingInvitations.length} Pending
        </span>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />

          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading invitations...
        </div>
      ) : pendingInvitations.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No pending or expired invitations.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {pendingInvitations.map((invitation) => {
            const isResending =
              resendingInvitationId === invitation.id;

            const isCancelling =
              cancellingInvitationId === invitation.id;

            const isLoading =
              isResending || isCancelling;

            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Mail className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {invitation.email}
                      </p>

                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                        {invitation.role}
                      </span>

                      {invitation.status ===
                        "expired" && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Expired
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Sent{" "}
                      {new Date(
                        invitation.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleResend(
                        invitation.id
                      )
                    }
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${
                        isResending
                          ? "animate-spin"
                          : ""
                      }`}
                    />

                    {isResending
                      ? "Resending..."
                      : "Resend"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCancel(
                        invitation.id
                      )
                    }
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2
                      className={`h-3 w-3 ${
                        isCancelling
                          ? "animate-spin"
                          : ""
                      }`}
                    />

                    {isCancelling
                      ? "Cancelling..."
                      : "Cancel"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}