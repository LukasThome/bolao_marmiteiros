"use client";

import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";

export default function InviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${token}`
      : `/join/${token}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Link2 size={13} style={{ color: "var(--text-secondary)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Link de convite
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="flex-1 text-xs truncate rounded-lg px-3 py-2 font-mono"
          style={{ backgroundColor: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          {url}
        </span>
        <button
          onClick={copy}
          className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: copied ? "var(--accent-subtle)" : "var(--bg-raised)",
            color: copied ? "var(--accent)" : "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
