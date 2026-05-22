import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("hashPassword", () => {
  it("retorna string com formato salt:hash", () => {
    const h = hashPassword("minha-senha");
    expect(h).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it("gera hashes diferentes para a mesma senha (sal aleatório)", () => {
    const h1 = hashPassword("mesma-senha");
    const h2 = hashPassword("mesma-senha");
    expect(h1).not.toBe(h2);
  });
});

describe("verifyPassword", () => {
  it("valida senha correta", () => {
    const stored = hashPassword("senha123");
    expect(verifyPassword("senha123", stored)).toBe(true);
  });

  it("rejeita senha errada", () => {
    const stored = hashPassword("senha123");
    expect(verifyPassword("errada", stored)).toBe(false);
  });

  it("rejeita hash malformado", () => {
    expect(verifyPassword("qualquer", "sem-dois-pontos")).toBe(false);
  });

  it("rejeita string vazia como hash", () => {
    expect(verifyPassword("senha", "")).toBe(false);
  });
});
