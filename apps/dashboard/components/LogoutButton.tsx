"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Completes the auth UX: POST /api/auth/logout clears the session cookie, then bounce to /login.
export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface2/60 hover:text-ink disabled:opacity-50"
    >
      <LogOut className="h-4 w-4 text-faint" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
