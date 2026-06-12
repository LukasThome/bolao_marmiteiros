import { prisma } from "@/lib/prisma";
import { calcularPontos } from "@/features/boloes/lib/score";
import { registrarAuditoria } from "@/features/boloes/lib/auditoria";

type PalpiteComBolao = {
  id: string;
  userId: string;
  homeScore: number;
  awayScore: number;
  pontos: number | null;
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

    // Idempotente: soma apenas a diferença em relação ao que já estava
    // pontuado, para que re-sync / duplo clique não inflem o total.
    // Pula apenas quando o palpite já foi pontuado com o mesmo valor.
    const delta = pontos - (palpite.pontos ?? 0);
    if (palpite.pontos !== null && delta === 0) continue;

    await prisma.$transaction([
      prisma.palpite.update({ where: { id: palpite.id }, data: { pontos } }),
      prisma.bolaoMember.updateMany({
        where: { userId: palpite.userId, bolaoId },
        data: { totalPts: { increment: delta } },
      }),
    ]);

    // Registra a auditoria
    await registrarAuditoria(
      palpite.userId,
      bolaoId,
      "PALPITE_ACERTADO",
      pontos,
      `${pontos === 10 ? "Acerto exato" : pontos === 5 ? "Acerto de resultado" : "Sem pontos"}`,
      palpite.id,
      palpite.partida.id
    );
  }
}
