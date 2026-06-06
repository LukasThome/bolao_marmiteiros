import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User } from "lucide-react";
import HistoricoPontos from "@/features/boloes/components/HistoricoPontos";

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const bolao = await prisma.bolao.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId: session.user.id },
        include: { user: true },
      },
    },
  });

  if (!bolao || bolao.members.length === 0) {
    redirect(`/boloes/${slug}`);
  }

  const member = bolao.members[0];
  const user = member.user;

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-4xl mx-auto">
        <Link href={`/boloes/${slug}`} className="text-sm mb-4 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>

        {/* Informações do Perfil */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "Usuário"}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-raised)" }}
              >
                <User size={24} style={{ color: "var(--text-secondary)" }} />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.name || "Usuário"}</h1>
              <p style={{ color: "var(--text-secondary)" }} className="text-sm mt-1">
                {user.email}
              </p>

              <div className="flex gap-6 mt-4">
                <div>
                  <div style={{ color: "var(--text-muted)" }} className="text-xs">
                    Pontos Totais
                  </div>
                  <div className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
                    {member.totalPts}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de Pontos */}
        <div>
          <h2 className="text-xl font-bold mb-4">Histórico de Pontos</h2>
          <HistoricoPontos bolaoSlug={slug} />
        </div>
      </div>
    </main>
  );
}
