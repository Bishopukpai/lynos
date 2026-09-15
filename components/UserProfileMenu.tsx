"use client";

import {
  ChevronDown,
  LogOut,
  Settings,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

interface UserProfileMenuProps {
  name?: string;
  email?: string;
  avatarUrl?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void | Promise<void>;
}

export default function UserProfileMenu({
  name,
  email,
  avatarUrl,
  onProfile,
  onSettings,
  onLogout,
}: UserProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: session } = useSession();

  const menuRef = useRef<HTMLDivElement | null>(null);

  /*
   * -------------------------------------------------------
   * AUTHENTICATED USER
   * -------------------------------------------------------
   *
   * Prefer explicitly supplied props when available.
   * Otherwise use the authenticated NextAuth session.
   */
  const userName =
    name?.trim() ||
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "Account";

  const userEmail =
    email?.trim() ||
    session?.user?.email ||
    undefined;

  const userAvatar =
    avatarUrl ||
    session?.user?.image ||
    undefined;

  /*
   * Generate initials from the user's name.
   *
   * Examples:
   * "John Doe" -> JD
   * "John" -> J
   * "john@example.com" -> J
   */
  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  /*
   * -------------------------------------------------------
   * CLOSE MENU WHEN CLICKING OUTSIDE
   * -------------------------------------------------------
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [open]);

  /*
   * -------------------------------------------------------
   * CLOSE MENU WITH ESCAPE
   * -------------------------------------------------------
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  /*
   * -------------------------------------------------------
   * PROFILE
   * -------------------------------------------------------
   */
  function handleProfile() {
    setOpen(false);
    onProfile?.();
  }

  /*
   * -------------------------------------------------------
   * SETTINGS
   * -------------------------------------------------------
   */
  function handleSettings() {
    setOpen(false);
    onSettings?.();
  }

  /*
   * -------------------------------------------------------
   * LOGOUT
   * -------------------------------------------------------
   *
   * If the parent supplies onLogout, use it.
   *
   * Otherwise, use NextAuth directly.
   */
  async function handleLogout() {
    if (loggingOut) return;

    setOpen(false);
    setLoggingOut(true);

    try {
      if (onLogout) {
        await onLogout();
        return;
      }

      await signOut({
        callbackUrl: "/signin",
      });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      {/* -------------------------------------------------
          PROFILE BUTTON
          ------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {initials || "A"}
          </div>
        )}

        <div className="hidden max-w-32 text-left sm:block">
          <p className="truncate text-sm font-semibold text-slate-800">
            {userName}
          </p>

          {userEmail && (
            <p className="truncate text-xs text-slate-400">
              {userEmail}
            </p>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`hidden text-slate-400 transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* -------------------------------------------------
          DROPDOWN
          ------------------------------------------------- */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          {/* -------------------------------------------------
              USER INFORMATION
              ------------------------------------------------- */}
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {initials || "A"}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {userName}
                </p>

                {userEmail && (
                  <p className="truncate text-xs text-slate-500">
                    {userEmail}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* -------------------------------------------------
              MENU ITEMS
              ------------------------------------------------- */}
          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleProfile}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <User
                size={17}
                className="text-slate-400"
              />

              <span>Profile</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleSettings}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Settings
                size={17}
                className="text-slate-400"
              />

              <span>Settings</span>
            </button>
          </div>

          {/* -------------------------------------------------
              SIGN OUT
              ------------------------------------------------- */}
          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={17} />

              <span>
                {loggingOut ? "Signing out..." : "Sign out"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}