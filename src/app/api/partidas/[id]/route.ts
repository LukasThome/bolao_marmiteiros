import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/role-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { homeScore, awayScore, status } = await req.json();

  const partida = await prisma.partida.update({
    where: { id },
    data: {
      ...(homeScore !== undefined && { homeScore: Number(homeScore) }),
      ...(awayScore !== undefined && { awayScore: Number(awayScore) }),
      ...(status && { status }),
    },
  });

  return NextResponse.json(partida);
}
