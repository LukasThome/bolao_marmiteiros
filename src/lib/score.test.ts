import { describe, it, expect } from "vitest";
import { calcularPontos } from "@/lib/score";

describe("calcularPontos", () => {
  describe("placar exato → 3 pontos", () => {
    it("vitória do mandante", () => {
      expect(calcularPontos({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(3);
    });
    it("empate", () => {
      expect(calcularPontos({ homeScore: 0, awayScore: 0 }, { homeScore: 0, awayScore: 0 })).toBe(3);
    });
    it("vitória do visitante", () => {
      expect(calcularPontos({ homeScore: 1, awayScore: 3 }, { homeScore: 1, awayScore: 3 })).toBe(3);
    });
    it("goleada", () => {
      expect(calcularPontos({ homeScore: 5, awayScore: 0 }, { homeScore: 5, awayScore: 0 })).toBe(3);
    });
  });

  describe("resultado certo, placar errado → 1 ponto", () => {
    it("acertou vitória do mandante", () => {
      expect(calcularPontos({ homeScore: 1, awayScore: 0 }, { homeScore: 3, awayScore: 1 })).toBe(1);
    });
    it("acertou empate", () => {
      expect(calcularPontos({ homeScore: 0, awayScore: 0 }, { homeScore: 2, awayScore: 2 })).toBe(1);
    });
    it("acertou vitória do visitante", () => {
      expect(calcularPontos({ homeScore: 0, awayScore: 2 }, { homeScore: 1, awayScore: 3 })).toBe(1);
    });
  });

  describe("resultado errado → 0 pontos", () => {
    it("chutou vitória, veio derrota", () => {
      expect(calcularPontos({ homeScore: 2, awayScore: 0 }, { homeScore: 0, awayScore: 1 })).toBe(0);
    });
    it("chutou empate, veio vitória do mandante", () => {
      expect(calcularPontos({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 0 })).toBe(0);
    });
    it("chutou derrota, veio empate", () => {
      expect(calcularPontos({ homeScore: 0, awayScore: 1 }, { homeScore: 1, awayScore: 1 })).toBe(0);
    });
    it("placar invertido (visitante vs mandante)", () => {
      expect(calcularPontos({ homeScore: 0, awayScore: 1 }, { homeScore: 1, awayScore: 0 })).toBe(0);
    });
  });
});
