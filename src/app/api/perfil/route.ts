import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/role-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error || !session) return error;

  const body = await req.json().catch(() => ({}));
  const { image } = body as { image?: unknown };

  // Permite string (URL) ou null (remover foto)
  if (image !== null && typeof image !== "string") {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Valida URL quando fornecida
  if (typeof image === "string" && image.trim() !== "") {
    try {
      const url = new URL(image);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return NextResponse.json({ error: "URL deve começar com http:// ou https://" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }
  }

  const novaImagem = typeof image === "string" && image.trim() !== "" ? image.trim() : null;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { image: novaImagem },
    select: { id: true, image: true },
  });

  return NextResponse.json({ image: user.image });
}
