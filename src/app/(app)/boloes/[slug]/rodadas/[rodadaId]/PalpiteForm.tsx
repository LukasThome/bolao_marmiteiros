"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

type Palpite = { homeScore: number; awayScore: number } | null;

type Partida = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  palpite: Palpite;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function PalpiteForm({
  partidas,
  isOpen,
}: {
  partidas: Partida[];
  isOpen: boolean;
}) {
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>(() =>
    Object.fromEntries(
      partidas.map((p) => [
        p.id,
        {
          home: p.palpite?.homeScore?.toString() ?? "",
          away: p.palpite?.awayScore?.toString() ?? "",
        },
      ])
    )
  );

  const [states, setStates] = useState<Record<string, SaveState>>(() =>
    Object.fromEntries(partidas.map((p) => [p.id, p.palpite ? "saved" : "idle"]))
  );

  async function savePalpite(partidaId: string) {
    const { home, away } = scores[partidaId];
    const homeScore = parseInt(home);
    const awayScore = parseInt(away);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) return;

    setStates((s) => ({ ...s, [partidaId]: "saving" }));

    try {
      const res = await fetch("/api/palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partidaId, homeScore, awayScore }),
      });

      setStates((s) => ({ ...s, [partidaId]: res.ok ? "saved" : "error" }));
    } catch {
      setStates((s) => ({ ...s, [partidaId]: "error" }));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {partidas.map((p) => {
        const score = scores[p.id];
        const state = states[p.id];

        return (
          <div
            key={p.id}
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            {/* Cabeçalho da partida */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="font-medium flex-1 text-right">{p.homeTeam}</span>
              {p.status === "FINISHED" ? (
                <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                  {p.homeScore} × {p.awayScore}
                </span>
              ) : (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>vs</span>
              )}
              <span className="font-medium flex-1">{p.awayTeam}</span>
            </div>

            {/* Palpite */}
            <div className="flex items-center gap-2 justify-center">
              {isOpen ? (
                <>
                  <input
                    type="number"
                    min="0"
                    value={score.home}
                    onChange={(e) => {
                      setScores((s) => ({ ...s, [p.id]: { ...s[p.id], home: e.target.value } }));
                      setStates((s) => ({ ...s, [p.id]: "idle" }));
                    }}
                    placeholder="0"
                    className="w-14 text-center rounded-lg px-2 py-1.5 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>×</span>
                  <input
                    type="number"
                    min="0"
                    value={score.away}
                    onChange={(e) => {
                      setScores((s) => ({ ...s, [p.id]: { ...s[p.id], away: e.target.value } }));
                      setStates((s) => ({ ...s, [p.id]: "idle" }));
                    }}
                    placeholder="0"
                    className="w-14 text-center rounded-lg px-2 py-1.5 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    onClick={() => savePalpite(p.id)}
                    disabled={state === "saving" || state === "saved"}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 min-w-[70px] justify-center"
                    style={{
                      backgroundColor: state === "saved" ? "var(--accent-subtle)" : "var(--accent)",
                      color: state === "saved" ? "var(--accent)" : "#fff",
                      opacity: state === "saving" ? 0.7 : 1,
                      cursor: state === "saved" ? "default" : "pointer",
                    }}
                  >
                    {state === "saving" && <Loader2 size={11} className="animate-spin" />}
                    {state === "saved" && <Check size={11} />}
                    {state === "saving" ? "Salvando" : state === "saved" ? "Salvo" : "Salvar"}
                  </button>
                  {state === "error" && (
                    <span className="text-xs" style={{ color: "var(--danger)" }}>
                      Erro ao salvar
                    </span>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {score.home !== "" && score.away !== "" ? (
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Seu palpite:{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {score.home} × {score.away}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Sem palpite registrado
                    </span>
                  )}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--bg-raised)", color: "var(--text-muted)" }}
                  >
                    Encerrado
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
