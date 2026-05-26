import { describe, it, expect } from "vitest";
import { getFlag } from "@/features/boloes/lib/flags";

describe("getFlag", () => {
  it("retorna bandeira do Brasil", () => {
    expect(getFlag("Brazil")).toBe("🇧🇷");
  });

  it("retorna bandeira dos EUA", () => {
    expect(getFlag("United States")).toBe("🇺🇸");
  });

  it("retorna bandeira da Argentina", () => {
    expect(getFlag("Argentina")).toBe("🇦🇷");
  });

  it("retorna bandeira da França", () => {
    expect(getFlag("France")).toBe("🇫🇷");
  });

  it("retorna string vazia para time desconhecido", () => {
    expect(getFlag("Time Imaginário")).toBe("");
  });

  it("retorna string vazia para string vazia", () => {
    expect(getFlag("")).toBe("");
  });
});
