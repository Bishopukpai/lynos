"use client";

import { Menu, Search } from "lucide-react";

import UserProfileMenu from "../../components/UserProfileMenu";
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
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="hidden w-72 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search
            size={17}
            className="text-slate-400"
          />

          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadNotificationCount}
          loading={notificationsLoading}
          error={notificationsError}
          isOpen={notificationPanelOpen}
          onClose={() =>
            setNotificationPanelOpen(false)
          }
          actionId={notificationActionId}
          onMarkAsRead={markNotificationAsRead}
          onAccept={handleAcceptNotification}
          onDecline={handleDeclineNotification}
          onRefresh={loadNotifications}
        />

        <div className="lg:hidden">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}