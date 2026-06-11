"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, CheckCircle } from "lucide-react";

type SyncTudoResult = {
  totalSynced: number;
  rodadas: { rodadaId: string; nome: string; synced: number; notFound: number }[];
};

/**
 * Botão de admin para buscar os resultados da API e pontuar os palpites
 * de todas as rodadas em andamento de uma só vez.
 */
export default function AtualizarResultados() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncTudoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function atualizar() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/resultados/sync-tudo", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Erro ao atualizar resultados");
      } else {
        setResult(data);
        if (data.totalSynced > 0) router.refresh();
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 mb-6">
      <button
        onClick={atualizar}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium"
        style={{
          backgroundColor: "var(--accent)",
          color: "#fff",
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {loading ? "Atualizando resultados..." : "Atualizar resultados da API"}
      </button>

      {result && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--success)" }}>
          <CheckCircle size={13} />
          {result.totalSynced > 0
            ? `${result.totalSynced} partida${result.totalSynced !== 1 ? "s" : ""} atualizada${result.totalSynced !== 1 ? "s" : ""} e pontuada${result.totalSynced !== 1 ? "s" : ""}`
            : "Nenhuma partida nova para atualizar"}
        </p>
      )}

      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
