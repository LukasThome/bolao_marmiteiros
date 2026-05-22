"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PasswordResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao redefinir senha. O link pode ter expirado.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
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
        {done ? (
          <>
            <div>
              <h1 className="text-xl font-bold mb-1">Senha redefinida!</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Sua senha foi atualizada. Redirecionando para o login...
              </p>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-bold mb-1">Criar nova senha</h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Escolha uma senha com no mínimo 6 caracteres.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                placeholder="Confirmar senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
                }}
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
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
