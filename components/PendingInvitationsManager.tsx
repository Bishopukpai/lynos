"use client";

import { useState } from "react";
import { RefreshCw, Trash2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export interface OutgoingInvitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "expired" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  expiresAt: string;
}

interface Props {
  organizationId: string;
  invitations: OutgoingInvitation[];
  onRefresh: () => void;
}

export default function PendingInvitationsManager({
  organizationId,
  invitations,
  onRefresh,
}: Props) {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"resend" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter only manageable invitations (pending or expired)
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending" || inv.status === "expired"
  );

  const handleResend = async (invitationId: string) => {
    setActiveActionId(invitationId);
    setActionType("resend");
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/invitations/${invitationId}/resend`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend invitation.");
      }

      setSuccess(`Invitation resent to ${data.invitation.email}`);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setActiveActionId(null);
      setActionType(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    setActiveActionId(invitationId);
    setActionType("cancel");
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `/api/organizations/${organizationId}/invitations/${invitationId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel invitation.");
      }

      setSuccess("Invitation cancelled successfully.");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setActiveActionId(null);
      setActionType(null);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Pending Workspace Invitations</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage outgoing workspace invites. Resend or revoke active links.
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

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {pendingInvitations.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No pending or expired invitations.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {pendingInvitations.map((inv) => {
            const isLoading = activeActionId === inv.id;
            const isResending = isLoading && actionType === "resend";
            const isCancelling = isLoading && actionType === "cancel";

            return (
              <div
                key={inv.id}
                className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-800">{inv.email}</p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-600 font-medium">
                        {inv.role}
                      </span>
                      {inv.status === "expired" && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 font-medium">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Sent {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResend(inv.id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
                    {isResending ? "Resending..." : "Resend"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCancel(inv.id)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className={`h-3 w-3 ${isCancelling ? "animate-spin" : ""}`} />
                    {isCancelling ? "Cancelling..." : "Cancel"}
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