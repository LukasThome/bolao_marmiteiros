import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRodadaFindUnique = vi.fn();
const mockRodadaFindMany = vi.fn();
const mockPartidaUpdate = vi.fn();
const mockPalpiteFindMany = vi.fn();
const mockPontuarPalpites = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rodada: { findUnique: mockRodadaFindUnique, findMany: mockRodadaFindMany },
    partida: { update: mockPartidaUpdate },
    palpite: { findMany: mockPalpiteFindMany },
  },
}));

vi.mock("@/features/boloes/lib/pontuacao", () => ({
  pontuarPalpites: mockPontuarPalpites,
}));

const { sincronizarRodada, sincronizarTodasRodadas, fetchFinishedMatches } = await import(
  "@/features/boloes/lib/syncResultados"
);

function mockFetchOnce(matches: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matches }),
    })
  );
}

function fdMatch(home: string, away: string, h: number, a: number) {
  return {
    status: "FINISHED",
    homeTeam: { name: home },
    awayTeam: { name: away },
    score: { fullTime: { home: h, away: a } },
  };
}

describe("syncResultados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FOOTBALL_DATA_API_KEY", "fake-key");
    vi.stubEnv("RAPIDAPI_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("fetchFinishedMatches", () => {
    it("mapeia e filtra apenas jogos finalizados com placar", async () => {
      mockFetchOnce([
        fdMatch("Mexico", "South Africa", 2, 0),
        { status: "TIMED", homeTeam: { name: "A" }, awayTeam: { name: "B" }, score: { fullTime: { home: null, away: null } } },
      ]);

      const result = await fetchFinishedMatches("2026-06-04", "2026-06-25");

      expect(result).toEqual([{ homeTeam: "Mexico", awayTeam: "South Africa", homeScore: 2, awayScore: 0 }]);
    });

    it("lança erro quando nenhuma chave de API está configurada", async () => {
      vi.stubEnv("FOOTBALL_DATA_API_KEY", "");
      vi.stubEnv("RAPIDAPI_KEY", "");
      await expect(fetchFinishedMatches("2026-06-04", "2026-06-25")).rejects.toThrow(
        /Nenhuma chave de API/
      );
    });

    it("usa o fallback do RapidAPI quando football-data falha", async () => {
      vi.stubEnv("FOOTBALL_DATA_API_KEY", "fd-key");
      vi.stubEnv("RAPIDAPI_KEY", "rapid-key");

      const fetchMock = vi
        .fn()
        // 1ª chamada (football-data) falha
        .mockResolvedValueOnce({ ok: false })
        // 2ª chamada (RapidAPI) retorna formato próprio
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: [
              {
                fixture: { status: { short: "FT" } },
                teams: { home: { name: "Mexico" }, away: { name: "South Africa" } },
                goals: { home: 2, away: 0 },
              },
              {
                fixture: { status: { short: "1H" } },
                teams: { home: { name: "X" }, away: { name: "Y" } },
                goals: { home: null, away: null },
              },
            ],
          }),
        });
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchFinishedMatches("2026-06-04", "2026-06-25");

      expect(result).toEqual([{ homeTeam: "Mexico", awayTeam: "South Africa", homeScore: 2, awayScore: 0 }]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("sincronizarRodada", () => {
    it("atualiza placar e pontua palpites para partida encontrada", async () => {
      mockRodadaFindUnique.mockResolvedValue({
        id: "r1",
        deadline: new Date("2026-06-11T19:00:00Z"),
        partidas: [
          { id: "p1", homeTeam: "Mexico", awayTeam: "South Africa", status: "SCHEDULED" },
        ],
      });
      mockFetchOnce([fdMatch("Mexico", "South Africa", 2, 0)]);
      mockPalpiteFindMany.mockResolvedValue([{ id: "pal1" }]);

      const result = await sincronizarRodada("r1");

      expect(result.synced).toBe(1);
      expect(result.alreadyDone).toBe(0);
      expect(result.notFound).toEqual([]);
      expect(mockPartidaUpdate).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { homeScore: 2, awayScore: 0, status: "FINISHED" },
      });
      expect(mockPontuarPalpites).toHaveBeenCalledWith([{ id: "pal1" }], { homeScore: 2, awayScore: 0 });
    });

    it("reporta partidas sem resultado na API como notFound", async () => {
      mockRodadaFindUnique.mockResolvedValue({
        id: "r1",
        deadline: new Date("2026-06-11T19:00:00Z"),
        partidas: [{ id: "p1", homeTeam: "Brazil", awayTeam: "Croatia", status: "SCHEDULED" }],
      });
      mockFetchOnce([fdMatch("Mexico", "South Africa", 2, 0)]);

      const result = await sincronizarRodada("r1");

      expect(result.synced).toBe(0);
      expect(result.notFound).toEqual(["Brazil × Croatia"]);
      expect(mockPartidaUpdate).not.toHaveBeenCalled();
    });

    it("não chama a API quando todas as partidas já estão finalizadas", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      mockRodadaFindUnique.mockResolvedValue({
        id: "r1",
        deadline: new Date("2026-06-11T19:00:00Z"),
        partidas: [{ id: "p1", homeTeam: "Mexico", awayTeam: "South Africa", status: "FINISHED" }],
      });

      const result = await sincronizarRodada("r1");

      expect(result).toEqual({ synced: 0, alreadyDone: 1, notFound: [] });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("lança erro quando a rodada não existe", async () => {
      mockRodadaFindUnique.mockResolvedValue(null);
      await expect(sincronizarRodada("inexistente")).rejects.toThrow("Rodada não encontrada");
    });
  });

  describe("sincronizarTodasRodadas", () => {
    it("sincroniza cada rodada elegível e soma o total", async () => {
      mockRodadaFindMany.mockResolvedValue([
        { id: "r1", name: "Rodada 1" },
        { id: "r2", name: "Rodada 2" },
      ]);
      // Cada rodada tem 1 partida que casa com a API
      mockRodadaFindUnique
        .mockResolvedValueOnce({
          id: "r1",
          deadline: new Date("2026-06-11T19:00:00Z"),
          partidas: [{ id: "p1", homeTeam: "Mexico", awayTeam: "South Africa", status: "SCHEDULED" }],
        })
        .mockResolvedValueOnce({
          id: "r2",
          deadline: new Date("2026-06-18T19:00:00Z"),
          partidas: [{ id: "p2", homeTeam: "Brazil", awayTeam: "Croatia", status: "SCHEDULED" }],
        });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            matches: [fdMatch("Mexico", "South Africa", 2, 0), fdMatch("Brazil", "Croatia", 1, 1)],
          }),
        })
      );
      mockPalpiteFindMany.mockResolvedValue([]);

      const result = await sincronizarTodasRodadas(new Date("2026-06-20T00:00:00Z"));

      expect(result.totalSynced).toBe(2);
      expect(result.rodadas).toHaveLength(2);
      expect(result.rodadas[0]).toMatchObject({ rodadaId: "r1", nome: "Rodada 1", synced: 1 });
    });

    it("não falha a sincronização toda se uma rodada der erro", async () => {
      mockRodadaFindMany.mockResolvedValue([{ id: "r1", name: "Rodada 1" }]);
      mockRodadaFindUnique.mockResolvedValue(null); // faz sincronizarRodada lançar

      const result = await sincronizarTodasRodadas(new Date());

      expect(result.totalSynced).toBe(0);
      expect(result.rodadas[0]).toMatchObject({ rodadaId: "r1", synced: 0 });
    });

    it("retorna vazio quando não há rodadas elegíveis", async () => {
      mockRodadaFindMany.mockResolvedValue([]);
      const result = await sincronizarTodasRodadas(new Date());
      expect(result).toEqual({ rodadas: [], totalSynced: 0 });
    });
  });
});
