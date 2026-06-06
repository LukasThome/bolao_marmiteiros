import { prisma } from "@/lib/prisma";
import { calcularPontos } from "@/features/boloes/lib/score";
import { registrarAuditoria } from "@/features/boloes/lib/auditoria";

type PalpiteComBolao = {
  id: string;
  userId: string;
  homeScore: number;
  awayScore: number;
  partida: { id: string; rodada: { bolao: { id: string } } };
};

export async function pontuarPalpites(
  palpites: PalpiteComBolao[],
  resultado: { homeScore: number; awayScore: number }
): Promise<void> {
  for (const palpite of palpites) {
    const pontos = calcularPontos(
      { homeScore: palpite.homeScore, awayScore: palpite.awayScore },
      resultado
    );
    const bolaoId = palpite.partida.rodada.bolao.id;

    await prisma.palpite.update({ where: { id: palpite.id }, data: { pontos } });
    await prisma.bolaoMember.updateMany({
      where: { userId: palpite.userId, bolaoId },
      data: { totalPts: { increment: pontos } },
    });

    // Registra a auditoria
    await registrarAuditoria(
      palpite.userId,
      bolaoId,
      "PALPITE_ACERTADO",
      pontos,
      `${pontos === 3 ? "Acerto exato" : pontos === 1 ? "Acerto de resultado" : "Sem pontos"}`,
      palpite.id,
      palpite.partida.id
    );
  }
}
