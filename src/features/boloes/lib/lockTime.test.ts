import { describe, it, expect } from "vitest";
import { getLockTime } from "./lockTime";

const ONE_HOUR_MS = 60 * 60 * 1000;

describe("getLockTime", () => {
  it("retorna o deadline quando não há partidas agendadas", () => {
    const deadline = new Date("2026-06-01T20:00:00Z");
    const result = getLockTime({ deadline, partidas: [] });
    expect(result.getTime()).toBe(deadline.getTime());
  });

  it("retorna o deadline quando nenhuma partida tem scheduledAt", () => {
    const deadline = new Date("2026-06-01T20:00:00Z");
    const result = getLockTime({ deadline, partidas: [{ scheduledAt: null }, { scheduledAt: null }] });
    expect(result.getTime()).toBe(deadline.getTime());
  });

  it("retorna 1h antes da partida mais cedo quando isso é antes do deadline", () => {
    const deadline = new Date("2026-06-01T20:00:00Z");
    const earliest = new Date("2026-06-01T18:00:00Z");
    const result = getLockTime({ deadline, partidas: [{ scheduledAt: earliest }] });
    expect(result.getTime()).toBe(earliest.getTime() - ONE_HOUR_MS);
  });

  it("retorna o deadline quando 1h antes da partida é depois do deadline", () => {
    const deadline = new Date("2026-06-01T10:00:00Z");
    const match = new Date("2026-06-01T20:00:00Z");
    const result = getLockTime({ deadline, partidas: [{ scheduledAt: match }] });
    expect(result.getTime()).toBe(deadline.getTime());
  });

  it("usa a partida mais cedo quando há múltiplas", () => {
    const deadline = new Date("2026-06-01T22:00:00Z");
    const early = new Date("2026-06-01T15:00:00Z");
    const late = new Date("2026-06-01T19:00:00Z");
    const result = getLockTime({ deadline, partidas: [{ scheduledAt: late }, { scheduledAt: early }] });
    expect(result.getTime()).toBe(early.getTime() - ONE_HOUR_MS);
  });
});
