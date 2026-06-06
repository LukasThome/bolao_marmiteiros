import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { getFlag } from "@/features/boloes/lib/flags";

function TeamFlag({ name }: { name: string }) {
  const flag = getFlag(name);
  if (flag) return <span className="text-base shrink-0">{flag}</span>;
  return <Shield size={14} className="shrink-0" style={{ color: "var(--text-muted)" }} />;
}

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const bolao = await prisma.bolao.findUnique({
    where: { slug },
    include: {
      rodadas: {
        orderBy: { createdAt: "asc" },
        include: {
          partidas: {
            where: { status: "FINISHED" },
            orderBy: { scheduledAt: "asc" },
          },
        },
      },
    },
  });

  if (!bolao) redirect("/dashboard");

  // Verifica se é membro
  const membro = await prisma.bolaoMember.findUnique({
    where: { userId_bolaoId: { userId: session.user.id, bolaoId: bolao.id } },
  });
  if (!membro && session.user.role !== "ADMIN") redirect(`/boloes/${slug}`);

  // Apenas rodadas que têm partidas finalizadas
  const rodadasComResultados = bolao.rodadas.filter((r) => r.partidas.length > 0);
  const totalPartidas = rodadasComResultados.reduce((acc, r) => acc + r.partidas.length, 0);

  return (
    <main
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="max-w-2xl mx-auto">
        <Link href={`/boloes/${slug}`} className="text-sm mb-1 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {bolao.name}
        </p>

        <h1 className="text-2xl font-bold mb-1 mt-1">Resultados</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {totalPartidas} {totalPartidas === 1 ? "partida finalizada" : "partidas finalizadas"}
        </p>

        {rodadasComResultados.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Nenhuma partida finalizada ainda
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {rodadasComResultados.map((rodada) => (
              <div key={rodada.id} className="flex flex-col gap-2">
                <p
                  className="text-xs font-bold uppercase tracking-widest px-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {rodada.name}
                </p>

                <div
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  {rodada.partidas.map((p, i) => {
                    const data = p.scheduledAt
                      ? new Date(p.scheduledAt).toLocaleDateString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          day: "2-digit",
                          month: "short",
                        })
                      : null;

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col px-4 py-3"
                        style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                      >
                        {/* Time mandante */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <TeamFlag name={p.homeTeam} />
                            <span className="text-sm font-medium truncate" title={p.homeTeam}>
                              {p.homeTeam}
                            </span>
                          </div>
                          <span
                            className="shrink-0 w-8 text-center text-base font-bold tabular-nums"
                            style={{ color: "var(--accent)" }}
                          >
                            {p.homeScore}
                          </span>
                        </div>

                        {/* Time visitante */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <TeamFlag name={p.awayTeam} />
                            <span className="text-sm font-medium truncate" title={p.awayTeam}>
                              {p.awayTeam}
                            </span>
                          </div>
                          <span
                            className="shrink-0 w-8 text-center text-base font-bold tabular-nums"
                            style={{ color: "var(--accent)" }}
                          >
                            {p.awayScore}
                          </span>
                        </div>

                        {/* Data e grupo */}
                        <div className="flex items-center gap-2 mt-2">
                          {data && (
                            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                              {data}
                            </span>
                          )}
                          {p.group && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              · {p.group}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
