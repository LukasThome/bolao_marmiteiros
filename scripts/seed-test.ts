/**
 * Cria um cenário de teste completo:
 *  - 1 rodada "Teste de Pontuação" no primeiro bolão encontrado
 *  - 2 partidas: Brasil × Argentina e França × Alemanha
 *  - 1 palpite por membro do bolão (pré-configurado para testar pontuação)
 *
 * Uso: npx tsx scripts/seed-test.ts
 *
 * Depois:
 *  1. Acesse /admin/partidas/<rodadaId>/resultado
 *  2. Registre o resultado Brasil 2 × 1 Argentina
 *  3. Verifique que os pontos foram calculados corretamente:
 *     - Placar exato (2×1) → 3 pts
 *     - Resultado correto (1×0) → 1 pt
 *     - Resultado errado (0×1) → 0 pts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Pega o primeiro bolão disponível
  const bolao = await prisma.bolao.findFirst({ include: { members: true } });
  if (!bolao) {
    console.error("Nenhum bolão encontrado. Crie um bolão primeiro.");
    process.exit(1);
  }
  console.log(`Usando bolão: ${bolao.name}`);

  const members = bolao.members;
  if (members.length === 0) {
    console.error("O bolão não tem membros. Adicione membros primeiro.");
    process.exit(1);
  }
  console.log(`Membros: ${members.length}`);

  // Cria a rodada
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  const rodada = await prisma.rodada.create({
    data: {
      bolaoId: bolao.id,
      name: "Teste de Pontuação",
      deadline,
    },
  });
  console.log(`\nRodada criada: ${rodada.id}`);

  // Cria as partidas
  const [partida1, partida2] = await Promise.all([
    prisma.partida.create({
      data: { rodadaId: rodada.id, homeTeam: "Brasil", awayTeam: "Argentina" },
    }),
    prisma.partida.create({
      data: { rodadaId: rodada.id, homeTeam: "França", awayTeam: "Alemanha" },
    }),
  ]);
  console.log(`Partidas criadas: ${partida1.id}, ${partida2.id}`);

  // Palpites variados para a partida 1 (Brasil × Argentina)
  // Para testar o resultado correto, defina Brasil 2 × 1 Argentina no admin.
  const palpitesP1: Array<{ home: number; away: number }> = [
    { home: 2, away: 1 }, // placar exato → 3 pts
    { home: 3, away: 0 }, // resultado correto (Brasil vence) → 1 pt
    { home: 1, away: 0 }, // resultado correto → 1 pt
    { home: 0, away: 1 }, // resultado errado → 0 pts
    { home: 1, away: 1 }, // resultado errado (empate) → 0 pts
  ];

  for (let i = 0; i < members.length; i++) {
    const { home, away } = palpitesP1[i % palpitesP1.length];
    await prisma.palpite.upsert({
      where: { userId_partidaId: { userId: members[i].userId, partidaId: partida1.id } },
      create: { userId: members[i].userId, partidaId: partida1.id, homeScore: home, awayScore: away },
      update: { homeScore: home, awayScore: away, pontos: null },
    });
    console.log(`  Palpite p1 [membro ${i + 1}]: ${home} × ${away}`);
  }

  // Palpites para a partida 2 (França × Alemanha)
  const palpitesP2: Array<{ home: number; away: number }> = [
    { home: 1, away: 1 }, // empate exato → 3 pts
    { home: 2, away: 2 }, // empate, não exato → 1 pt
    { home: 2, away: 0 }, // resultado errado → 0 pts
  ];

  for (let i = 0; i < members.length; i++) {
    const { home, away } = palpitesP2[i % palpitesP2.length];
    await prisma.palpite.upsert({
      where: { userId_partidaId: { userId: members[i].userId, partidaId: partida2.id } },
      create: { userId: members[i].userId, partidaId: partida2.id, homeScore: home, awayScore: away },
      update: { homeScore: home, awayScore: away, pontos: null },
    });
    console.log(`  Palpite p2 [membro ${i + 1}]: ${home} × ${away}`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Cenário criado com sucesso!

Admin URL:
  http://localhost:3000/admin/partidas/${rodada.id}/resultado

Teste sugerido — registre Brasil 2 × 1 Argentina:
  Membro 1: palpitou 2×1 → esperado 3 pts  (exato)
  Membro 2: palpitou 3×0 → esperado 1 pt   (vencedor certo)
  Membro 3: palpitou 1×0 → esperado 1 pt   (vencedor certo)
  Membro 4: palpitou 0×1 → esperado 0 pts  (errou)
  Membro 5: palpitou 1×1 → esperado 0 pts  (errou)

Teste sugerido — registre França 1 × 1 Alemanha:
  Membro 1: palpitou 1×1 → esperado 3 pts  (exato)
  Membro 2: palpitou 2×2 → esperado 1 pt   (empate certo)
  Membro 3: palpitou 2×0 → esperado 0 pts  (errou)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
