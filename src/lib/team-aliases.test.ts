import { describe, it, expect } from "vitest";
import { normalizeTeamName } from "@/lib/team-aliases";

describe("normalizeTeamName", () => {
  it("retorna nomes em inglês sem alteração", () => {
    expect(normalizeTeamName("Brazil")).toBe("brazil");
    expect(normalizeTeamName("Argentina")).toBe("argentina");
    expect(normalizeTeamName("Germany")).toBe("germany");
  });

  it("converte nomes em português para o canônico em inglês", () => {
    expect(normalizeTeamName("Brasil")).toBe("brazil");
    expect(normalizeTeamName("Alemanha")).toBe("germany");
    expect(normalizeTeamName("Espanha")).toBe("spain");
    expect(normalizeTeamName("França")).toBe("france");
    expect(normalizeTeamName("Países Baixos")).toBe("netherlands");
    expect(normalizeTeamName("Coreia do Sul")).toBe("south korea");
  });

  it("normaliza variantes da API para o mesmo canônico", () => {
    expect(normalizeTeamName("Korea Republic")).toBe("south korea");
    expect(normalizeTeamName("USA")).toBe("united states");
    expect(normalizeTeamName("Cote d'Ivoire")).toBe("ivory coast");
    expect(normalizeTeamName("IR Iran")).toBe("iran");
    expect(normalizeTeamName("Czechia")).toBe("czech republic");
  });

  it("é case-insensitive", () => {
    expect(normalizeTeamName("BRAZIL")).toBe("brazil");
    expect(normalizeTeamName("brasil")).toBe("brazil");
    expect(normalizeTeamName("Brasil")).toBe("brazil");
  });

  it("remove acentos antes de normalizar", () => {
    expect(normalizeTeamName("Bélgica")).toBe("belgium");
    expect(normalizeTeamName("Suíça")).toBe("switzerland");
    expect(normalizeTeamName("Japão")).toBe("japan");
  });

  it("retorna o nome normalizado quando não há alias", () => {
    expect(normalizeTeamName("New Zealand")).toBe("new zealand");
    expect(normalizeTeamName("Canada")).toBe("canada");
  });
});
