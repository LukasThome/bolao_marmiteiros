import { prisma } from "@/lib/prisma";

export async function registrarAuditoria(
  userId: string,
  bolaoId: string,
  tipo: "PALPITE_ACERTADO" | "AJUSTE_MANUAL" | "REVERSAO",
  pontos: number,
  descricao?: string,
  palpiteId?: string,
  partidaId?: string
) {
  // Busca o saldo atual do membro antes da transação
  const memberAntes = await prisma.bolaoMember.findUnique({
    where: { userId_bolaoId: { userId, bolaoId } },
  });

  const saldoAntes = memberAntes?.totalPts ?? 0;
  const saldoDepois = saldoAntes + pontos;

  // Registra a auditoria
  return prisma.auditoriaPontos.create({
    data: {
      userId,
      bolaoId,
      tipo,
      pontos,
      saldoAntes,
      saldoDepois,
      descricao,
      palpiteId,
      partidaId,
    },
  });
}

export async function obterHistoricoPontos(
  userId: string,
  bolaoId: string,
  limit: number = 50,
  offset: number = 0
) {
  const registros = await prisma.auditoriaPontos.findMany({
    where: { userId, bolaoId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.auditoriaPontos.count({
    where: { userId, bolaoId },
  });

  return { registros, total };
}

export async function obterHistoricoCompleto(bolaoId: string) {
  return prisma.auditoriaPontos.findMany({
    where: { bolaoId },
    include: { user: true },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function verificarSaldoBolao(bolaoId: string) {
  const members = await prisma.bolaoMember.findMany({
    where: { bolaoId },
    include: { user: true },
  });

  const verificacao = await Promise.all(
    members.map(async (member) => {
      const { registros } = await obterHistoricoPontos(member.userId, bolaoId, 1000);

      // Calcula o saldo esperado a partir do histórico
      let saldoEsperado = 0;
      for (const reg of registros) {
        saldoEsperado += reg.pontos;
      }

      return {
        userId: member.userId,
        nomeUsuario: member.user.name || "Anônimo",
        saldoAtual: member.totalPts,
        saldoEsperado,
        diferenca: member.totalPts - saldoEsperado,
        estaCorreto: member.totalPts === saldoEsperado,
      };
    })
  );

  return verificacao;
}
