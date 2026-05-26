import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockSend = vi.fn().mockResolvedValue({ id: "fake-id" });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { sendMail } from "@/features/auth/lib/mailer";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.RESEND_API_KEY;
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
});

describe("sendMail", () => {
  it("não chama Resend quando RESEND_API_KEY não está definida", async () => {
    await sendMail({ to: "a@b.com", subject: "Teste", html: "<p>Olá</p>" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("chama Resend.emails.send quando a chave está definida", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    await sendMail({ to: "dest@test.com", subject: "Assunto", html: "<b>X</b>" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "dest@test.com", subject: "Assunto" })
    );
  });

  it("inclui o campo from no envio", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    await sendMail({ to: "x@y.com", subject: "S", html: "<p/>" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: expect.stringContaining("Marmiteiros") })
    );
  });
});
