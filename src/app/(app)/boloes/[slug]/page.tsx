import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import Link from "next/link";
import { ChevronRight, Clock, Trophy, User, ListChecks } from "lucide-react";
import InviteLink from "@/features/boloes/components/InviteLink";
import AtualizarResultados from "@/features/admin/components/AtualizarResultados";

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
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { partidas: true } } },
      },
      members: { orderBy: { totalPts: "desc" } },
    },
  });

  if (!bolao) redirect("/dashboard");

  // Gera token para bolões criados antes desta feature
  let inviteToken = bolao.inviteToken;
  if (!inviteToken && isAdmin) {
    inviteToken = randomUUID();
    await prisma.bolao.update({ where: { id: bolao.id }, data: { inviteToken } });
  }

  // Query separada para tolerar BolaoMembers com userId órfão (ex: dev bypass antigo)
  const userIds = bolao.members.map((m) => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const members = bolao.members.map((m) => ({ ...m, user: userMap[m.userId] ?? null }));

  const now = new Date();

  // Medalha por faixa de pontuação: maior pontuação = ouro, 2ª = prata, 3ª = bronze.
  // Todos os jogadores com a mesma pontuação (faixa) recebem a mesma medalha.
  const faixas = [...new Set(members.map((m) => m.totalPts).filter((p) => p > 0))].sort(
    (a, b) => b - a
  );
  const medalhaPorPontos = (pts: number): string | null => {
    if (pts <= 0) return null;
    return ["🥇", "🥈", "🥉"][faixas.indexOf(pts)] ?? null;
  };
  // Usa os dados do banco (userMap) para refletir a foto atualizada,
  // já que a imagem na sessão (JWT) pode estar desatualizada.
  const currentUser = session?.user
    ? { ...session.user, image: userMap[session.user.id]?.image ?? session.user.image }
    : null;

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header com Voltar e Avatar */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ← Voltar
          </Link>
          
          {currentUser && (
            <Link
              href={`/boloes/${slug}/perfil`}
              className="rounded-full overflow-hidden hover:opacity-75 transition-opacity"
              style={{ width: "40px", height: "40px" }}
            >
              {currentUser.image ? (
                <img
                  src={currentUser.image}
                  alt={currentUser.name || "Perfil"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <User size={20} style={{ color: "#fff" }} />
                </div>
              )}
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{bolao.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {members.length} {members.length === 1 ? "membro" : "membros"}
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

        {/* Link de convite (admin) */}
        {isAdmin && inviteToken && <InviteLink token={inviteToken} />}

        {/* Ranking */}
        <div className="rounded-xl mb-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <Trophy size={14} style={{ color: "var(--gold)" }} />
            <h2 className="text-sm font-semibold">Classificação</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {members.map((member, i) => {
              const isMe = member.userId === session?.user?.id;
              const medalha = medalhaPorPontos(member.totalPts);
              return (
                <Link
                  key={member.id}
                  href={isMe ? `/boloes/${slug}/perfil` : `/boloes/${slug}/perfil?userId=${member.userId}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={isMe ? { backgroundColor: "var(--accent-subtle)", cursor: "default" } : { cursor: "pointer" }}
                >
                  <span className="w-6 text-center text-sm">
                    {medalha ?? <span style={{ color: "var(--text-muted)" }}>{i + 1}</span>}
                  </span>
                  <div
                    className="shrink-0 rounded-full overflow-hidden"
                    style={{ width: "28px", height: "28px" }}
                  >
                    {member.user?.image ? (
                      <img
                        src={member.user.image}
                        alt={member.user.name || "Jogador"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: "var(--bg-raised)" }}
                      >
                        <User size={14} style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">
                    {member.user?.name ?? "—"}
                    {isMe && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--accent)" }}>você</span>
                    )}
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: medalha === "🥇" ? "var(--gold)" : "var(--text-primary)" }}
                  >
                    {member.totalPts} pts
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Link para Resultados */}
        <Link
          href={`/boloes/${slug}/resultados`}
          className="rounded-xl p-4 flex items-center justify-between gap-4 mb-6 transition-opacity hover:opacity-75"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <ListChecks size={16} style={{ color: "var(--accent)" }} />
            <span className="font-semibold text-sm">Resultados das partidas</span>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
        </Link>

        {/* Botão de atualizar resultados (admin) */}
        {isAdmin && <AtualizarResultados />}

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
