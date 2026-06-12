import { NextRequest, NextResponse } from "next/server";
import { sincronizarTodasRodadas } from "@/features/boloes/lib/syncResultados";

/**
 * Endpoint chamado automaticamente pelo Vercel Cron (ver vercel.json).
 * Sincroniza os resultados de todas as rodadas em andamento.
 *
 * Proteção: o Vercel Cron envia o header `Authorization: Bearer <CRON_SECRET>`.
 * Em produção, exige que CRON_SECRET esteja definido e bata com o header.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Em produção, nunca rodar sem secret configurado
    return NextResponse.json({ error: "CRON_SECRET não configurado" }, { status: 500 });
  }

  try {
    const result = await sincronizarTodasRodadas();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao sincronizar";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
