/**
 * Importa todos os jogos da fase de grupos da Copa do Mundo 2026
 * da API football-data.org e cria bolão + rodadas + partidas no banco.
 *
 * Uso: npm run db:seed-copa2026
 * Requer: FOOTBALL_DATA_API_KEY e DEV_USER_EMAIL no .env
 */
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const ADMIN_EMAIL = process.env.DEV_USER_EMAIL;
const BASE_URL = "https://api.football-data.org/v4";

type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
};

async function fetchGroupStage(): Promise<FdMatch[]> {
  const res = await fetch(
    `${BASE_URL}/competitions/WC/matches?stage=GROUP_STAGE&season=2026`,
    { headers: { "X-Auth-Token": API_KEY! } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`football-data.org retornou ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.matches as FdMatch[];
}

async function main() {
  if (!API_KEY) throw new Error("FOOTBALL_DATA_API_KEY não definido no .env");
  if (!ADMIN_EMAIL) throw new Error("DEV_USER_EMAIL não definido no .env");

  console.log("🌍 Buscando jogos da Copa do Mundo 2026 (fase de grupos)...");
  const matches = await fetchGroupStage();
  console.log(`   ${matches.length} jogos encontrados`);

  // Admin como dono do bolão
  const adminUser = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!adminUser) {
    throw new Error(
      `Usuário admin não encontrado para o email "${ADMIN_EMAIL}". ` +
      `Faça login pelo dev bypass primeiro para criar o registro no banco.`
    );
  }

  // Cria ou reutiliza o bolão
  const BOLAO_SLUG = "copa-do-mundo-2026";
  let bolao = await prisma.bolao.findUnique({ where: { slug: BOLAO_SLUG } });
  if (!bolao) {
    bolao = await prisma.bolao.create({
      data: {
        name: "Copa do Mundo 2026",
        slug: BOLAO_SLUG,
        inviteToken: randomUUID(),
      },
    });
    console.log(`✅ Bolão criado: ${bolao.name}`);
  } else {
    console.log(`⚡ Bolão já existe: ${bolao.name}`);
  }

  // Garante que o admin é membro
  await prisma.bolaoMember.upsert({
    where: { userId_bolaoId: { userId: adminUser.id, bolaoId: bolao.id } },
    create: { userId: adminUser.id, bolaoId: bolao.id },
    update: {},
  });

  // Agrupa por matchday
  const byMatchday = new Map<number, FdMatch[]>();
  for (const m of matches) {
    if (!byMatchday.has(m.matchday)) byMatchday.set(m.matchday, []);
    byMatchday.get(m.matchday)!.push(m);
  }

  const matchdays = [...byMatchday.keys()].sort((a, b) => a - b);
  console.log(`\n📅 Criando ${matchdays.length} rodadas...`);

  for (const matchday of matchdays) {
    const dayMatches = byMatchday.get(matchday)!;

    // Deadline = horário do primeiro jogo da rodada
    const deadline = new Date(
      Math.min(...dayMatches.map((m) => new Date(m.utcDate).getTime()))
    );

    const rodadaName = `Fase de Grupos - Rodada ${matchday}`;

    let rodada = await prisma.rodada.findFirst({
      where: { bolaoId: bolao.id, name: rodadaName },
    });

    if (!rodada) {
      rodada = await prisma.rodada.create({
        data: { bolaoId: bolao.id, name: rodadaName, deadline },
      });
      console.log(`  ✅ Rodada ${matchday} criada (deadline: ${deadline.toLocaleString("pt-BR")})`);
    } else {
      console.log(`  ⚡ Rodada ${matchday} já existe`);
    }

    // Cria partidas (idempotente)
    let novas = 0;
    for (const match of dayMatches) {
      const exists = await prisma.partida.findFirst({
        where: {
          rodadaId: rodada.id,
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
        },
      });
      if (!exists) {
        await prisma.partida.create({
          data: {
            rodadaId: rodada.id,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            group: match.group,
            scheduledAt: new Date(match.utcDate),
          },
        });
        novas++;
      } else if (!exists.scheduledAt || !exists.group) {
        // Retroativamente preenche scheduledAt e group em partidas antigas
        await prisma.partida.update({
          where: { id: exists.id },
          data: {
            scheduledAt: new Date(match.utcDate),
            group: match.group,
          },
        });
      }
    }
    console.log(`     ${novas} partidas criadas, ${dayMatches.length - novas} já existiam`);
  }

  console.log("\n🏆 Importação concluída!");
  console.log(`   Bolão: /boloes/${bolao.slug}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
