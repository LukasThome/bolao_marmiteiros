import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calcularPontos } from "@/features/boloes/lib/score";
import { getFlag } from "@/features/boloes/lib/flags";
import { Shield } from "lucide-react";

function TeamFlag({ name }: { name: string }) {
  const flag = getFlag(name);
  if (flag) return <span className="text-base shrink-0">{flag}</span>;
  return <Shield size={14} className="shrink-0" style={{ color: "var(--text-muted)" }} />;
}
import Link from "next/link";
import BuscarPartidas from "@/features/admin/components/BuscarPartidas";

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ rodadaId: string }>;
}) {
  const { rodadaId } = await params;

  const rodada = await prisma.rodada.findUnique({
    where: { id: rodadaId },
    include: {
      partidas: { orderBy: { createdAt: "asc" } },
      bolao: true,
    },
  });

  if (!rodada) redirect("/dashboard");

  async function addPartida(formData: FormData) {
    "use server";
    const homeTeam = (formData.get("homeTeam") as string)?.trim();
    const awayTeam = (formData.get("awayTeam") as string)?.trim();
    if (!homeTeam || !awayTeam) return;

    await prisma.partida.create({
      data: { rodadaId, homeTeam, awayTeam },
    });
    revalidatePath(`/admin/partidas/${rodadaId}/resultado`);
  }

  async function registrarResultado(formData: FormData) {
    "use server";
    const partidaId = formData.get("partidaId") as string;
    const homeScore = parseInt(formData.get("homeScore") as string);
    const awayScore = parseInt(formData.get("awayScore") as string);
    if (!partidaId || isNaN(homeScore) || isNaN(awayScore)) return;

    await prisma.partida.update({
      where: { id: partidaId },
      data: { homeScore, awayScore, status: "FINISHED" },
    });

    // Pontuar todos os palpites desta partida
    const palpites = await prisma.palpite.findMany({
      where: { partidaId },
      include: { partida: { include: { rodada: { include: { bolao: true } } } } },
    });

    for (const palpite of palpites) {
      const pontos = calcularPontos(
        { homeScore: palpite.homeScore, awayScore: palpite.awayScore },
        { homeScore, awayScore }
      );

      await prisma.palpite.update({
        where: { id: palpite.id },
        data: { pontos },
      });

      // Atualiza totalPts do membro no bolão
      const bolaoId = palpite.partida.rodada.bolao.id;
      await prisma.bolaoMember.updateMany({
        where: { userId: palpite.userId, bolaoId },
        data: { totalPts: { increment: pontos } },
      });
    }

    revalidatePath(`/admin/partidas/${rodadaId}/resultado`);
  }

  const deadline = new Date(rodada.deadline).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-sm mb-1 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{rodada.bolao.name}</p>
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">{rodada.name}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-raised)", color: "var(--text-secondary)" }}>
            deadline {deadline}
          </span>
        </div>

        {/* Lista de partidas */}
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {rodada.partidas.length === 0 && (
            <p className="text-sm px-4 py-4" style={{ color: "var(--text-muted)" }}>
              Nenhuma partida adicionada ainda.
            </p>
          )}

          {rodada.partidas.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-4 py-3"
              style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
            >
              {/* Time mandante */}
              <span className="flex-1 text-sm font-medium text-right truncate flex items-center justify-end gap-1.5" title={p.homeTeam}>
                {p.homeTeam}
                <TeamFlag name={p.homeTeam} />
              </span>

              {/* Placar ou inputs */}
              {p.status === "FINISHED" ? (
                <span className="shrink-0 text-base font-bold tabular-nums px-2" style={{ color: "var(--accent)" }}>
                  {p.homeScore} × {p.awayScore}
                </span>
              ) : (
                <form action={registrarResultado} className="shrink-0 flex items-center gap-1.5">
                  <input type="hidden" name="partidaId" value={p.id} />
                  <input
                    name="homeScore"
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="w-11 text-center rounded-lg px-1 py-1.5 outline-none text-sm tabular-nums"
                    style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>×</span>
                  <input
                    name="awayScore"
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    className="w-11 text-center rounded-lg px-1 py-1.5 outline-none text-sm tabular-nums"
                    style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <button
                    type="submit"
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                    style={{ backgroundColor: "var(--accent)", color: "#fff" }}
                  >
                    Salvar
                  </button>
                </form>
              )}

              {/* Time visitante */}
              <span className="flex-1 text-sm font-medium truncate flex items-center gap-1.5" title={p.awayTeam}>
                <TeamFlag name={p.awayTeam} />
                {p.awayTeam}
              </span>

              {/* Badge encerrada */}
              {p.status === "FINISHED" && (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--success)" }}>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Buscar jogos da API */}
        <div className="mb-4">
          <BuscarPartidas
            rodadaId={rodadaId}
            existingTeams={rodada.partidas.flatMap((p) => [p.homeTeam, p.awayTeam])}
          />
        </div>

        {/* Adicionar partida manualmente */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
            Adicionar manualmente
          </h2>
          <form action={addPartida} className="flex items-center gap-3 flex-wrap">
            <input
              name="homeTeam"
              required
              placeholder="Time da casa"
              className="flex-1 min-w-32 rounded-lg px-3 py-2 outline-none text-sm"
              style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <span style={{ color: "var(--text-muted)" }}>×</span>
            <input
              name="awayTeam"
              required
              placeholder="Time visitante"
              className="flex-1 min-w-32 rounded-lg px-3 py-2 outline-none text-sm"
              style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <button
              type="submit"
              className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              + Adicionar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
