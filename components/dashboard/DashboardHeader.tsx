"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";

import UserProfileMenu from "@/components/UserProfileMenu";
import NotificationDropdown from "@/components/NotificationDropdown";

import type { Notification } from "@/types/dashboard";

interface DashboardHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  notifications: Notification[];
  unreadNotificationCount: number;
  notificationsLoading: boolean;
  notificationsError: string | null;

  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;

  notificationActionId: string | null;

  markNotificationAsRead: (
    id: string
  ) => Promise<void>;

  handleAcceptNotification: (
    notification: Notification
  ) => Promise<void>;

  handleDeclineNotification: (
    notification: Notification
  ) => Promise<void>;

  loadNotifications: () => Promise<void>;
}

export default function DashboardHeader({
  setSidebarOpen,
  notifications,
  unreadNotificationCount,
  notificationsLoading,
  notificationsError,
  notificationPanelOpen,
  setNotificationPanelOpen,
  notificationActionId,
  markNotificationAsRead,
  handleAcceptNotification,
  handleDeclineNotification,
  loadNotifications,
}: DashboardHeaderProps) {
  const [refreshingNotifications, setRefreshingNotifications] =
    useState(false);

  async function handleNotificationToggle() {
    const willOpen = !notificationPanelOpen;

    setNotificationPanelOpen(willOpen);

    if (!willOpen) {
      return;
    }

    try {
      setRefreshingNotifications(true);
      await loadNotifications();
    } finally {
      setRefreshingNotifications(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile sidebar button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="hidden w-72 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search
            size={17}
            className="shrink-0 text-slate-400"
          />

          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            aria-label="Search dashboard"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={handleNotificationToggle}
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Open notifications"
            aria-expanded={notificationPanelOpen}
            aria-haspopup="true"
          >
            <Bell
              className="h-5 w-5"
              aria-hidden="true"
            />

            {/* Unread badge */}
            {unreadNotificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadNotificationCount > 99
                  ? "99+"
                  : unreadNotificationCount}
              </span>
            )}

            {/* Refreshing indicator */}
            {refreshingNotifications &&
              unreadNotificationCount === 0 && (
                <span className="absolute right-0 top-0 h-2 w-2 animate-pulse rounded-full bg-indigo-600 ring-2 ring-white" />
              )}
          </button>

          <NotificationDropdown
            isOpen={notificationPanelOpen}
            onClose={() =>
              setNotificationPanelOpen(false)
            }
            notifications={notifications}
            unreadCount={unreadNotificationCount}
            loading={
              notificationsLoading ||
              refreshingNotifications
            }
            error={notificationsError}
            actionId={notificationActionId}
            onMarkAsRead={
              markNotificationAsRead
            }
            onAccept={
              handleAcceptNotification
            }
            onDecline={
              handleDeclineNotification
            }
            onRefresh={loadNotifications}
          />
        </div>

        {/* Divider */}
        <div className="ml-1 hidden h-6 w-px bg-slate-200 sm:block" />

        {/* Profile menu */}
        <UserProfileMenu />
      </div>
    </header>
  );
}