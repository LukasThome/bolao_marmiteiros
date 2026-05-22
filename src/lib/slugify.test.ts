import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("converte para minúsculas", () => {
    expect(slugify("Brasileirão")).toBe("brasileirao");
  });

  it("substitui espaços por hífens", () => {
    expect(slugify("Serie A")).toBe("serie-a");
  });

  it("remove acentos", () => {
    expect(slugify("São Paulo")).toBe("sao-paulo");
  });

  it("remove cedilha e til", () => {
    expect(slugify("Nação FC")).toBe("nacao-fc");
  });

  it("remove caracteres especiais", () => {
    expect(slugify("Copa do Brasil!")).toBe("copa-do-brasil");
  });

  it("não deixa hífen no início ou fim", () => {
    expect(slugify("  espaços nas bordas  ")).toBe("espacos-nas-bordas");
  });

  it("trata sequências de espaços como um único hífen", () => {
    expect(slugify("Série  A")).toBe("serie-a");
  });

  it("trata string já no formato slug", () => {
    expect(slugify("copa-do-brasil")).toBe("copa-do-brasil");
  });

  it("números são preservados", () => {
    expect(slugify("Rodada 12 2025")).toBe("rodada-12-2025");
  });
});
