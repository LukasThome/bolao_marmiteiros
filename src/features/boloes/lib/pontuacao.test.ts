import { describe, it, expect, vi, beforeEach } from "vitest";
import { calcularPontos } from "@/features/boloes/lib/score";

const mockPalpiteUpdate = vi.fn();
const mockMemberUpdateMany = vi.fn();
const mockMemberFindUnique = vi.fn();
const mockAuditoriaCreate = vi.fn();
const mockAuditoriaFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    palpite: { update: mockPalpiteUpdate },
    bolaoMember: { updateMany: mockMemberUpdateMany, findUnique: mockMemberFindUnique },
    auditoriaPontos: { create: mockAuditoriaCreate, findFirst: mockAuditoriaFindFirst },
    $transaction: (ops: unknown[]) => Promise.all(ops),
  },
}));

const { pontuarPalpites } = await import("@/features/boloes/lib/pontuacao");

const BOLAO_ID = "bolao-1";

function makePalpite(
  id: string,
  userId: string,
  home: number,
  away: number,
  pontos: number | null = null
) {
  return {
    id,
    userId,
    homeScore: home,
    awayScore: away,
    pontos,
    partida: {
      id: `partida-${id}`,
      rodada: { bolao: { id: BOLAO_ID } }
    },
  };
}

describe("pontuarPalpites", () => {
  beforeEach(() => {
    mockPalpiteUpdate.mockReset();
    mockMemberUpdateMany.mockReset();
    mockMemberFindUnique.mockReset();
    mockAuditoriaCreate.mockReset();
    mockAuditoriaFindFirst.mockReset();
    // Configurar retorno padrão para o mock de findUnique
    mockMemberFindUnique.mockResolvedValue({ totalPts: 0 });
    mockAuditoriaCreate.mockResolvedValue({ id: "audit-1" });
    mockAuditoriaFindFirst.mockResolvedValue(null);
  });

  describe("Cálculo de pontos", () => {
    it("atribui 10 pontos para placar exato", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 2, 1)], { homeScore: 2, awayScore: 1 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 10 },
      });
    });

    it("atribui 5 pontos para resultado correto sem placar exato", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 3, 0)], { homeScore: 2, awayScore: 1 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 5 },
      });
    });

    it("atribui 0 pontos para resultado errado", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 0, 2)], { homeScore: 2, awayScore: 1 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 0 },
      });
    });
  });

  describe("Cenários de vitória e empate", () => {
    it("acerta vitória do mandante", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 2, 0)], { homeScore: 3, awayScore: 1 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 5 },
      });
    });

    it("acerta vitória do visitante", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 0, 2)], { homeScore: 1, awayScore: 3 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 5 },
      });
    });

    it("acerta empate", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 1, 1)], { homeScore: 2, awayScore: 2 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 5 },
      });
    });

    it("erra vitória do mandante palpitando empate", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 1, 1)], { homeScore: 2, awayScore: 1 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 0 },
      });
    });

    it("erra resultado palpitando vitória quando é derrota", async () => {
      await pontuarPalpites([makePalpite("p1", "u1", 3, 1)], { homeScore: 1, awayScore: 2 });
      expect(mockPalpiteUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { pontos: 0 },
      });
    });
  });

  describe("Fluxo de múltiplos palpites", () => {
    it("processa múltiplos palpites", async () => {
      await pontuarPalpites(
        [makePalpite("p1", "u1", 2, 1), makePalpite("p2", "u2", 0, 0)],
        { homeScore: 2, awayScore: 1 }
      );
      expect(mockPalpiteUpdate).toHaveBeenCalledTimes(2);
      expect(mockMemberUpdateMany).toHaveBeenCalledTimes(2);
    });

    it("acumula pontos de múltiplos palpites do mesmo usuário", async () => {
      // Primeiro palpite: 10 pts
      await pontuarPalpites([makePalpite("p1", "u1", 2, 1)], { homeScore: 2, awayScore: 1 });
      // Segundo palpite: 10 pts
      await pontuarPalpites([makePalpite("p2", "u1", 1, 0)], { homeScore: 1, awayScore: 0 });

      // Verificar que foram feitas 2 chamadas de incremento para o mesmo usuário
      const chamadasUser1 = mockMemberUpdateMany.mock.calls.filter(
        (call) => call[0].where.userId === "u1"
      );
      expect(chamadasUser1).toHaveLength(2);
      expect(chamadasUser1[0][0].data.totalPts.increment).toBe(10);
      expect(chamadasUser1[1][0].data.totalPts.increment).toBe(10);
    });

    it("não chama prisma quando lista está vazia", async () => {
      await pontuarPalpites([], { homeScore: 1, awayScore: 0 });
      expect(mockPalpiteUpdate).not.toHaveBeenCalled();
      expect(mockMemberUpdateMany).not.toHaveBeenCalled();
    });
  });

  describe("Cálculo de pontos direto", () => {
    it("calcula pontos corretamente em diferentes cenários", () => {
      expect(calcularPontos({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(
        10
      );
      expect(calcularPontos({ homeScore: 3, awayScore: 0 }, { homeScore: 2, awayScore: 1 })).toBe(
        5
      );
      expect(calcularPontos({ homeScore: 0, awayScore: 2 }, { homeScore: 1, awayScore: 3 })).toBe(
        5
      );
      expect(calcularPontos({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 2 })).toBe(
        5
      );
      expect(calcularPontos({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(
        0
      );
    });
  });
});
