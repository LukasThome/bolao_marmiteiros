import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InviteLink from "@/components/InviteLink";

const TOKEN = "test-token-uuid";

// clipboard mock
beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });

  // window.location.origin
  Object.defineProperty(window, "location", {
    value: { origin: "http://localhost:3000" },
    configurable: true,
  });
});

describe("InviteLink", () => {
  it("exibe a URL de convite com o token", () => {
    render(<InviteLink token={TOKEN} />);
    expect(screen.getByText(`http://localhost:3000/join/${TOKEN}`)).toBeDefined();
  });

  it("tem botão de copiar", () => {
    render(<InviteLink token={TOKEN} />);
    expect(screen.getByRole("button", { name: /copiar/i })).toBeDefined();
  });

  it("chama clipboard.writeText ao clicar em Copiar", async () => {
    render(<InviteLink token={TOKEN} />);
    const btn = screen.getByRole("button", { name: /copiar/i });
    fireEvent.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `http://localhost:3000/join/${TOKEN}`
    );
  });

  it("muda o texto do botão para Copiado! após clicar", async () => {
    render(<InviteLink token={TOKEN} />);
    fireEvent.click(screen.getByRole("button", { name: /copiar/i }));
    // Aguarda re-render
    await screen.findByText(/copiado/i);
    expect(screen.getByText(/copiado/i)).toBeDefined();
  });
});
