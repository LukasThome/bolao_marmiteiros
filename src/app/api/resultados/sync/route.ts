import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/role-guard";
import { prisma } from "@/lib/prisma";
import { calcularPontos } from "@/features/boloes/lib/score";
import { normalizeTeamName } from "@/lib/team-aliases";

type SyncFixture = {
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

async function fetchFinishedMatches(dateFrom: string, dateTo: string): Promise<SyncFixture[]> {
  const fdKey = process.env.FOOTBALL_DATA_API_KEY;
  const rapidKey = process.env.RAPIDAPI_KEY;

  if (fdKey) {
    const qs = new URLSearchParams({ season: "2026", dateFrom, dateTo, status: "FINISHED" });
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/WC/matches?${qs}`,
      { headers: { "X-Auth-Token": fdKey } }
    );
    if (res.ok) {
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
  }

  if (rapidKey) {
    const qs = new URLSearchParams({ league: "1", season: "2026", from: dateFrom, to: dateTo });
    const res = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?${qs}`,
      {
        headers: {
          "X-RapidAPI-Key": rapidKey,
          "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
        },
      }
    );
    if (res.ok) {
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
  }

  throw new Error("Nenhuma chave de API configurada (FOOTBALL_DATA_API_KEY ou RAPIDAPI_KEY)");
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rodadaId = typeof body.rodadaId === "string" ? body.rodadaId : null;
  if (!rodadaId) return NextResponse.json({ error: "rodadaId obrigatório" }, { status: 400 });

  const rodada = await prisma.rodada.findUnique({
    where: { id: rodadaId },
    include: { partidas: true, bolao: true },
  });
  if (!rodada) return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });

  const pending = rodada.partidas.filter((p) => p.status !== "FINISHED");
  const alreadyDone = rodada.partidas.length - pending.length;

  if (pending.length === 0) {
    return NextResponse.json({ synced: 0, alreadyDone, notFound: [] });
  }

  // Search window: 7 days before deadline → 14 days after (covers multi-day rounds)
  const deadline = new Date(rodada.deadline);
  const dateFrom = new Date(deadline);
  dateFrom.setDate(dateFrom.getDate() - 7);
  const dateTo = new Date(deadline);
  dateTo.setDate(dateTo.getDate() + 14);

  let apiFixtures: SyncFixture[];
  try {
    apiFixtures = await fetchFinishedMatches(
      dateFrom.toISOString().slice(0, 10),
      dateTo.toISOString().slice(0, 10)
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao buscar resultados";
    return NextResponse.json({ error: message }, { status: 502 });
  }

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

    for (const palpite of palpites) {
      const pontos = calcularPontos(
        { homeScore: palpite.homeScore, awayScore: palpite.awayScore },
        { homeScore, awayScore }
      );
      await prisma.palpite.update({ where: { id: palpite.id }, data: { pontos } });
      await prisma.bolaoMember.updateMany({
        where: { userId: palpite.userId, bolaoId: palpite.partida.rodada.bolao.id },
        data: { totalPts: { increment: pontos } },
      });
    }

    synced++;
  }

  return NextResponse.json({ synced, alreadyDone, notFound });
}
