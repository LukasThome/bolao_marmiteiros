"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // Sempre mostra confirmação — não revela se o email existe
    setLoading(false);
    setSent(true);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div
        className="flex flex-col gap-5 p-8 rounded-2xl w-full max-w-sm"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {sent ? (
          <>
            <div>
              <h1 className="text-xl font-bold mb-1">Email enviado</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Se esse email estiver cadastrado, você receberá um link para redefinir sua senha.
                O link expira em 1 hora.
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm text-center py-2.5 rounded-lg font-medium"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              Voltar ao login
            </Link>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-bold mb-1">Esqueceu a senha?</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Informe seu email e enviaremos um link de redefinição.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              <Link href="/login" style={{ color: "var(--accent)" }}>
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
