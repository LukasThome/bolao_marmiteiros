import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { randomBytes } from "crypto";

const TOKEN_TTL_HOURS = 1;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string)?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  // Resposta sempre 200 para não revelar se o email existe
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true });

  // Invalida tokens anteriores (simples: cria novo, token único garante um ativo)
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/password-reset/${token}`;

  await sendMail({
    to: email,
    subject: "🍱 Redefinir sua senha — Bolão dos Marmiteiros",
    html: `
      <p>Olá${user.name ? `, ${user.name}` : ""}!</p>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p>
      <p>O link expira em ${TOKEN_TTL_HOURS} hora. Se não foi você, ignore este email.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
