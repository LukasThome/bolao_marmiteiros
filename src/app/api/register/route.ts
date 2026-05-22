import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = (body?.name as string)?.trim();
  const email = (body?.email as string)?.trim().toLowerCase();
  const password = body?.password as string;

  if (!email || !password) {
    return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  await prisma.user.create({
    data: { email, name: name || null, passwordHash },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
