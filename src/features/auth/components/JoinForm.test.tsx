import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JoinForm from "@/features/auth/components/JoinForm";

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe("JoinForm", () => {
  it("exibe o nome do bolão", () => {
    render(<JoinForm token="abc123" bolaoName="Copa dos Marmiteiros" />);
    expect(screen.getByText(/Copa dos Marmiteiros/)).toBeDefined();
  });

  it("tem campos de nome, email e senha", () => {
    render(<JoinForm token="abc123" bolaoName="Bolão Teste" />);
    expect(screen.getByPlaceholderText(/seu nome/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/email/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/senha/i)).toBeDefined();
  });

  it("tem botão de criar conta", () => {
    render(<JoinForm token="abc123" bolaoName="Bolão Teste" />);
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeDefined();
  });

  it("exibe erro quando API retorna erro de registro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Email já cadastrado" }),
    }));

    render(<JoinForm token="abc123" bolaoName="Bolão Teste" />);
    fireEvent.change(screen.getByPlaceholderText(/seu nome/i), { target: { value: "João" } });
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: "joao@test.com" } });
    fireEvent.change(screen.getByPlaceholderText(/senha/i), { target: { value: "senha123" } });
    fireEvent.submit(screen.getByRole("button", { name: /criar conta/i }).closest("form")!);

    await waitFor(() => screen.getByText(/email já cadastrado/i));
  });
});
