import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock nodemailer antes do import
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ message: JSON.stringify({ to: "t@t.com" }) }),
    })),
  },
}));

import nodemailer from "nodemailer";
import { sendMail } from "@/lib/mailer";

const mockCreateTransport = vi.mocked(nodemailer.createTransport);

beforeEach(() => {
  vi.clearAllMocks();
  // Recria o mock para cada teste
  mockCreateTransport.mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ message: JSON.stringify({ to: "t@t.com" }) }),
  } as never);
});

afterEach(() => {
  delete process.env.SMTP_HOST;
});

describe("sendMail", () => {
  it("usa jsonTransport quando SMTP_HOST não está definido", async () => {
    delete process.env.SMTP_HOST;
    await sendMail({ to: "a@b.com", subject: "Teste", html: "<p>Olá</p>" });
    expect(mockCreateTransport).toHaveBeenCalledWith({ jsonTransport: true });
  });

  it("usa SMTP quando SMTP_HOST está definido", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    await sendMail({ to: "a@b.com", subject: "Teste", html: "<p>Olá</p>" });
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.example.com" })
    );
  });

  it("chama sendMail com os campos corretos", async () => {
    const mockSendMail = vi.fn().mockResolvedValue({ message: JSON.stringify({}) });
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail } as never);

    await sendMail({ to: "dest@test.com", subject: "Assunto", html: "<b>X</b>" });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "dest@test.com", subject: "Assunto" })
    );
  });
});
