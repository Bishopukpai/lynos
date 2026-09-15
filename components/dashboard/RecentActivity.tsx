"use client";

import {
  Activity,
  Bell,
  CheckCircle2,
} from "lucide-react";

import type { Notification } from "@/types/dashboard";

interface RecentActivityProps {
  notifications: Notification[];
}

export default function RecentActivity({
  notifications,
}: RecentActivityProps) {
  const recentNotifications =
    notifications.slice(0, 5);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-2">
          <Activity
            size={18}
            className="text-slate-500"
          />

          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Latest notifications and workspace
          activity.
        </p>
      </div>

      {recentNotifications.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2
            size={28}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm text-slate-500">
            No recent activity.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentNotifications.map(
            (notification) => (
              <div
                key={notification.id}
                className="flex gap-3 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Bell
                    size={15}
                    className="text-slate-500"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {notification.title}
                  </p>

                  {notification.message && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {notification.message}
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}