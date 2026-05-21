import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/role-guard";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { rodadaId, homeTeam, awayTeam } = await req.json();

  if (!rodadaId || !homeTeam?.trim() || !awayTeam?.trim()) {
    return NextResponse.json(
      { error: "rodadaId, homeTeam e awayTeam são obrigatórios" },
      { status: 400 }
    );
  }

  const partida = await prisma.partida.create({
    data: {
      rodadaId,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
    },
  });

  return NextResponse.json(partida, { status: 201 });
}
