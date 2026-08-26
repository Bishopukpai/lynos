"use client";

import { Bell, Check, Mail, X } from "lucide-react";
import { Notification } from "../types/dashboard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  actionId: string | null;
  onAccept: (n: Notification) => void;
  onDecline: (n: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onRefresh: () => void;
}

interface NotificationDisplayFields {
  subject?: string;
  content?: string;
  description?: string;
}

function formatDate(date: string) {
  try {
    if (!date) return "Recently";

    const diff = new Date().getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);

    if (days < 7) return `${days}d ago`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  error,
  actionId,
  onAccept,
  onDecline,
  onMarkAsRead,
  onRefresh,
}: Props) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                {unreadCount} unread
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center px-5 py-12 text-xs text-slate-500">
            <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Bell className="h-5 w-5" />
            </div>

            <h3 className="mt-3 text-sm font-semibold text-slate-800">
              You&apos;re all caught up
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

              const isPending =
                notification.actionStatus === "pending";

              const isActing =
                actionId === notification.id;

              const displayFields =
                notification as Notification & NotificationDisplayFields;

              const displayTitle =
                notification.title ||
                displayFields.subject ||
                "Notification";

              const displayMessage =
                notification.message ||
                displayFields.content ||
                displayFields.description ||
                "No message text available.";

              return (
                <div
                  key={notification.id}
                  className={`border-b border-slate-100 px-5 py-4 transition last:border-b-0 ${
                    !notification.read
                      ? "bg-indigo-50/40"
                      : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
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
                        <p
                          className={`text-xs font-semibold ${
                            notification.read
                              ? "text-slate-700"
                              : "text-slate-900"
                          }`}
                        >
                          {displayTitle}
                        </p>

                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {displayMessage}
                      </p>

                      {isInvitation &&
                        isPending &&
                        notification.invitationId && (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => onAccept(notification)}
                              disabled={isActing}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isActing ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}

                              {isActing
                                ? "Processing..."
                                : "Accept"}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDecline(notification)}
                              disabled={isActing}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Decline
                            </button>
                          </div>
                        )}

                      {!notification.read &&
                        !(isInvitation && isPending) && (
                          <button
                            type="button"
                            onClick={() =>
                              onMarkAsRead(notification.id)
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

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full rounded-lg py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900"
          >
            Refresh notifications
          </button>
        </div>
      </div>
    </>
  );
}