"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/signin",
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
    >
      Sign Out
    </button>
  );
}

