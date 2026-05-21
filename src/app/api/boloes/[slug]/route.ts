import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/role-guard";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { slug } = await params;

  const bolao = await prisma.bolao.findUnique({
    where: { slug },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { totalPts: "desc" },
      },
      rodadas: { orderBy: { deadline: "asc" } },
    },
  });

  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado" }, { status: 404 });
  }

  return NextResponse.json(bolao);
}
