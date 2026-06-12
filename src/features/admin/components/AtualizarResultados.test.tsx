import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AtualizarResultados from "@/features/admin/components/AtualizarResultados";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

describe("AtualizarResultados", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRefresh.mockReset();
  });

  it("renderiza o botão de atualizar", () => {
    render(<AtualizarResultados />);
    expect(screen.getByRole("button", { name: /atualizar resultados/i })).toBeDefined();
  });

  it("exibe sucesso e atualiza a página quando há partidas sincronizadas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, totalSynced: 3, rodadas: [] }),
    }));

    render(<AtualizarResultados />);
    fireEvent.click(screen.getByRole("button", { name: /atualizar resultados/i }));

    await waitFor(() => screen.getByText(/3 partidas atualizadas e pontuadas/i));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("informa quando não há partidas novas e não atualiza a página", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, totalSynced: 0, rodadas: [] }),
    }));

    render(<AtualizarResultados />);
    fireEvent.click(screen.getByRole("button", { name: /atualizar resultados/i }));

    await waitFor(() => screen.getByText(/nenhuma partida nova/i));
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("exibe erro quando a API retorna falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: "Erro ao sincronizar" }),
    }));

    render(<AtualizarResultados />);
    fireEvent.click(screen.getByRole("button", { name: /atualizar resultados/i }));

    await waitFor(() => screen.getByText(/erro ao sincronizar/i));
  });

  it("exibe erro de conexão em falha de rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    render(<AtualizarResultados />);
    fireEvent.click(screen.getByRole("button", { name: /atualizar resultados/i }));

    await waitFor(() => screen.getByText(/erro de conexão/i));
  });
});
