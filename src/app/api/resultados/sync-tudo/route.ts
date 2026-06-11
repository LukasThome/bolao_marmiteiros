import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/role-guard";
import { sincronizarTodasRodadas } from "@/features/boloes/lib/syncResultados";

/**
 * Sincronização manual disparada pelo admin: busca os resultados de todas as
 * rodadas em andamento e pontua os palpites. Reusa a mesma lógica do cron.
 */
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const result = await sincronizarTodasRodadas();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao sincronizar";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
