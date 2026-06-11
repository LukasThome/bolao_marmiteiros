import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/role-guard";
import { pontuarPalpites } from "@/features/boloes/lib/pontuacao";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { homeScore, awayScore, status } = await req.json();

  const home = homeScore !== undefined ? Number(homeScore) : undefined;
  const away = awayScore !== undefined ? Number(awayScore) : undefined;

  if (
    (home !== undefined && (!Number.isInteger(home) || home < 0)) ||
    (away !== undefined && (!Number.isInteger(away) || away < 0))
  ) {
    return NextResponse.json({ error: "Placar inválido" }, { status: 400 });
  }

  const partida = await prisma.partida.update({
    where: { id },
    data: {
      ...(home !== undefined && { homeScore: home }),
      ...(away !== undefined && { awayScore: away }),
      ...(status && { status }),
    },
  });

  // Quando o resultado é registrado, pontua os palpites (idempotente).
  if (
    partida.status === "FINISHED" &&
    partida.homeScore !== null &&
    partida.awayScore !== null
  ) {
    const palpites = await prisma.palpite.findMany({
      where: { partidaId: partida.id },
      include: { partida: { include: { rodada: { include: { bolao: true } } } } },
    });
    await pontuarPalpites(palpites, {
      homeScore: partida.homeScore,
      awayScore: partida.awayScore,
    });
  }

  return NextResponse.json(partida);
}
