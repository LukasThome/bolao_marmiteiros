"use client";

import { useState, useMemo } from "react";
import { Check, Loader2, Pencil, Save } from "lucide-react";
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
  group: string | null;
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

  const [savingAll, setSavingAll] = useState(false);
  const [saveAllResult, setSaveAllResult] = useState<{ saved: number; errors: number } | null>(null);

  function isDirty(p: Partida): boolean {
    const { home, away } = scores[p.id];
    if (!p.palpite) return home !== "" || away !== "";
    return home !== p.palpite.homeScore.toString() || away !== p.palpite.awayScore.toString();
  }

  function isValidScore(partidaId: string): boolean {
    const { home, away } = scores[partidaId];
    const h = parseInt(home);
    const a = parseInt(away);
    return !isNaN(h) && !isNaN(a) && h >= 0 && a >= 0;
  }

  const pendingPartidas = useMemo(
    () => partidas.filter((p) => isDirty(p) && isValidScore(p.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scores, partidas]
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

  async function saveAll() {
    const toSave = pendingPartidas.map((p) => ({
      partidaId: p.id,
      homeScore: parseInt(scores[p.id].home),
      awayScore: parseInt(scores[p.id].away),
    }));

    if (toSave.length === 0) return;

    setSavingAll(true);
    setSaveAllResult(null);
    for (const p of pendingPartidas) {
      setStates((s) => ({ ...s, [p.id]: "saving" }));
    }

    try {
      const res = await fetch("/api/palpites/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palpites: toSave }),
      });
      const data = await res.json();

      if (res.ok) {
        setSaveAllResult({ saved: data.saved, errors: data.errors?.length ?? 0 });
        for (const p of pendingPartidas) {
          setStates((s) => ({ ...s, [p.id]: "saved" }));
          setTimeout(() => setStates((s) => ({ ...s, [p.id]: "idle" })), 2500);
        }
        setTimeout(() => setSaveAllResult(null), 3000);
      }
    } catch {
      for (const p of pendingPartidas) {
        setStates((s) => ({ ...s, [p.id]: "error" }));
      }
    } finally {
      setSavingAll(false);
    }
  }

  // Agrupa por grupo, depois por dia dentro do grupo
  const grouped = useMemo(() => {
    const groupMap = new Map<string, Partida[]>();
    for (const p of partidas) {
      const key = p.group?.trim() || "Outras partidas";
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(p);
    }

    return Array.from(groupMap.entries()).map(([groupLabel, items]) => {
      const dayMap = new Map<string, { label: string; items: Partida[] }>();
      for (const p of items) {
        const dayKey = p.scheduledAt
          ? new Date(p.scheduledAt).toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : "Sem data";
        if (!dayMap.has(dayKey)) {
          const label = p.scheduledAt
            ? new Date(p.scheduledAt).toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "Sem data definida";
          dayMap.set(dayKey, { label, items: [] });
        }
        dayMap.get(dayKey)!.items.push(p);
      }

      const days = Array.from(dayMap.entries()).map(([day, { label, items: dayItems }]) => ({
        day,
        label,
        items: dayItems,
      }));

      return { groupLabel, days };
    });
  }, [partidas]);

  const totalPalpites = partidas.filter((p) => p.palpite !== null).length;
  const totalPartidas = partidas.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Barra de progresso / salvar todos */}
      {isOpen && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {totalPalpites}/{totalPartidas}{" "}
              <span style={{ color: "var(--text-secondary)" }}>palpites registrados</span>
            </span>
            {pendingPartidas.length > 0 && (
              <span className="text-xs" style={{ color: "var(--gold)" }}>
                {pendingPartidas.length} alteração{pendingPartidas.length !== 1 ? "ões" : ""} pendente{pendingPartidas.length !== 1 ? "s" : ""}
              </span>
            )}
            {saveAllResult && (
              <span className="text-xs" style={{ color: "var(--accent)" }}>
                {saveAllResult.saved} palpite{saveAllResult.saved !== 1 ? "s" : ""} salvo{saveAllResult.saved !== 1 ? "s" : ""}
                {saveAllResult.errors > 0 && ` · ${saveAllResult.errors} erro${saveAllResult.errors !== 1 ? "s" : ""}`}
              </span>
            )}
          </div>

          <button
            onClick={saveAll}
            disabled={savingAll || pendingPartidas.length === 0}
            className="shrink-0 flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: pendingPartidas.length > 0 ? "var(--accent)" : "var(--bg-raised)",
              color: pendingPartidas.length > 0 ? "#fff" : "var(--text-muted)",
              cursor: pendingPartidas.length === 0 ? "default" : "pointer",
              opacity: savingAll ? 0.7 : 1,
            }}
          >
            {savingAll ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {savingAll ? "Salvando..." : "Salvar todos"}
          </button>
        </div>
      )}

      {/* Seções por grupo */}
      {grouped.map(({ groupLabel, days }) => (
        <div key={groupLabel} className="flex flex-col gap-2">
          <p
            className="text-xs font-bold uppercase tracking-widest px-1"
            style={{ color: "var(--text-muted)" }}
          >
            {groupLabel}
          </p>

          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            {days.map(({ day, label, items }, dayIdx) => (
              <div key={day}>
                {/* Sub-cabeçalho de dia (apenas quando há mais de um dia no grupo) */}
                {days.length > 1 && (
                  <div
                    className="px-4 py-2"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      borderTop: dayIdx > 0 ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    <span className="text-xs font-medium capitalize" style={{ color: "var(--text-secondary)" }}>
                      {label}
                    </span>
                  </div>
                )}

                {items.map((p, i) => {
                  const score = scores[p.id];
                  const state = states[p.id];
                  const membersHere = allPalpites[p.id] ?? [];
                  const finished = p.status === "FINISHED";
                  const dirty = isDirty(p);
                  const hasPalpite = p.palpite !== null;
                  const hora = p.scheduledAt
                    ? new Date(p.scheduledAt).toLocaleTimeString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : null;

                  const isFirst = i === 0 && dayIdx === 0;

                  return (
                    <div
                      key={p.id}
                      style={!isFirst ? { borderTop: "1px solid var(--border)" } : undefined}
                    >
                      <div
                        className="flex flex-col px-4 py-3"
                        style={
                          dirty && isOpen
                            ? { borderLeft: "3px solid var(--gold)", paddingLeft: "13px" }
                            : isOpen && hasPalpite && !dirty
                            ? { borderLeft: "3px solid var(--accent)", paddingLeft: "13px" }
                            : undefined
                        }
                      >
                        {/* Linha do time mandante */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <TeamFlag name={p.homeTeam} />
                            <span className="text-sm font-medium truncate" title={p.homeTeam}>
                              {p.homeTeam}
                            </span>
                          </div>
                          {isOpen ? (
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={score.home}
                              onChange={(e) => {
                                setScores((s) => ({ ...s, [p.id]: { ...s[p.id], home: e.target.value } }));
                                setStates((s) => ({ ...s, [p.id]: "idle" }));
                              }}
                              placeholder="—"
                              className="shrink-0 w-11 text-center rounded-lg px-1 py-1.5 text-sm outline-none tabular-nums"
                              style={{
                                backgroundColor: "var(--bg-raised)",
                                border: dirty ? "1px solid var(--gold)" : "1px solid var(--border)",
                                color: "var(--text-primary)",
                              }}
                            />
                          ) : (
                            <span
                              className="shrink-0 w-8 text-center text-base font-bold tabular-nums"
                              style={{ color: finished ? "var(--accent)" : "var(--text-muted)" }}
                            >
                              {finished ? p.homeScore : "—"}
                            </span>
                          )}
                        </div>

                        {/* Linha do time visitante */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <TeamFlag name={p.awayTeam} />
                            <span className="text-sm font-medium truncate" title={p.awayTeam}>
                              {p.awayTeam}
                            </span>
                          </div>
                          {isOpen ? (
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={score.away}
                              onChange={(e) => {
                                setScores((s) => ({ ...s, [p.id]: { ...s[p.id], away: e.target.value } }));
                                setStates((s) => ({ ...s, [p.id]: "idle" }));
                              }}
                              placeholder="—"
                              className="shrink-0 w-11 text-center rounded-lg px-1 py-1.5 text-sm outline-none tabular-nums"
                              style={{
                                backgroundColor: "var(--bg-raised)",
                                border: dirty ? "1px solid var(--gold)" : "1px solid var(--border)",
                                color: "var(--text-primary)",
                              }}
                            />
                          ) : (
                            <span
                              className="shrink-0 w-8 text-center text-base font-bold tabular-nums"
                              style={{ color: finished ? "var(--accent)" : "var(--text-muted)" }}
                            >
                              {finished ? p.awayScore : "—"}
                            </span>
                          )}
                        </div>

                        {/* Hora da partida */}
                        {hora && (
                          <span
                            className="text-xs tabular-nums mt-2"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {hora}
                          </span>
                        )}

                        {/* Botão de ação na parte inferior (só aberto) */}
                        {isOpen && (
                          <div className="flex items-center justify-center gap-2 mt-3">
                            {state === "error" && (
                              <span className="text-xs" style={{ color: "var(--danger)" }}>!</span>
                            )}
                            <button
                              onClick={() => savePalpite(p.id)}
                              disabled={state === "saving"}
                              className="w-1/2 flex items-center gap-1 text-xs px-2.5 py-2 rounded-lg font-medium transition-all justify-center"
                              style={{
                                backgroundColor:
                                  state === "saved"
                                    ? "var(--accent-subtle)"
                                    : dirty
                                    ? "var(--gold)"
                                    : hasPalpite
                                    ? "var(--bg-overlay)"
                                    : "var(--accent)",
                                color:
                                  state === "saved"
                                    ? "var(--accent)"
                                    : dirty
                                    ? "#fff"
                                    : hasPalpite
                                    ? "var(--text-secondary)"
                                    : "#fff",
                                opacity: state === "saving" ? 0.7 : 1,
                                cursor: state === "saving" ? "not-allowed" : "pointer",
                              }}
                            >
                              {state === "saving" && <Loader2 size={11} className="animate-spin" />}
                              {state === "saved" && <Check size={11} />}
                              {state === "idle" && hasPalpite && !dirty && <Pencil size={11} />}
                              {state === "saving"
                                ? "..."
                                : state === "saved"
                                ? "Salvo"
                                : dirty
                                ? "Atualizar"
                                : hasPalpite
                                ? "Editar"
                                : "Salvar"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Palpites dos membros (encerrado) */}
                      {!isOpen && membersHere.length > 0 && (
                        <div
                          style={{
                            borderTop: "1px solid var(--border-subtle)",
                            backgroundColor: "var(--bg-raised)",
                          }}
                        >
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
                                  style={{
                                    color: isMe ? "var(--accent)" : "var(--text-secondary)",
                                    fontWeight: isMe ? 600 : 400,
                                  }}
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
                          style={{
                            borderTop: "1px solid var(--border-subtle)",
                            backgroundColor: "var(--bg-raised)",
                          }}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
