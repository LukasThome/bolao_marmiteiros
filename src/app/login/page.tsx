"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (!res?.ok || res?.error) {
      // Consulta o status de bloqueio para dar mensagem adequada
      const statusRes = await fetch(`/api/auth/lockout-status?email=${encodeURIComponent(email)}`);
      const status = await statusRes.json();

      if (status.locked) {
        setError(`Conta bloqueada. Tente novamente em ${formatTime(status.remainingSeconds)}.`);
      } else if (status.attempts >= 4) {
        setError(`Senha incorreta. Mais ${5 - status.attempts} tentativa(s) antes do bloqueio.`);
      } else {
        setError("Email ou senha incorretos.");
      }
    } else {
      window.location.href = callbackUrl;
    }

    setLoading(false);
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
            Entre com seu email e senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            placeholder="Senha"
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
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Não tem conta?{" "}
          <Link href="/register" style={{ color: "var(--accent)" }}>
            Criar conta
          </Link>
        </p>

        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => signIn("dev-bypass", { callbackUrl: "/dashboard" })}
            className="py-2 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: "var(--bg-overlay)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Dev Bypass
          </button>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
