import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, Trophy } from "lucide-react";

export default async function BolaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const bolao = await prisma.bolao.findUnique({
    where: { slug },
    include: {
      rodadas: {
        orderBy: { deadline: "desc" },
        include: { _count: { select: { partidas: true } } },
      },
      members: {
        orderBy: { totalPts: "desc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!bolao) redirect("/dashboard");

  const now = new Date();
  const hasPoints = bolao.members.some((m) => m.totalPts > 0);

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-sm mb-1 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>

        <div className="flex items-center justify-between mb-8 mt-2">
          <div>
            <h1 className="text-2xl font-bold">{bolao.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {bolao.members.length} {bolao.members.length === 1 ? "membro" : "membros"}
            </p>
          </div>
          {isAdmin && (
            <Link
              href={`/admin/rodadas/${slug}/new`}
              className="text-sm font-medium px-3 py-2 rounded-lg"
              style={{ backgroundColor: "var(--accent)", color: "#fff" }}
            >
              + Rodada
            </Link>
          )}
        </div>

        {/* Ranking */}
        <div className="rounded-xl mb-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <Trophy size={14} style={{ color: "var(--gold)" }} />
            <h2 className="text-sm font-semibold">Classificação</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {bolao.members.map((member, i) => {
              const isMe = member.user.id === session?.user?.id;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={isMe ? { backgroundColor: "var(--accent-subtle)" } : undefined}
                >
                  <span className="w-6 text-center text-sm">
                    {hasPoints && i < 3 ? medals[i] : <span style={{ color: "var(--text-muted)" }}>{i + 1}</span>}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">
                    {member.user.name ?? "—"}
                    {isMe && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--accent)" }}>você</span>
                    )}
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: hasPoints && i === 0 ? "var(--gold)" : "var(--text-primary)" }}
                  >
                    {member.totalPts} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodadas */}
        {bolao.rodadas.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma rodada ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bolao.rodadas.map((rodada) => {
              const isOpen = now < new Date(rodada.deadline);
              const deadline = new Date(rodada.deadline).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Link
                  key={rodada.id}
                  href={`/boloes/${slug}/rodadas/${rodada.id}`}
                  className="rounded-xl p-4 flex items-center justify-between gap-4 transition-opacity hover:opacity-75"
                  style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <div>
                    <h2 className="font-semibold">{rodada.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {rodada._count.partidas} {rodada._count.partidas === 1 ? "partida" : "partidas"}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: isOpen ? "var(--accent)" : "var(--text-muted)" }}
                      >
                        <Clock size={11} />
                        {isOpen ? `prazo ${deadline}` : `encerrado ${deadline}`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
