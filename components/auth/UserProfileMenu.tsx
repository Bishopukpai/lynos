"use client";

import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import LogoutButton from "@/components/auth/LogoutButton";

interface UserProfileMenuProps {
  variant?: "sidebar" | "navbar";
}

function getInitials(
  name?: string | null,
  email?: string | null
): string {
  const value = name?.trim() || email?.trim() || "User";

  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

export default function UserProfileMenu({
  variant = "sidebar",
}: UserProfileMenuProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const name = session?.user?.name || "User";
  const email = session?.user?.email || "No email available";
  const initials = getInitials(
    session?.user?.name,
    session?.user?.email
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  if (variant === "navbar") {
    return (
      <div
        ref={menuRef}
        className="relative"
      >
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {initials}
          </div>

          <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">
            {name}
          </span>

          <ChevronDown
            className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {email}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>

            <div className="border-t border-slate-200 p-2">
              <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
                <LogOut className="h-4 w-4" />

                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-100"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {name}
          </p>

          <p className="truncate text-xs text-slate-500">
            {email}
          </p>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <User className="h-4 w-4" />
              Profile
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>

          <div className="border-t border-slate-200 p-2">
            <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
              <LogOut className="h-4 w-4" />

              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

