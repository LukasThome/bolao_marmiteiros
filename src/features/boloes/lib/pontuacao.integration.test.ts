import { describe, it, expect, vi } from "vitest";
import { calcularPontos } from "@/features/boloes/lib/score";

const mockPalpiteUpdate = vi.fn();
const mockMemberUpdateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    palpite: { update: mockPalpiteUpdate },
    bolaoMember: { updateMany: mockMemberUpdateMany },
  },
}));

const { pontuarPalpites } = await import("@/features/boloes/lib/pontuacao");

const BOLAO_ID = "bolao-1";

function makePalpite(id: string, userId: string, home: number, away: number) {
  return {
    id,
    userId,
    homeScore: home,
    awayScore: away,
    partida: { rodada: { bolao: { id: BOLAO_ID } } },
  };
}

describe("Fluxo de pontuação: integração (lógica)", () => {
  it("Fluxo: palpites → resultado → pontuação correta", async () => {
    // Reseta mocks
    mockPalpiteUpdate.mockReset();
    mockMemberUpdateMany.mockReset();

    // 1. Simula 2 palpites para Brazil 2 × 1 Argentina
    const palpites = [
      makePalpite("p1", "u1", 2, 1), // User 1: acerto exato (3 pts)
      makePalpite("p2", "u2", 1, 1), // User 2: erro (0 pts)
    ];

    // 2. Aplica pontuação
    const resultado = { homeScore: 2, awayScore: 1 };
    await pontuarPalpites(palpites, resultado);

    // 3. Verifica chamadas ao prisma
    expect(mockPalpiteUpdate).toHaveBeenCalledTimes(2);

    // User 1 deve receber 3 pts (acerto exato)
    expect(mockPalpiteUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { pontos: 3 },
    });

    // User 2 deve receber 0 pts (erro)
    expect(mockPalpiteUpdate).toHaveBeenCalledWith({
      where: { id: "p2" },
      data: { pontos: 0 },
    });

    // Verifica incremento de pontos
    expect(mockMemberUpdateMany).toHaveBeenCalledWith({
      where: { userId: "u1", bolaoId: BOLAO_ID },
      data: { totalPts: { increment: 3 } },
    });

    expect(mockMemberUpdateMany).toHaveBeenCalledWith({
      where: { userId: "u2", bolaoId: BOLAO_ID },
      data: { totalPts: { increment: 0 } },
    });
  });

  it("Múltiplos resultados acumulam pontos corretamente", async () => {
    mockPalpiteUpdate.mockReset();
    mockMemberUpdateMany.mockReset();

    // Primeira partida: Brazil 2 × 1 Argentina
    const palpite1 = makePalpite("p1", "u1", 2, 1); // 3 pts
    await pontuarPalpites([palpite1], { homeScore: 2, awayScore: 1 });

    // Segunda partida: France 1 × 0 Germany
    const palpite2 = makePalpite("p2", "u1", 1, 0); // 3 pts
    await pontuarPalpites([palpite2], { homeScore: 1, awayScore: 0 });

    // User 1 deve ter chamadas para +3 e +3 = 6 pts total
    expect(mockMemberUpdateMany).toHaveBeenCalledWith({
      where: { userId: "u1", bolaoId: BOLAO_ID },
      data: { totalPts: { increment: 3 } },
    });

    // Verificar que foi chamado 2 vezes (acumulação)
    const chamadasUser1 = mockMemberUpdateMany.mock.calls.filter(
      (call) => call[0].where.userId === "u1"
    );
    expect(chamadasUser1).toHaveLength(2);
  });

  it("Calcula pontos corretamente em diferentes cenários", () => {
    // Acerto exato
    expect(calcularPontos({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(
      3
    );

    // Acerta resultado (vitória mandante)
    expect(calcularPontos({ homeScore: 3, awayScore: 0 }, { homeScore: 2, awayScore: 1 })).toBe(
      1
    );

    // Acerta resultado (visitante vence)
    expect(calcularPontos({ homeScore: 0, awayScore: 2 }, { homeScore: 1, awayScore: 3 })).toBe(
      1
    );

    // Acerta resultado (empate)
    expect(calcularPontos({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 2 })).toBe(
      1
    );

    // Erra tudo
    expect(calcularPontos({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(
      0
    );
  });
});
