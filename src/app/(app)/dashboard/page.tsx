import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, ChevronRight, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  let boloes: Awaited<ReturnType<typeof fetchBoloes>> = [];
  try {
    boloes = await fetchBoloes(session?.user?.id ?? "", isAdmin);
  } catch {
    // ID inválido (dev bypass sem registro no banco)
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">🍱 Bolão dos Marmiteiros</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Bem-vindo, {session?.user?.name ?? "usuário"}
              {isAdmin && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--gold-subtle)", color: "var(--gold)" }}>
                  ADMIN
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin/boloes/new"
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                <Plus size={15} />
                Novo Bolão
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Lista de bolões */}
        {boloes.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <Trophy size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="font-medium mb-1">Nenhum bolão ainda</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              {isAdmin ? "Crie o primeiro bolão para começar." : "Aguarde um convite do administrador."}
            </p>
            {isAdmin && (
              <Link
                href="/admin/boloes/new"
                className="inline-block text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "var(--accent)", color: "#fff" }}
              >
                Criar primeiro bolão →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {boloes.map((bolao) => {
              const rodada = bolao.rodadas[0];
              const deadline = rodada
                ? new Date(rodada.deadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                : null;

              return (
                <div
                  key={bolao.id}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold truncate">{bolao.name}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                          <Users size={12} />
                          {bolao._count.members} membros
                        </span>
                        {rodada && (
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {rodada.name} · prazo {deadline}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && (
                        <Link
                          href={`/admin/rodadas/${bolao.slug}/new`}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ backgroundColor: "var(--bg-raised)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        >
                          + Rodada
                        </Link>
                      )}
                      <Link
                        href={`/boloes/${bolao.slug}`}
                        className="flex items-center gap-0.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: "var(--bg-raised)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                      >
                        Ver <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

async function fetchBoloes(userId: string, isAdmin = false) {
  return prisma.bolao.findMany({
    where: isAdmin ? {} : { members: { some: { userId } } },
    include: {
      _count: { select: { members: true } },
      rodadas: { orderBy: { deadline: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}
