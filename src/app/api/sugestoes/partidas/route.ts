import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/role-guard";

const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return NextResponse.json({ error: "RAPIDAPI_KEY não configurado" }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const league = searchParams.get("league") ?? "71";
  const season = searchParams.get("season") ?? new Date().getFullYear().toString();

  const params = new URLSearchParams({ league, season });
  if (date) params.set("date", date);

  const res = await fetch(`${BASE_URL}/fixtures?${params}`, {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Erro na API-Football" }, { status: 502 });
  }

  const data = await res.json();

  type RawFixture = {
    fixture: { id: number; date: string; status: { short: string } };
    league: { round: string };
    teams: { home: { name: string }; away: { name: string } };
  };

  const fixtures = (data.response as RawFixture[]).map((f) => ({
    id: f.fixture.id,
    date: f.fixture.date,
    status: f.fixture.status.short,
    round: f.league.round,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
  }));

  return NextResponse.json({ fixtures });
}
