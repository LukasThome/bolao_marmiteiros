import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/role-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const rodada = await prisma.rodada.findUnique({
    where: { id },
    include: {
      bolao: true,
      partidas: {
        orderBy: { createdAt: "asc" },
        include: {
          palpites: {
            where: { userId: session!.user.id },
            take: 1,
          },
        },
      },
    },
  });

  if (!rodada) {
    return NextResponse.json({ error: "Rodada não encontrada" }, { status: 404 });
  }

  return NextResponse.json(rodada);
}
