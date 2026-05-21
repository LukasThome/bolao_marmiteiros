"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
      style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
      title="Sair"
    >
      <LogOut size={13} />
      Sair
    </button>
  );
}
