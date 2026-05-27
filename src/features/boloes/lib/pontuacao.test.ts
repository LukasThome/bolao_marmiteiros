import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("pontuarPalpites", () => {
  beforeEach(() => {
    mockPalpiteUpdate.mockReset();
    mockMemberUpdateMany.mockReset();
  });

  it("atribui 3 pontos para placar exato", async () => {
    await pontuarPalpites([makePalpite("p1", "u1", 2, 1)], { homeScore: 2, awayScore: 1 });
    expect(mockPalpiteUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { pontos: 3 } });
    expect(mockMemberUpdateMany).toHaveBeenCalledWith({
      where: { userId: "u1", bolaoId: BOLAO_ID },
      data: { totalPts: { increment: 3 } },
    });
  });

  it("atribui 1 ponto para resultado correto sem placar exato", async () => {
    await pontuarPalpites([makePalpite("p1", "u1", 3, 0)], { homeScore: 2, awayScore: 1 });
    expect(mockPalpiteUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { pontos: 1 } });
  });

  it("atribui 0 pontos para resultado errado", async () => {
    await pontuarPalpites([makePalpite("p1", "u1", 0, 2)], { homeScore: 2, awayScore: 1 });
    expect(mockPalpiteUpdate).toHaveBeenCalledWith({ where: { id: "p1" }, data: { pontos: 0 } });
  });

  it("processa múltiplos palpites", async () => {
    await pontuarPalpites(
      [makePalpite("p1", "u1", 2, 1), makePalpite("p2", "u2", 0, 0)],
      { homeScore: 2, awayScore: 1 }
    );
    expect(mockPalpiteUpdate).toHaveBeenCalledTimes(2);
    expect(mockMemberUpdateMany).toHaveBeenCalledTimes(2);
  });

  it("não chama prisma quando lista está vazia", async () => {
    await pontuarPalpites([], { homeScore: 1, awayScore: 0 });
    expect(mockPalpiteUpdate).not.toHaveBeenCalled();
    expect(mockMemberUpdateMany).not.toHaveBeenCalled();
  });
});
