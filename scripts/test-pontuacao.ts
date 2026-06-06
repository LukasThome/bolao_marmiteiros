import { PrismaClient } from "@prisma/client";
import { pontuarPalpites } from "@/features/boloes/lib/pontuacao";

const prisma = new PrismaClient();

async function main() {
  const rodadaId = "6a0fa13fa3f5d4521c2b3fc5"; // Rodada 1

  // 1. Busca a rodada e suas partidas
  const rodada = await prisma.rodada.findUnique({
    where: { id: rodadaId },
    include: { partidas: true, bolao: true },
  });

  if (!rodada) {
    console.error("❌ Rodada não encontrada");
    process.exit(1);
  }

  console.log(`📋 Rodada: ${rodada.name}`);
  console.log(`   Total de partidas: ${rodada.partidas.length}\n`);

  // 2. Simula alguns resultados
  const resultados = [
    { homeTeam: "Mexico", awayTeam: "South Africa", homeScore: 1, awayScore: 0 },
    { homeTeam: "South Korea", awayTeam: "Czechia", homeScore: 2, awayScore: 2 },
    { homeTeam: "Canada", awayTeam: "Bosnia-Herzegovina", homeScore: 1, awayScore: 1 },
  ];

  console.log("🎮 Simulando resultados...\n");

  for (const resultado of resultados) {
    const partida = rodada.partidas.find(
      (p) => p.homeTeam === resultado.homeTeam && p.awayTeam === resultado.awayTeam
    );

    if (!partida) {
      console.log(`⚠️  Partida não encontrada: ${resultado.homeTeam} × ${resultado.awayTeam}`);
      continue;
    }

    // Atualiza a partida com o resultado
    await prisma.partida.update({
      where: { id: partida.id },
      data: {
        homeScore: resultado.homeScore,
        awayScore: resultado.awayScore,
        status: "FINISHED",
      },
    });

    // Busca os palpites para essa partida
    const palpites = await prisma.palpite.findMany({
      where: { partidaId: partida.id },
      include: { user: true, partida: { include: { rodada: { include: { bolao: true } } } } },
    });

    console.log(`⚽ ${resultado.homeTeam} ${resultado.homeScore} × ${resultado.awayScore} ${resultado.awayTeam}`);

    if (palpites.length === 0) {
      console.log(`   (nenhum palpite registrado)\n`);
      continue;
    }

    // Pontua os palpites
    await pontuarPalpites(palpites, {
      homeScore: resultado.homeScore,
      awayScore: resultado.awayScore,
    });

    // Exibe os resultados dos palpites
    for (const palpite of palpites) {
      const pontos = await prisma.palpite.findUnique({
        where: { id: palpite.id },
        select: { pontos: true },
      });

      console.log(
        `   ${palpite.user.name || "Anônimo"}: ${palpite.homeScore} × ${palpite.awayScore} → ${pontos?.pontos ?? 0} pts`
      );
    }

    console.log();
  }

  // 3. Exibe o ranking atualizado
  console.log("🏆 Ranking atualizado:");
  const members = await prisma.bolaoMember.findMany({
    where: { bolaoId: rodada.bolao.id },
    include: { user: true },
    orderBy: { totalPts: "desc" },
  });

  members.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.user.name || "Anônimo"}: ${m.totalPts} pts`);
  });

  console.log("\n✅ Teste concluído!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
