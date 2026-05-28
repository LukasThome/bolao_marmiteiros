import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/role-guard";
import { prisma } from "@/lib/prisma";
import { getLockTime } from "@/features/boloes/lib/lockTime";

type PalpiteInput = { partidaId: string; homeScore: number; awayScore: number };

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  if (!Array.isArray(body.palpites)) {
    return NextResponse.json({ error: "palpites deve ser um array" }, { status: 400 });
  }

  const inputs: PalpiteInput[] = body.palpites;
  if (inputs.length === 0) {
    return NextResponse.json({ saved: 0, errors: [] });
  }

  const partidaIds = inputs.map((p) => p.partidaId);
  const partidas = await prisma.partida.findMany({
    where: { id: { in: partidaIds } },
    include: { rodada: { include: { partidas: { select: { scheduledAt: true } } } } },
  });

  const partidaMap = Object.fromEntries(partidas.map((p) => [p.id, p]));
  const now = new Date();

  const errors: { partidaId: string; error: string }[] = [];
  let saved = 0;

  for (const input of inputs) {
    const { partidaId, homeScore, awayScore } = input;

    if (typeof homeScore !== "number" || typeof awayScore !== "number" || homeScore < 0 || awayScore < 0) {
      errors.push({ partidaId, error: "Placar inválido" });
      continue;
    }

    const partida = partidaMap[partidaId];
    if (!partida) {
      errors.push({ partidaId, error: "Partida não encontrada" });
      continue;
    }

    const lockTime = getLockTime({ deadline: partida.rodada.deadline, partidas: partida.rodada.partidas });
    if (now > lockTime) {
      errors.push({ partidaId, error: "Prazo encerrado" });
      continue;
    }

    await prisma.palpite.upsert({
      where: { userId_partidaId: { userId: session!.user.id, partidaId } },
      create: { userId: session!.user.id, partidaId, homeScore, awayScore },
      update: { homeScore, awayScore },
    });
    saved++;
  }

  return NextResponse.json({ saved, errors });
}
