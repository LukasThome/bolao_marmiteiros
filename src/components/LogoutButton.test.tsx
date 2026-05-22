import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LogoutButton from "@/components/LogoutButton";

const mockSignOut = vi.fn();

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe("LogoutButton", () => {
  it("renderiza o botão de sair", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: /sair/i })).toBeDefined();
  });

  it("chama signOut com callbackUrl /login ao clicar", () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: /sair/i }));
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
