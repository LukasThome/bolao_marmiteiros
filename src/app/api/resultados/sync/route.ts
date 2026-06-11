import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/role-guard";
import { sincronizarRodada } from "@/features/boloes/lib/syncResultados";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const rodadaId = typeof body.rodadaId === "string" ? body.rodadaId : null;
  if (!rodadaId) return NextResponse.json({ error: "rodadaId obrigatório" }, { status: 400 });

  try {
    const result = await sincronizarRodada(rodadaId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao buscar resultados";
    const status = message === "Rodada não encontrada" ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
