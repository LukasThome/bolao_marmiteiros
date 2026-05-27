import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PalpiteForm from "@/features/boloes/components/PalpiteForm";
import Countdown from "@/features/boloes/components/Countdown";
import { getLockTime } from "@/features/boloes/lib/lockTime";

type MemberPalpite = {
  userId: string;
  userName: string;
  homeScore: number;
  awayScore: number;
  pontos: number | null;
};

export default async function RodadaPalpitePage({
  params,
}: {
  params: Promise<{ slug: string; rodadaId: string }>;
}) {
  const { slug, rodadaId } = await params;
  const session = await auth();
  const currentUserId = session!.user.id;

  const rodada = await prisma.rodada.findUnique({
    where: { id: rodadaId },
    include: {
      bolao: true,
      partidas: {
        orderBy: { createdAt: "asc" },
        include: {
          palpites: {
            where: { userId: currentUserId },
            take: 1,
          },
        },
      },
    },
  });

  if (!rodada || rodada.bolao.slug !== slug) redirect("/dashboard");

  const lockTime = getLockTime({ deadline: rodada.deadline, partidas: rodada.partidas });
  const isOpen = new Date() < lockTime;
  const deadlineLabel = lockTime.toLocaleString("pt-BR", {
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
    scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null,
    palpite: p.palpites[0]
      ? { homeScore: p.palpites[0].homeScore, awayScore: p.palpites[0].awayScore, pontos: p.palpites[0].pontos }
      : null,
  }));

  // Após o deadline: busca palpites de todos os membros
  let allPalpites: Record<string, MemberPalpite[]> = {};
  if (!isOpen) {
    const palpites = await prisma.palpite.findMany({
      where: { partida: { rodadaId } },
      select: { partidaId: true, userId: true, homeScore: true, awayScore: true, pontos: true },
    });

    const userIds = [...new Set(palpites.map((p) => p.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name ?? "—"]));

    for (const p of palpites) {
      if (!allPalpites[p.partidaId]) allPalpites[p.partidaId] = [];
      allPalpites[p.partidaId].push({
        userId: p.userId,
        userName: userMap[p.userId] ?? "—",
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        pontos: p.pontos,
      });
    }

    // Ordena por pontos desc (sem resultado ainda: ordem de submissão)
    for (const arr of Object.values(allPalpites)) {
      arr.sort((a, b) => (b.pontos ?? -1) - (a.pontos ?? -1));
    }
  }

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

        <div className="flex items-center gap-2 mb-6 flex-wrap">
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
            prazo {deadlineLabel}
          </span>
          {isOpen && <Countdown deadline={lockTime.toISOString()} />}
        </div>

        {partidas.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma partida nesta rodada ainda.
          </p>
        ) : (
          <PalpiteForm
            partidas={partidas}
            isOpen={isOpen}
            allPalpites={allPalpites}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </main>
  );
}
