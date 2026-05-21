import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PalpiteForm from "./PalpiteForm";

export default async function RodadaPalpitePage({
  params,
}: {
  params: Promise<{ slug: string; rodadaId: string }>;
}) {
  const { slug, rodadaId } = await params;
  const session = await auth();

  const rodada = await prisma.rodada.findUnique({
    where: { id: rodadaId },
    include: {
      bolao: true,
      partidas: {
        orderBy: { createdAt: "asc" },
        include: {
          palpites: {
            where: { userId: session!.user.id },
            take: 1,
          },
        },
      },
    },
  });

  if (!rodada || rodada.bolao.slug !== slug) redirect("/dashboard");

  const isOpen = new Date() < new Date(rodada.deadline);
  const deadline = new Date(rodada.deadline).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const partidas = rodada.partidas.map((p) => ({
    id: p.id,
    homeTeam: p.homeTeam,
    awayTeam: p.awayTeam,
    status: p.status,
    homeScore: p.homeScore,
    awayScore: p.awayScore,
    palpite: p.palpites[0]
      ? { homeScore: p.palpites[0].homeScore, awayScore: p.palpites[0].awayScore }
      : null,
  }));

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-2xl mx-auto">
        <Link href={`/boloes/${slug}`} className="text-sm mb-1 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {rodada.bolao.name}
        </p>

        <div className="flex items-center gap-3 mb-2 mt-1">
          <h1 className="text-2xl font-bold">{rodada.name}</h1>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: isOpen ? "var(--accent-subtle)" : "var(--bg-raised)",
              color: isOpen ? "var(--accent)" : "var(--text-muted)",
              border: `1px solid ${isOpen ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {isOpen ? "Aberto" : "Encerrado"}
          </span>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            prazo {deadline}
          </span>
        </div>

        {partidas.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma partida nesta rodada ainda.
          </p>
        ) : (
          <PalpiteForm partidas={partidas} isOpen={isOpen} />
        )}
      </div>
    </main>
  );
}
