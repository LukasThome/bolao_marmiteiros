import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PalpiteForm from "@/features/boloes/components/PalpiteForm";

const PARTIDAS_ABERTAS = [
  {
    id: "p1",
    homeTeam: "Brasil",
    awayTeam: "Argentina",
    group: "Grupo C",
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    scheduledAt: null,
    palpite: null,
  },
  {
    id: "p2",
    homeTeam: "França",
    awayTeam: "Alemanha",
    group: "Grupo C",
    status: "SCHEDULED",
    homeScore: null,
    awayScore: null,
    scheduledAt: null,
    palpite: { homeScore: 2, awayScore: 1, pontos: null },
  },
];

const PARTIDAS_FECHADAS = [
  {
    id: "p1",
    homeTeam: "Brasil",
    awayTeam: "Argentina",
    group: "Grupo C",
    status: "FINISHED",
    homeScore: 3,
    awayScore: 1,
    scheduledAt: null,
    palpite: { homeScore: 2, awayScore: 0, pontos: 1 },
  },
];

describe("PalpiteForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza os times das partidas", () => {
    render(<PalpiteForm partidas={PARTIDAS_ABERTAS} isOpen={true} />);
    expect(screen.getByText("Brasil")).toBeDefined();
    expect(screen.getByText("Argentina")).toBeDefined();
    expect(screen.getByText("França")).toBeDefined();
  });

  it("pré-preenche inputs com palpite existente e botões habilitados", () => {
    render(<PalpiteForm partidas={PARTIDAS_ABERTAS} isOpen={true} />);
    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    const homeInput = inputs.find((i) => i.value === "2");
    expect(homeInput).toBeDefined();
    // botões individuais por partida estão habilitados (Salvar / Editar)
    const btns = screen.getAllByRole("button", { name: /salvar$|editar/i });
    btns.forEach((btn) => expect((btn as HTMLButtonElement).disabled).toBe(false));
  });

  it("exibe placares reais para partidas finalizadas", () => {
    render(<PalpiteForm partidas={PARTIDAS_FECHADAS} isOpen={false} />);
    expect(screen.getByText("3 × 1")).toBeDefined();
  });

  it("salva palpite ao clicar em salvar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pal1", homeScore: 1, awayScore: 0 }),
    }));

    render(<PalpiteForm partidas={PARTIDAS_ABERTAS} isOpen={true} />);

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "0" } });

    // Clica no botão "Atualizar" da primeira partida (ficou dirty após a mudança)
    const updateButton = screen.getByRole("button", { name: /atualizar/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/palpites", expect.objectContaining({ method: "POST" }));
    });
  });

  it("exibe pontos dos palpites encerrados", () => {
    const allPalpites = {
      p1: [{ userId: "u1", userName: "Lucas", homeScore: 2, awayScore: 0, pontos: 1 }],
    };
    render(
      <PalpiteForm
        partidas={PARTIDAS_FECHADAS}
        isOpen={false}
        allPalpites={allPalpites}
        currentUserId="u1"
      />
    );
    expect(screen.getByText("1 pts")).toBeDefined();
  });

  it("salvar todos chama batch endpoint com palpites preenchidos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ saved: 2, errors: [] }),
    }));

    render(<PalpiteForm partidas={PARTIDAS_ABERTAS} isOpen={true} />);

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "0" } });

    const saveAllBtn = screen.getByRole("button", { name: /salvar todos/i });
    fireEvent.click(saveAllBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/palpites/batch", expect.objectContaining({ method: "POST" }));
    });
  });

  it("exibe palpites de todos os membros quando encerrado", () => {
    const allPalpites = {
      p1: [
        { userId: "u1", userName: "Lucas", homeScore: 2, awayScore: 0, pontos: 1 },
        { userId: "u2", userName: "Pedro", homeScore: 3, awayScore: 1, pontos: 3 },
      ],
    };
    render(
      <PalpiteForm
        partidas={PARTIDAS_FECHADAS}
        isOpen={false}
        allPalpites={allPalpites}
        currentUserId="u1"
      />
    );
    expect(screen.getByText("Lucas")).toBeDefined();
    expect(screen.getByText("Pedro")).toBeDefined();
  });
});
