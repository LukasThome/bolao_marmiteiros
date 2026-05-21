"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Loader2 } from "lucide-react";

const LIGAS = [
  { id: "71", nome: "Brasileirão Série A" },
  { id: "72", nome: "Brasileirão Série B" },
  { id: "73", nome: "Copa do Brasil" },
  { id: "13", nome: "Libertadores" },
  { id: "11", nome: "Sul-Americana" },
];

type Fixture = {
  id: number;
  date: string;
  status: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
};

export default function BuscarPartidas({
  rodadaId,
  existingTeams,
}: {
  rodadaId: string;
  existingTeams: string[];
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [liga, setLiga] = useState("71");
  const [date, setDate] = useState(today);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState<Set<number>>(new Set());

  async function buscar() {
    setLoading(true);
    setError(null);
    setFixtures([]);
    try {
      const res = await fetch(
        `/api/sugestoes/partidas?league=${liga}&date=${date}&season=${new Date().getFullYear()}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao buscar jogos");
      } else {
        setFixtures(data.fixtures);
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function adicionar(fixture: Fixture) {
    setAdding((s) => new Set(s).add(fixture.id));
    try {
      const res = await fetch("/api/partidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rodadaId,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
        }),
      });
      if (res.ok) {
        setAdded((s) => new Set(s).add(fixture.id));
        router.refresh();
      }
    } finally {
      setAdding((s) => {
        const next = new Set(s);
        next.delete(fixture.id);
        return next;
      });
    }
  }

  function jaExiste(fixture: Fixture) {
    return (
      added.has(fixture.id) ||
      existingTeams.some(
        (t) =>
          t.toLowerCase() === fixture.homeTeam.toLowerCase() ||
          t.toLowerCase() === fixture.awayTeam.toLowerCase()
      )
    );
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
        Buscar jogos da API
      </h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={liga}
          onChange={(e) => setLiga(e.target.value)}
          className="flex-1 min-w-40 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          {LIGAS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />

        <button
          onClick={buscar}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: "var(--accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Buscar
        </button>
      </div>

      {/* Erro */}
      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {/* Resultados */}
      {fixtures.length === 0 && !loading && !error && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Selecione liga e data e clique em Buscar.
        </p>
      )}

      {fixtures.length > 0 && (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {fixtures.map((f) => {
            const existe = jaExiste(f);
            const adicionando = adding.has(f.id);
            const hora = new Date(f.date).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                style={{
                  backgroundColor: "var(--bg-raised)",
                  opacity: existe ? 0.5 : 1,
                }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">
                    {f.homeTeam} × {f.awayTeam}
                  </span>
                  <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {hora} · {f.round}
                  </span>
                </div>

                <button
                  onClick={() => !existe && !adicionando && adicionar(f)}
                  disabled={existe || adicionando}
                  className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                  style={{
                    backgroundColor: existe ? "var(--bg-overlay)" : "var(--accent)",
                    color: existe ? "var(--text-muted)" : "#fff",
                    cursor: existe ? "default" : "pointer",
                  }}
                >
                  {adicionando ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Plus size={11} />
                  )}
                  {existe ? "Adicionado" : "Adicionar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
