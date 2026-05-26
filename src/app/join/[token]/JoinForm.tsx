"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function JoinForm({ token, bolaoName }: { token: string; bolaoName: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar conta");
      setLoading(false);
      return;
    }

    // Auto-login redirects back to this page; server completes the join
    await signIn("credentials", { email, password, callbackUrl: `/join/${token}` });
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
        <div>
          <h1 className="text-xl font-bold mb-1">🍱 Bolão dos Marmiteiros</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Você foi convidado para{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {bolaoName}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-raised)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />

          {error && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Criando conta..." : "Criar conta e entrar"}
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Já tem conta?{" "}
          <Link href={`/login?callbackUrl=/join/${token}`} style={{ color: "var(--accent)" }}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
