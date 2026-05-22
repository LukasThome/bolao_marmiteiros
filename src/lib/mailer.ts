import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "Bolão dos Marmiteiros <onboarding@resend.dev>";

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    // Dev sem chave configurada: loga o link no console
    console.log("\n📧 [DEV] RESEND_API_KEY não definida — email não enviado:");
    console.log("   Para:", opts.to);
    console.log("   Assunto:", opts.subject);
    const link = opts.html.match(/href="([^"]+)"/)?.[1];
    if (link) console.log("   Link:", link);
    console.log();
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from: FROM, ...opts });
}
