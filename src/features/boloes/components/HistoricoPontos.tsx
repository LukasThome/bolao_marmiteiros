"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

type RegistroAuditoria = {
  id: string;
  tipo: string;
  pontos: number;
  saldoAntes: number;
  saldoDepois: number;
  descricao: string | null;
  createdAt: string;
  user?: { name: string };
};

export default function HistoricoPontos({
  bolaoSlug,
  userId,
}: {
  bolaoSlug: string;
  userId?: string;
}) {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        setLoading(true);
        const url = new URL("/api/auditoria", window.location.origin);
        url.searchParams.set("bolao", bolaoSlug);
        url.searchParams.set("tipo", "HISTORICO");
        url.searchParams.set("limit", limit.toString());
        url.searchParams.set("offset", (page * limit).toString());
        if (userId) {
          url.searchParams.set("userId", userId);
        }

        const res = await fetch(url.toString());

        if (!res.ok) {
          throw new Error("Erro ao carregar histórico");
        }

        const data = await res.json();
        setRegistros(data.registros || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    carregarHistorico();
  }, [bolaoSlug, page]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" size={24} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 rounded-lg text-sm"
        style={{ backgroundColor: "var(--danger)", color: "#fff" }}
      >
        {error}
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg" style={{ backgroundColor: "var(--bg-surface)" }}>
        <p style={{ color: "var(--text-muted)" }}>Nenhum registro de pontos ainda</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {/* Cabeçalho */}
        <div
          className="grid grid-cols-12 gap-2 px-4 py-3 font-semibold text-xs"
          style={{
            backgroundColor: "var(--bg-raised)",
            borderBottom: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <div className="col-span-2">Data</div>
          <div className="col-span-3">Descrição</div>
          <div className="col-span-2 text-right">Tipo</div>
          <div className="col-span-2 text-right">Pontos</div>
          <div className="col-span-3 text-right">Saldo</div>
        </div>

        {/* Registros */}
        {registros.map((registro, idx) => {
          const data = new Date(registro.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });

          const isPositivo = registro.pontos >= 0;
          const descricaoFormatada =
            registro.descricao ||
            (registro.tipo === "PALPITE_ACERTADO"
              ? "Palpite acertado"
              : registro.tipo === "AJUSTE_MANUAL"
              ? "Ajuste manual"
              : "Reversão");

          return (
            <div
              key={registro.id}
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center"
              style={{
                borderTop: idx > 0 ? "1px solid var(--border)" : undefined,
                backgroundColor: isPositivo ? "transparent" : "rgba(239, 68, 68, 0.05)",
              }}
            >
              <div className="col-span-2 text-xs">{data}</div>

              <div className="col-span-3 text-sm truncate">{descricaoFormatada}</div>

              <div className="col-span-2 text-right text-xs">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor:
                      registro.tipo === "PALPITE_ACERTADO"
                        ? "var(--accent-subtle)"
                        : "var(--bg-raised)",
                    color:
                      registro.tipo === "PALPITE_ACERTADO"
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                  }}
                >
                  {registro.tipo === "PALPITE_ACERTADO"
                    ? "Palpite"
                    : registro.tipo === "AJUSTE_MANUAL"
                    ? "Ajuste"
                    : "Reversão"}
                </span>
              </div>

              <div className="col-span-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  {isPositivo ? (
                    <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                  ) : (
                    <TrendingDown size={14} style={{ color: "var(--danger)" }} />
                  )}
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{
                      color: isPositivo ? "var(--accent)" : "var(--danger)",
                    }}
                  >
                    {isPositivo ? "+" : ""}{registro.pontos}
                  </span>
                </div>
              </div>

              <div className="col-span-3 text-right text-sm font-mono">
                <div style={{ color: "var(--text-primary)" }}>{registro.saldoDepois} pts</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  (de {registro.saldoAntes})
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1 rounded text-sm"
          style={{
            backgroundColor: page === 0 ? "var(--bg-raised)" : "var(--accent)",
            color: page === 0 ? "var(--text-muted)" : "#fff",
            cursor: page === 0 ? "default" : "pointer",
          }}
        >
          ← Anterior
        </button>

        <span style={{ color: "var(--text-secondary)" }} className="text-sm">
          Página {page + 1}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={registros.length < limit}
          className="px-3 py-1 rounded text-sm"
          style={{
            backgroundColor: registros.length < limit ? "var(--bg-raised)" : "var(--accent)",
            color: registros.length < limit ? "var(--text-muted)" : "#fff",
            cursor: registros.length < limit ? "default" : "pointer",
          }}
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
