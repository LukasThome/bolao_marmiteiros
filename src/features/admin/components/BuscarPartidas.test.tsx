import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BuscarPartidas from "@/features/admin/components/BuscarPartidas";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

describe("BuscarPartidas", () => {
  it("renderiza o botão de buscar", () => {
    render(<BuscarPartidas rodadaId="r1" existingTeams={[]} />);
    expect(screen.getByRole("button", { name: /buscar/i })).toBeDefined();
  });

  it("exibe fixtures encontradas pela API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fixtures: [
          { id: 1, date: "2026-06-01", status: "NS", round: "Fase de Grupos", homeTeam: "Brasil", awayTeam: "Alemanha" },
        ],
      }),
    }));

    render(<BuscarPartidas rodadaId="r1" existingTeams={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => screen.getByText(/Brasil.*Alemanha/));
  });

  it("exibe mensagem de erro quando API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Chave de API não configurada" }),
    }));

    render(<BuscarPartidas rodadaId="r1" existingTeams={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => screen.getByText(/chave de api/i));
  });

  it("exibe mensagem de erro em falha de rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    render(<BuscarPartidas rodadaId="r1" existingTeams={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => screen.getByText(/erro de conexão/i));
  });

  it("marca fixture já adicionada como desabilitada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fixtures: [
          { id: 1, date: "2026-06-01", status: "NS", round: "Fase de Grupos", homeTeam: "Brasil", awayTeam: "Alemanha" },
        ],
      }),
    }));

    render(<BuscarPartidas rodadaId="r1" existingTeams={["Brasil", "Alemanha"]} />);
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() => screen.getByText(/Brasil.*Alemanha/));
    const addBtn = screen.getByRole("button", { name: /adicionado/i });
    expect(addBtn).toBeDefined();
  });
});
