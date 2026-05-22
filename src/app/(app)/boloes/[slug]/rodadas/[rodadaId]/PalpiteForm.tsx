"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

type Palpite = { homeScore: number; awayScore: number; pontos: number | null } | null;

type Partida = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  palpite: Palpite;
};

type MemberPalpite = {
  userId: string;
  userName: string;
  homeScore: number;
  awayScore: number;
  pontos: number | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function PontosBadge({ pontos }: { pontos: number | null }) {
  if (pontos === null) return null;
  const colors: Record<number, { bg: string; color: string }> = {
    3: { bg: "var(--accent-subtle)", color: "var(--accent)" },
    1: { bg: "var(--gold-subtle)", color: "var(--gold)" },
    0: { bg: "var(--bg-overlay)", color: "var(--text-muted)" },
  };
  const style = colors[pontos] ?? colors[0];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {pontos} pts
    </span>
  );
}

export default function PalpiteForm({
  partidas,
  isOpen,
  allPalpites = {},
  currentUserId = "",
}: {
  partidas: Partida[];
  isOpen: boolean;
  allPalpites?: Record<string, MemberPalpite[]>;
  currentUserId?: string;
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
    <div className="flex flex-col gap-4">
      {partidas.map((p) => {
        const score = scores[p.id];
        const state = states[p.id];
        const membersHere = allPalpites[p.id] ?? [];
        const finished = p.status === "FINISHED";

        return (
          <div
            key={p.id}
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            {/* Cabeçalho da partida */}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="font-medium flex-1 text-right text-sm">{p.homeTeam}</span>
              {finished ? (
                <span className="text-base font-bold" style={{ color: "var(--accent)" }}>
                  {p.homeScore} × {p.awayScore}
                </span>
              ) : (
                <span className="text-xs px-2" style={{ color: "var(--text-muted)" }}>vs</span>
              )}
              <span className="font-medium flex-1 text-sm">{p.awayTeam}</span>
            </div>

            {/* Formulário (aberto) */}
            {isOpen && (
              <div
                className="flex items-center gap-2 justify-center px-4 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
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
                  style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
                  style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
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
                  <span className="text-xs" style={{ color: "var(--danger)" }}>Erro</span>
                )}
              </div>
            )}

            {/* Grade de palpites (encerrado) */}
            {!isOpen && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                {membersHere.length === 0 ? (
                  <p
                    className="text-xs px-4 py-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Nenhum palpite registrado
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                    {membersHere.map((mp) => {
                      const isMe = mp.userId === currentUserId;
                      return (
                        <div
                          key={mp.userId}
                          className="flex items-center gap-3 px-4 py-2.5"
                          style={isMe ? { backgroundColor: "var(--accent-subtle)" } : undefined}
                        >
                          <span
                            className="flex-1 text-sm truncate"
                            style={{ color: isMe ? "var(--accent)" : "var(--text-primary)", fontWeight: isMe ? 600 : 400 }}
                          >
                            {mp.userName}
                            {isMe && <span className="ml-1 text-xs font-normal" style={{ color: "var(--accent)" }}>você</span>}
                          </span>
                          <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {mp.homeScore} × {mp.awayScore}
                          </span>
                          <PontosBadge pontos={finished ? mp.pontos : null} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
