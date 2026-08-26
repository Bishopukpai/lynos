"use client";

import { Check, Mail, Send, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  workspaceName?: string;
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteRole: "admin" | "member";
  setInviteRole: (val: "admin" | "member") => void;
  sendingInvite: boolean;
  inviteError: string | null;
  inviteSuccess: string | null;
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  onSubmit,
  workspaceName,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  sendingInvite,
  inviteError,
  inviteSuccess,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Invite to workspace</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Invite someone to join <span className="font-medium text-slate-700">{workspaceName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sendingInvite}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-5 px-6 py-6">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="person@example.com"
                disabled={sendingInvite}
                autoFocus
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700">
                Workspace role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                disabled={sendingInvite}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
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
              onClick={onClose}
              disabled={sendingInvite}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingInvite || !inviteEmail.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
  );
}