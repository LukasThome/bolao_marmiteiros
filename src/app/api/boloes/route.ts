import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/role-guard";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const boloes = await prisma.bolao.findMany({
      where: { members: { some: { userId: session!.user.id } } },
      include: {
        _count: { select: { members: true } },
        rodadas: { orderBy: { deadline: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(boloes);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const slug = slugify(name);
  const existing = await prisma.bolao.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um bolão com esse nome" }, { status: 409 });
  }

  const bolao = await prisma.bolao.create({
    data: {
      name: name.trim(),
      slug,
      members: { create: { userId: session!.user.id } },
    },
  });

  return NextResponse.json(bolao, { status: 201 });
}
