import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SincronizarResultados from "@/features/admin/components/SincronizarResultados";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

const RODADA_ID = "rodada-123";

describe("SincronizarResultados", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRefresh.mockReset();
  });

  it("renderiza o botão de sincronizar", () => {
    render(<SincronizarResultados rodadaId={RODADA_ID} />);
    expect(screen.getByRole("button", { name: /sincronizar/i })).toBeDefined();
  });

  it("exibe resultado de sucesso após sincronizar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ synced: 2, alreadyDone: 1, notFound: [] }),
    }));

    render(<SincronizarResultados rodadaId={RODADA_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /sincronizar/i }));

    await waitFor(() => screen.getByText(/2 partidas sincronizadas/i));
    expect(screen.getByText(/1 partida já finalizada/i)).toBeDefined();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("exibe lista de partidas não encontradas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ synced: 0, alreadyDone: 0, notFound: ["Brasil × Argentina"] }),
    }));

    render(<SincronizarResultados rodadaId={RODADA_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /sincronizar/i }));

    await waitFor(() => screen.getByText("Brasil × Argentina"));
  });

  it("exibe mensagem de erro quando API retorna erro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Nenhuma chave de API configurada" }),
    }));

    render(<SincronizarResultados rodadaId={RODADA_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /sincronizar/i }));

    await waitFor(() => screen.getByText(/nenhuma chave de api/i));
  });

  it("exibe mensagem de erro genérica em falha de conexão", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    render(<SincronizarResultados rodadaId={RODADA_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /sincronizar/i }));

    await waitFor(() => screen.getByText(/erro de conexão/i));
  });

  it("não chama router.refresh quando synced é 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ synced: 0, alreadyDone: 3, notFound: [] }),
    }));

    render(<SincronizarResultados rodadaId={RODADA_ID} />);
    fireEvent.click(screen.getByRole("button", { name: /sincronizar/i }));

    await waitFor(() => screen.getByText(/3 partidas já finalizadas/i));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
