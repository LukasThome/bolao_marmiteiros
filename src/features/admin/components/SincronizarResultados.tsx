"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

type SyncResult = {
  synced: number;
  alreadyDone: number;
  notFound: string[];
};

export default function SincronizarResultados({ rodadaId }: { rodadaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sincronizar() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/resultados/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rodadaId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao sincronizar");
      } else {
        setResult(data);
        if (data.synced > 0) router.refresh();
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Sincronizar resultados via API
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Busca placares finalizados e calcula pontos automaticamente
          </p>
        </div>
        <button
          onClick={sincronizar}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium shrink-0"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {loading ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>

      {result && (
        <div className="flex flex-col gap-1.5 text-sm mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {result.synced > 0 && (
            <p className="flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <CheckCircle size={13} />
              {result.synced} partida{result.synced !== 1 ? "s" : ""} sincronizada{result.synced !== 1 ? "s" : ""} e pontuadas
            </p>
          )}
          {result.alreadyDone > 0 && (
            <p style={{ color: "var(--text-muted)" }}>
              {result.alreadyDone} partida{result.alreadyDone !== 1 ? "s" : ""} já finalizada{result.alreadyDone !== 1 ? "s" : ""}
            </p>
          )}
          {result.synced === 0 && result.notFound.length === 0 && result.alreadyDone === 0 && (
            <p style={{ color: "var(--text-muted)" }}>Nenhuma partida pendente.</p>
          )}
          {result.notFound.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 mb-1" style={{ color: "var(--warning)" }}>
                <AlertTriangle size={13} />
                Não encontradas na API ({result.notFound.length}):
              </p>
              <ul className="pl-5 space-y-0.5">
                {result.notFound.map((name) => (
                  <li key={name} className="text-xs list-disc" style={{ color: "var(--text-muted)" }}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm mt-3 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
