import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/role-guard";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { bolaoId, name, deadline } = await req.json();

  if (!bolaoId || !name?.trim() || !deadline) {
    return NextResponse.json(
      { error: "bolaoId, name e deadline são obrigatórios" },
      { status: 400 }
    );
  }

  const rodada = await prisma.rodada.create({
    data: {
      bolaoId,
      name: name.trim(),
      deadline: new Date(deadline),
    },
  });

  return NextResponse.json(rodada, { status: 201 });
}
