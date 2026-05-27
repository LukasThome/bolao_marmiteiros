import { prisma } from "@/lib/prisma";
import { calcularPontos } from "@/features/boloes/lib/score";

type PalpiteComBolao = {
  id: string;
  userId: string;
  homeScore: number;
  awayScore: number;
  partida: { rodada: { bolao: { id: string } } };
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
    await prisma.palpite.update({ where: { id: palpite.id }, data: { pontos } });
    await prisma.bolaoMember.updateMany({
      where: { userId: palpite.userId, bolaoId: palpite.partida.rodada.bolao.id },
      data: { totalPts: { increment: pontos } },
    });
  }
}
