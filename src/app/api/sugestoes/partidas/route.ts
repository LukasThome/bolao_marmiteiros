import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/role-guard";

// Suporte a duas fontes: football-data.org (fd) e API-Football/RapidAPI (rapidapi)

const FD_BASE = "https://api.football-data.org/v4";
const RAPID_BASE = "https://api-football-v1.p.rapidapi.com/v3";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const source = searchParams.get("source") ?? "fd";

  if (source === "fd") {
    return handleFootballData(searchParams);
  }
  return handleRapidApi(searchParams);
}

// --- football-data.org ---

async function handleFootballData(params: URLSearchParams) {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY não configurado" }, { status: 500 });
  }

  const competition = params.get("competition") ?? "WC";
  const stage = params.get("stage");
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  const matchday = params.get("matchday");

  const qs = new URLSearchParams({ season: "2026" });
  if (stage) qs.set("stage", stage);
  if (dateFrom) qs.set("dateFrom", dateFrom);
  if (dateTo) qs.set("dateTo", dateTo);
  if (matchday) qs.set("matchday", matchday);

  const res = await fetch(`${FD_BASE}/competitions/${competition}/matches?${qs}`, {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `football-data.org: ${res.status}` }, { status: 502 });
  }

  const data = await res.json();

  type FdMatch = {
    id: number;
    utcDate: string;
    matchday: number;
    stage: string;
    group: string;
    status: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
  };

  const fixtures = (data.matches as FdMatch[]).map((m) => ({
    id: m.id,
    date: m.utcDate,
    status: m.status,
    round: `Rodada ${m.matchday}`,
    group: m.group?.replace("GROUP_", "Grupo ") ?? "",
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
  }));

  return NextResponse.json({ fixtures, source: "fd" });
}

// --- API-Football / RapidAPI ---

async function handleRapidApi(params: URLSearchParams) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return NextResponse.json({ error: "RAPIDAPI_KEY não configurado" }, { status: 500 });
  }

  const date = params.get("date");
  const league = params.get("league") ?? "71";
  const season = params.get("season") ?? new Date().getFullYear().toString();

  const qs = new URLSearchParams({ league, season });
  if (date) qs.set("date", date);

  const res = await fetch(`${RAPID_BASE}/fixtures?${qs}`, {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `API-Football: ${res.status}` }, { status: 502 });
  }

  const data = await res.json();

  type RapidFixture = {
    fixture: { id: number; date: string; status: { short: string } };
    league: { round: string };
    teams: { home: { name: string }; away: { name: string } };
  };

  const fixtures = (data.response as RapidFixture[]).map((f) => ({
    id: f.fixture.id,
    date: f.fixture.date,
    status: f.fixture.status.short,
    round: f.league.round,
    group: "",
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
  }));

  return NextResponse.json({ fixtures, source: "rapidapi" });
}
