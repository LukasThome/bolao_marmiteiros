import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const mockRequireAdmin = vi.fn();
const mockPartidaUpdate = vi.fn();
const mockPalpiteFindMany = vi.fn();
const mockPontuarPalpites = vi.fn();

vi.mock("@/lib/role-guard", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    partida: { update: mockPartidaUpdate },
    palpite: { findMany: mockPalpiteFindMany },
  },
}));

vi.mock("@/features/boloes/lib/pontuacao", () => ({
  pontuarPalpites: (...args: unknown[]) => mockPontuarPalpites(...args),
}));

const { PATCH } = await import("./route");

const PARTIDA_ID = "partida-1";

function makeReq(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof PATCH>[0];
}

const ctx = { params: Promise.resolve({ id: PARTIDA_ID }) };

describe("PATCH /api/partidas/[id]", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
    mockPartidaUpdate.mockReset();
    mockPalpiteFindMany.mockReset();
    mockPontuarPalpites.mockReset();
    mockRequireAdmin.mockResolvedValue({ error: null });
    mockPalpiteFindMany.mockResolvedValue([]);
  });

  it("retorna 403 para não-admin e não toca no banco", async () => {
    mockRequireAdmin.mockResolvedValue({
      error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    });

    const res = await PATCH(makeReq({ homeScore: 2, awayScore: 1, status: "FINISHED" }), ctx);

    expect(res.status).toBe(403);
    expect(mockPartidaUpdate).not.toHaveBeenCalled();
    expect(mockPontuarPalpites).not.toHaveBeenCalled();
  });

  it("retorna 400 para placar negativo e não atualiza a partida", async () => {
    const res = await PATCH(makeReq({ homeScore: -1, awayScore: 1 }), ctx);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Placar inválido" });
    expect(mockPartidaUpdate).not.toHaveBeenCalled();
    expect(mockPontuarPalpites).not.toHaveBeenCalled();
  });

  it("retorna 400 para placar não inteiro", async () => {
    const res = await PATCH(makeReq({ homeScore: 1.5, awayScore: 0 }), ctx);

    expect(res.status).toBe(400);
    expect(mockPartidaUpdate).not.toHaveBeenCalled();
  });

  it("pontua os palpites quando o resultado é registrado (FINISHED)", async () => {
    mockPartidaUpdate.mockResolvedValue({
      id: PARTIDA_ID,
      homeScore: 2,
      awayScore: 1,
      status: "FINISHED",
    });
    const palpites = [{ id: "pal-1" }];
    mockPalpiteFindMany.mockResolvedValue(palpites);

    const res = await PATCH(makeReq({ homeScore: 2, awayScore: 1, status: "FINISHED" }), ctx);

    expect(res.status).toBe(200);
    expect(mockPalpiteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { partidaId: PARTIDA_ID } })
    );
    expect(mockPontuarPalpites).toHaveBeenCalledWith(palpites, { homeScore: 2, awayScore: 1 });
  });

  it("não pontua quando a partida ainda não está FINISHED", async () => {
    mockPartidaUpdate.mockResolvedValue({
      id: PARTIDA_ID,
      homeScore: null,
      awayScore: null,
      status: "IN_PROGRESS",
    });

    const res = await PATCH(makeReq({ status: "IN_PROGRESS" }), ctx);

    expect(res.status).toBe(200);
    expect(mockPontuarPalpites).not.toHaveBeenCalled();
  });
});
