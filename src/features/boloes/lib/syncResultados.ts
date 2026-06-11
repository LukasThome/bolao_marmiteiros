import { prisma } from "@/lib/prisma";
import { normalizeTeamName } from "@/lib/team-aliases";
import { pontuarPalpites } from "@/features/boloes/lib/pontuacao";

export type SyncFixture = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
};

type FdMatch = {
  status: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: { fullTime: { home: number | null; away: number | null } };
};

type RapidFixture = {
  fixture: { status: { short: string } };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
};

const FD_API_URL = new URL("https://api.football-data.org/v4/competitions/WC/matches");
const RAPID_API_URL = new URL("https://api-football-v1.p.rapidapi.com/v3/fixtures");

async function fetchFromFootballData(
  dateFrom: string,
  dateTo: string,
  apiKey: string
): Promise<SyncFixture[] | null> {
  const url = new URL(FD_API_URL.toString());
  url.searchParams.set("season", "2026");
  url.searchParams.set("dateFrom", dateFrom);
  url.searchParams.set("dateTo", dateTo);
  url.searchParams.set("status", "FINISHED");

  const res = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
  if (!res.ok) return null;

  const data = await res.json();
  return ((data.matches ?? []) as FdMatch[])
    .filter((m) => m.status === "FINISHED" && m.score?.fullTime?.home !== null)
    .map((m) => ({
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score.fullTime.home ?? 0,
      awayScore: m.score.fullTime.away ?? 0,
    }));
}

async function fetchFromRapidAPI(
  dateFrom: string,
  dateTo: string,
  apiKey: string
): Promise<SyncFixture[] | null> {
  const url = new URL(RAPID_API_URL.toString());
  url.searchParams.set("league", "1");
  url.searchParams.set("season", "2026");
  url.searchParams.set("from", dateFrom);
  url.searchParams.set("to", dateTo);

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    },
  });
  if (!res.ok) return null;

  const data = await res.json();
  return ((data.response ?? []) as RapidFixture[])
    .filter((f) => f.fixture?.status?.short === "FT" && f.goals?.home !== null)
    .map((f) => ({
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeScore: f.goals.home ?? 0,
      awayScore: f.goals.away ?? 0,
    }));
}

export async function fetchFinishedMatches(dateFrom: string, dateTo: string): Promise<SyncFixture[]> {
  const fdKey = process.env.FOOTBALL_DATA_API_KEY;
  const rapidKey = process.env.RAPIDAPI_KEY;

  if (fdKey) {
    const result = await fetchFromFootballData(dateFrom, dateTo, fdKey);
    if (result) return result;
  }

  if (rapidKey) {
    const result = await fetchFromRapidAPI(dateFrom, dateTo, rapidKey);
    if (result) return result;
  }

  throw new Error("Nenhuma chave de API configurada (FOOTBALL_DATA_API_KEY ou RAPIDAPI_KEY)");
}

export type SyncRodadaResult = {
  synced: number;
  alreadyDone: number;
  notFound: string[];
};

/**
 * Sincroniza os resultados das partidas pendentes de uma rodada,
 * atualizando placares e pontuando os palpites. Reutilizável tanto
 * pela rota admin quanto pelo cron automático.
 */
export async function sincronizarRodada(rodadaId: string): Promise<SyncRodadaResult> {
  const rodada = await prisma.rodada.findUnique({
    where: { id: rodadaId },
    include: { partidas: true, bolao: true },
  });
  if (!rodada) throw new Error("Rodada não encontrada");

  const pending = rodada.partidas.filter((p) => p.status !== "FINISHED");
  const alreadyDone = rodada.partidas.length - pending.length;

  if (pending.length === 0) {
    return { synced: 0, alreadyDone, notFound: [] };
  }

  // Janela de busca: 7 dias antes do deadline → 14 dias depois (cobre rodadas multi-dia)
  const deadline = new Date(rodada.deadline);
  const dateFrom = new Date(deadline);
  dateFrom.setDate(dateFrom.getDate() - 7);
  const dateTo = new Date(deadline);
  dateTo.setDate(dateTo.getDate() + 14);

  const apiFixtures = await fetchFinishedMatches(
    dateFrom.toISOString().slice(0, 10),
    dateTo.toISOString().slice(0, 10)
  );

  let synced = 0;
  const notFound: string[] = [];

  for (const partida of pending) {
    const match = apiFixtures.find(
      (f) =>
        normalizeTeamName(f.homeTeam) === normalizeTeamName(partida.homeTeam) &&
        normalizeTeamName(f.awayTeam) === normalizeTeamName(partida.awayTeam)
    );

    if (!match) {
      notFound.push(`${partida.homeTeam} × ${partida.awayTeam}`);
      continue;
    }

    const { homeScore, awayScore } = match;

    await prisma.partida.update({
      where: { id: partida.id },
      data: { homeScore, awayScore, status: "FINISHED" },
    });

    const palpites = await prisma.palpite.findMany({
      where: { partidaId: partida.id },
      include: { partida: { include: { rodada: { include: { bolao: true } } } } },
    });

    await pontuarPalpites(palpites, { homeScore, awayScore });
    synced++;
  }

  return { synced, alreadyDone, notFound };
}

export type SyncTodasResult = {
  rodadas: { rodadaId: string; nome: string; synced: number; notFound: number }[];
  totalSynced: number;
};

/**
 * Sincroniza todas as rodadas que já começaram (deadline no passado) e
 * ainda têm partidas pendentes. Usado pelo cron automático.
 */
// Intervalo mínimo entre sincronizações sob demanda (protege o rate limit da API)
export const AUTO_SYNC_THROTTLE_MS = 2 * 60 * 1000; // 2 minutos
const SYNC_STATE_KEY = "resultados";

export type SyncComThrottleResult = SyncTodasResult & { skipped: boolean };

/**
 * Sincroniza com throttle: só chama a API se passou tempo suficiente desde a
 * última sincronização. Usado pelo auto-sync disparado ao abrir a tela de
 * pontuação, evitando estourar o rate limit da API com vários acessos.
 *
 * O timestamp é gravado ANTES de sincronizar para minimizar a janela em que
 * acessos concorrentes disparem a API ao mesmo tempo.
 */
export async function sincronizarComThrottle(
  now: Date = new Date()
): Promise<SyncComThrottleResult> {
  const state = await prisma.syncState.findUnique({ where: { key: SYNC_STATE_KEY } });

  if (state && now.getTime() - state.lastSyncAt.getTime() < AUTO_SYNC_THROTTLE_MS) {
    return { skipped: true, rodadas: [], totalSynced: 0 };
  }

  await prisma.syncState.upsert({
    where: { key: SYNC_STATE_KEY },
    create: { key: SYNC_STATE_KEY, lastSyncAt: now },
    update: { lastSyncAt: now },
  });

  const result = await sincronizarTodasRodadas(now);
  return { ...result, skipped: false };
}

export async function sincronizarTodasRodadas(now: Date = new Date()): Promise<SyncTodasResult> {
  const rodadas = await prisma.rodada.findMany({
    where: {
      deadline: { lte: now },
      partidas: { some: { status: { not: "FINISHED" } } },
    },
    select: { id: true, name: true },
  });

  const resultados: SyncTodasResult["rodadas"] = [];
  let totalSynced = 0;

  for (const r of rodadas) {
    try {
      const { synced, notFound } = await sincronizarRodada(r.id);
      resultados.push({ rodadaId: r.id, nome: r.name, synced, notFound: notFound.length });
      totalSynced += synced;
    } catch {
      resultados.push({ rodadaId: r.id, nome: r.name, synced: 0, notFound: 0 });
    }
  }

  return { rodadas: resultados, totalSynced };
}
