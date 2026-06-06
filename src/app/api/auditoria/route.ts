import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obterHistoricoCompleto, obterHistoricoPontos, verificarSaldoBolao } from "@/features/boloes/lib/auditoria";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const bolaoSlug = searchParams.get("bolao");
  const tipo = searchParams.get("tipo"); // VERIFICACAO ou HISTORICO
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const queryUserId = searchParams.get("userId");

  if (!bolaoSlug) {
    return NextResponse.json({ error: "Parâmetro 'bolao' obrigatório" }, { status: 400 });
  }

  const bolao = await prisma.bolao.findUnique({
    where: { slug: bolaoSlug },
  });

  if (!bolao) {
    return NextResponse.json({ error: "Bolão não encontrado" }, { status: 404 });
  }

  // Verifica se o usuário é membro ou admin
  const membro = await prisma.bolaoMember.findUnique({
    where: { userId_bolaoId: { userId: session.user.id, bolaoId: bolao.id } },
  });

  if (!membro && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Determina qual userId visualizar
  const viewingUserId = queryUserId || session.user.id;

  // Se está visualizando outro usuário, apenas admin pode
  if (viewingUserId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (tipo === "VERIFICACAO") {
    const verificacao = await verificarSaldoBolao(bolao.id);
    return NextResponse.json(verificacao);
  }

  // Histórico do usuário especificado (com paginação)
  const { registros, total } = await obterHistoricoPontos(
    viewingUserId,
    bolao.id,
    limit,
    offset
  );

  return NextResponse.json({ registros, total });
}
