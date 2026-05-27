"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { getFlag } from "@/features/boloes/lib/flags";
import { Shield } from "lucide-react";

function TeamFlag({ name }: { name: string }) {
  const flag = getFlag(name);
  if (flag) return <span className="text-base shrink-0">{flag}</span>;
  return <Shield size={14} className="shrink-0" style={{ color: "var(--text-muted)" }} />;
}

type Palpite = { homeScore: number; awayScore: number; pontos: number | null } | null;

type Partida = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string | null;
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
  const map: Record<number, [string, string]> = {
    3: ["var(--accent-subtle)", "var(--accent)"],
    1: ["var(--gold-subtle)", "var(--gold)"],
    0: ["var(--bg-overlay)", "var(--text-muted)"],
  };
  const [bg, color] = map[pontos] ?? map[0];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums shrink-0"
      style={{ backgroundColor: bg, color }}
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
    Object.fromEntries(partidas.map((p) => [p.id, "idle"]))
  );

  async function savePalpite(partidaId: string) {
    const { home, away } = scores[partidaId];
    const homeScore = parseInt(home);
    const awayScore = parseInt(away);
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      setStates((s) => ({ ...s, [partidaId]: "error" }));
      return;
    }

    setStates((s) => ({ ...s, [partidaId]: "saving" }));
    try {
      const res = await fetch("/api/palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partidaId, homeScore, awayScore }),
      });
      if (res.ok) {
        setStates((s) => ({ ...s, [partidaId]: "saved" }));
        setTimeout(() => setStates((s) => ({ ...s, [partidaId]: "idle" })), 2000);
      } else {
        setStates((s) => ({ ...s, [partidaId]: "error" }));
      }
    } catch {
      setStates((s) => ({ ...s, [partidaId]: "error" }));
    }
  }

  // Agrupa partidas por dia (YYYY-MM-DD no horário de Brasília)
  const grouped = partidas.reduce<{ day: string; label: string; items: Partida[] }[]>((acc, p) => {
    const dayKey = p.scheduledAt
      ? new Date(p.scheduledAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" })
      : "Sem data";
    const last = acc[acc.length - 1];
    if (last && last.day === dayKey) {
      last.items.push(p);
    } else {
      const label = p.scheduledAt
        ? new Date(p.scheduledAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" })
        : "Sem data definida";
      acc.push({ day: dayKey, label, items: [p] });
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {grouped.map(({ day, label, items }) => (
        <div key={day}>
          {/* Cabeçalho do dia */}
          <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            {items.map((p, i) => {
        const score = scores[p.id];
        const state = states[p.id];
        const membersHere = allPalpites[p.id] ?? [];
        const finished = p.status === "FINISHED";

        return (
          <div
            key={p.id}
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            {/* Linha da partida */}
            <div className="flex items-center gap-2 px-4 py-3">
              {/* Time mandante */}
              <span className="flex-1 text-sm font-medium text-right truncate flex items-center justify-end gap-1.5" title={p.homeTeam}>
                {p.homeTeam}
                <TeamFlag name={p.homeTeam} />
              </span>

              {/* Área central: placar ou inputs */}
              {isOpen ? (
                <div className="shrink-0 flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={score.home}
                    onChange={(e) => {
                      setScores((s) => ({ ...s, [p.id]: { ...s[p.id], home: e.target.value } }));
                      setStates((s) => ({ ...s, [p.id]: "idle" }));
                    }}
                    placeholder="0"
                    className="w-11 text-center rounded-lg px-1 py-1.5 text-sm outline-none tabular-nums"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>×</span>
                  <input
                    type="number"
                    min="0"
                    value={score.away}
                    onChange={(e) => {
                      setScores((s) => ({ ...s, [p.id]: { ...s[p.id], away: e.target.value } }));
                      setStates((s) => ({ ...s, [p.id]: "idle" }));
                    }}
                    placeholder="0"
                    className="w-11 text-center rounded-lg px-1 py-1.5 text-sm outline-none tabular-nums"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              ) : finished ? (
                <span
                  className="shrink-0 text-base font-bold tabular-nums px-2"
                  style={{ color: "var(--accent)" }}
                >
                  {p.homeScore} × {p.awayScore}
                </span>
              ) : (
                <span
                  className="shrink-0 text-xs px-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  vs
                </span>
              )}

              {/* Time visitante */}
              <span className="flex-1 text-sm font-medium truncate flex items-center gap-1.5" title={p.awayTeam}>
                <TeamFlag name={p.awayTeam} />
                {p.awayTeam}
              </span>

              {/* Botão salvar (só aberto) */}
              {isOpen && (
                <button
                  onClick={() => savePalpite(p.id)}
                  disabled={state === "saving"}
                  className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all min-w-[58px] justify-center"
                  style={{
                    backgroundColor: state === "saved" ? "var(--accent-subtle)" : "var(--accent)",
                    color: state === "saved" ? "var(--accent)" : "#fff",
                    opacity: state === "saving" ? 0.7 : 1,
                    cursor: state === "saving" ? "not-allowed" : "pointer",
                  }}
                >
                  {state === "saving" && <Loader2 size={11} className="animate-spin" />}
                  {state === "saved" && <Check size={11} />}
                  {state === "saving" ? "..." : state === "saved" ? "Salvo" : "Salvar"}
                </button>
              )}
              {isOpen && state === "error" && (
                <span className="text-xs shrink-0" style={{ color: "var(--danger)" }}>!</span>
              )}
            </div>

            {/* Palpites dos membros (encerrado) */}
            {!isOpen && membersHere.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-raised)" }}>
                {membersHere.map((mp) => {
                  const isMe = mp.userId === currentUserId;
                  return (
                    <div
                      key={mp.userId}
                      className="flex items-center gap-3 px-4 py-2"
                      style={isMe ? { backgroundColor: "var(--accent-subtle)" } : undefined}
                    >
                      <span
                        className="flex-1 text-xs truncate"
                        style={{ color: isMe ? "var(--accent)" : "var(--text-secondary)", fontWeight: isMe ? 600 : 400 }}
                      >
                        {mp.userName}
                        {isMe && <span className="ml-1 font-normal opacity-70">você</span>}
                      </span>
                      <span
                        className="text-xs tabular-nums font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {mp.homeScore} × {mp.awayScore}
                      </span>
                      <PontosBadge pontos={finished ? mp.pontos : null} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sem palpites (encerrado) */}
            {!isOpen && membersHere.length === 0 && (
              <div
                className="px-4 py-2"
                style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-raised)" }}
              >
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Nenhum palpite registrado
                </span>
              </div>
            )}
            </div>
          );
        })}
          </div>
        </div>
      ))}
    </div>
  );
}
