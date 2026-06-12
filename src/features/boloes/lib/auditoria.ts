import { prisma } from "@/lib/prisma";

type RegistrarAuditoriaParams = {
  userId: string;
  bolaoId: string;
  tipo: "PALPITE_ACERTADO" | "AJUSTE_MANUAL" | "REVERSAO";
  /** Movimento aplicado ao saldo (delta). Ex: +10 ao acertar, -3 ao reverter. */
  movimento: number;
  /** Saldo do membro ANTES deste movimento (capturado antes de incrementar). */
  saldoAntes: number;
  descricao?: string;
  palpiteId?: string;
  partidaId?: string;
};

/**
 * Registra (ou atualiza) o lançamento de auditoria de um movimento de pontos.
 *
 * - `pontos` guarda o **movimento** (delta), e `saldoDepois = saldoAntes + movimento`,
 *   formando um extrato fiel onde a soma dos movimentos = total do membro.
 * - Quando há `palpiteId`, faz **upsert**: re-pontuar o mesmo palpite atualiza o
 *   lançamento existente em vez de criar um duplicado.
 */
export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  const { userId, bolaoId, tipo, movimento, saldoAntes, descricao, palpiteId, partidaId } = params;
  const saldoDepois = saldoAntes + movimento;

  const data = {
    userId,
    bolaoId,
    tipo,
    pontos: movimento,
    saldoAntes,
    saldoDepois,
    descricao,
    palpiteId,
    partidaId,
  };

  // Dedup por palpite: atualiza o lançamento existente se já houver
  if (palpiteId) {
    const existente = await prisma.auditoriaPontos.findFirst({ where: { palpiteId } });
    if (existente) {
      return prisma.auditoriaPontos.update({ where: { id: existente.id }, data });
    }
  }

  return prisma.auditoriaPontos.create({ data });
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
