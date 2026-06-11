import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/role-guard";
import { sincronizarComThrottle } from "@/features/boloes/lib/syncResultados";

/**
 * Auto-sync sob demanda: disparado em background ao abrir a tela de pontuação.
 * Requer usuário autenticado e aplica throttle para proteger o rate limit da API.
 */
export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const result = await sincronizarComThrottle();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao sincronizar";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
