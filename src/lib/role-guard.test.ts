import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Mock do módulo de auth antes do import
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { requireAuth, requireRole, requireAdmin } from "@/lib/role-guard";
import { auth } from "@/lib/auth";

const mockAuth = vi.mocked(auth);

function makeSession(role: string) {
  return { user: { id: "abc123", email: "u@test.com", role } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("retorna session quando autenticado", async () => {
    mockAuth.mockResolvedValue(makeSession("MEMBER") as never);
    const { session, error } = await requireAuth();
    expect(error).toBeNull();
    expect(session?.user?.role).toBe("MEMBER");
  });

  it("retorna 401 quando não autenticado", async () => {
    mockAuth.mockResolvedValue(null as never);
    const { session, error } = await requireAuth();
    expect(session).toBeNull();
    expect(error).toBeInstanceOf(NextResponse);
    const body = await error!.json();
    expect(body.error).toMatch(/autenticado/i);
    expect(error!.status).toBe(401);
  });
});

describe("requireRole", () => {
  it("aprova quando o role bate", async () => {
    mockAuth.mockResolvedValue(makeSession("ADMIN") as never);
    const { session, error } = await requireRole("ADMIN");
    expect(error).toBeNull();
    expect(session?.user?.role).toBe("ADMIN");
  });

  it("retorna 403 quando o role não bate", async () => {
    mockAuth.mockResolvedValue(makeSession("MEMBER") as never);
    const { session, error } = await requireRole("ADMIN");
    expect(session).toBeNull();
    expect(error!.status).toBe(403);
  });

  it("retorna 401 quando não autenticado", async () => {
    mockAuth.mockResolvedValue(null as never);
    const { error } = await requireRole("ADMIN");
    expect(error!.status).toBe(401);
  });
});

describe("requireAdmin", () => {
  it("é atalho para requireRole('ADMIN')", async () => {
    mockAuth.mockResolvedValue(makeSession("ADMIN") as never);
    const { session, error } = await requireAdmin();
    expect(error).toBeNull();
    expect(session?.user?.role).toBe("ADMIN");
  });

  it("retorna 403 para MEMBER", async () => {
    mockAuth.mockResolvedValue(makeSession("MEMBER") as never);
    const { error } = await requireAdmin();
    expect(error!.status).toBe(403);
  });
});
