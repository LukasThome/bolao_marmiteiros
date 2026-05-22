import nodemailer from "nodemailer";

function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }

  // Dev: loga no console, não envia email real
  return nodemailer.createTransport({ jsonTransport: true });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const transport = createTransport();
  const from = process.env.SMTP_FROM ?? "Bolão dos Marmiteiros <noreply@bolao.local>";

  const info = await transport.sendMail({ from, ...opts });

  if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) {
    const msg = JSON.parse((info as { message: string }).message);
    console.log("\n📧 [DEV] Email não enviado — conteúdo abaixo:");
    console.log("   Para:", opts.to);
    console.log("   Assunto:", opts.subject);
    // Extrai o link do corpo HTML para facilitar o teste
    const link = opts.html.match(/href="([^"]+)"/)?.[1];
    if (link) console.log("   Link:", link);
    console.log();
  }
}
