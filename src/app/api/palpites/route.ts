import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/role-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { partidaId, homeScore, awayScore } = body;

  if (!partidaId || typeof homeScore !== "number" || typeof awayScore !== "number") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  if (homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: "Placar não pode ser negativo" }, { status: 400 });
  }

  const partida = await prisma.partida.findUnique({
    where: { id: partidaId },
    include: { rodada: true },
  });

  if (!partida) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
  }

  if (new Date() > new Date(partida.rodada.deadline)) {
    return NextResponse.json({ error: "Prazo encerrado" }, { status: 403 });
  }

  const palpite = await prisma.palpite.upsert({
    where: { userId_partidaId: { userId: session!.user.id, partidaId } },
    create: { userId: session!.user.id, partidaId, homeScore, awayScore },
    update: { homeScore, awayScore },
  });

  return NextResponse.json(palpite);
}
