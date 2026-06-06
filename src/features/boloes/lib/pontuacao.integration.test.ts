import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { calcularPontos } from "@/features/boloes/lib/score";
import { pontuarPalpites } from "@/features/boloes/lib/pontuacao";
import { randomUUID } from "crypto";

describe("Fluxo de pontuação: integração completa", () => {
  let bolaoId: string;
  let rodadaId: string;
  let userId1: string;
  let userId2: string;
  let partidaId: string;

  beforeAll(async () => {
    // Cria um bolão de teste
    const bolao = await prisma.bolao.create({
      data: {
        name: "Teste Pontuação",
        slug: `teste-${randomUUID()}`,
      },
    });
    bolaoId = bolao.id;

    // Cria usuários
    const user1 = await prisma.user.create({
      data: {
        email: `user1-${randomUUID()}@test.com`,
        name: "Usuário 1",
      },
    });
    userId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: `user2-${randomUUID()}@test.com`,
        name: "Usuário 2",
      },
    });
    userId2 = user2.id;

    // Adiciona membros ao bolão
    await prisma.bolaoMember.create({
      data: { bolaoId, userId: userId1 },
    });
    await prisma.bolaoMember.create({
      data: { bolaoId, userId: userId2 },
    });

    // Cria uma rodada
    const rodada = await prisma.rodada.create({
      data: {
        bolaoId,
        name: "Teste Rodada 1",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    rodadaId = rodada.id;

    // Cria uma partida
    const partida = await prisma.partida.create({
      data: {
        rodadaId,
        homeTeam: "Brazil",
        awayTeam: "Argentina",
        group: "GROUP_C",
      },
    });
    partidaId = partida.id;

    // Cria palpites
    await prisma.palpite.create({
      data: {
        userId: userId1,
        partidaId,
        homeScore: 2,
        awayScore: 1,
      },
    });

    await prisma.palpite.create({
      data: {
        userId: userId2,
        partidaId,
        homeScore: 1,
        awayScore: 1,
      },
    });
  });

  afterAll(async () => {
    // Limpa dados de teste
    await prisma.palpite.deleteMany({ where: { partida: { rodadaId } } });
    await prisma.partida.deleteMany({ where: { rodadaId } });
    await prisma.rodada.delete({ where: { id: rodadaId } });
    await prisma.bolaoMember.deleteMany({ where: { bolaoId } });
    await prisma.bolao.delete({ where: { id: bolaoId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId1, userId2] } } });
  });

  it("Fluxo: palpites → resultado → pontuação → ranking", async () => {
    // 1. Verifica palpites iniciais
    const palpitesInicial = await prisma.palpite.findMany({
      where: { partida: { rodadaId } },
      include: { user: true },
    });

    expect(palpitesInicial).toHaveLength(2);
    expect(palpitesInicial[0].pontos).toBeNull();
    expect(palpitesInicial[1].pontos).toBeNull();

    // 2. Simula resultado da partida: Brazil 2 × 1 Argentina
    const resultado = { homeScore: 2, awayScore: 1 };

    await prisma.partida.update({
      where: { id: partidaId },
      data: { ...resultado, status: "FINISHED" },
    });

    // 3. Calcula pontuação
    const palpites = await prisma.palpite.findMany({
      where: { partidaId },
      include: { partida: { include: { rodada: { include: { bolao: true } } } } },
    });

    await pontuarPalpites(palpites, resultado);

    // 4. Verifica pontos atribuídos
    const palpite1 = await prisma.palpite.findUnique({
      where: { id: palpites[0].id },
    });
    const palpite2 = await prisma.palpite.findUnique({
      where: { id: palpites[1].id },
    });

    // User 1: palpite 2 × 1 → acerto exato (3 pts)
    expect(palpite1?.pontos).toBe(3);

    // User 2: palpite 1 × 1 → erro (0 pts)
    expect(palpite2?.pontos).toBe(0);

    // 5. Verifica ranking
    const ranking = await prisma.bolaoMember.findMany({
      where: { bolaoId },
      include: { user: true },
      orderBy: { totalPts: "desc" },
    });

    expect(ranking[0].totalPts).toBe(3); // User 1
    expect(ranking[1].totalPts).toBe(0); // User 2
  });

  it("Múltiplos resultados acumulam pontos corretamente", async () => {
    // Cria segunda partida
    const partida2 = await prisma.partida.create({
      data: {
        rodadaId,
        homeTeam: "France",
        awayTeam: "Germany",
        group: "GROUP_F",
      },
    });

    // Cria novo palpite para user1
    await prisma.palpite.create({
      data: {
        userId: userId1,
        partidaId: partida2.id,
        homeScore: 1,
        awayScore: 0,
      },
    });

    // Simula resultado
    await prisma.partida.update({
      where: { id: partida2.id },
      data: { homeScore: 1, awayScore: 0, status: "FINISHED" },
    });

    const palpites = await prisma.palpite.findMany({
      where: { partidaId: partida2.id },
      include: { partida: { include: { rodada: { include: { bolao: true } } } } },
    });

    await pontuarPalpites(palpites, { homeScore: 1, awayScore: 0 });

    // Verifica pontos acumulados
    const member = await prisma.bolaoMember.findUnique({
      where: { userId_bolaoId: { userId: userId1, bolaoId } },
    });

    // User1 agora deve ter 6 pts (3 da primeira + 3 da segunda)
    expect(member?.totalPts).toBe(6);

    // Limpa
    await prisma.palpite.deleteMany({ where: { partidaId: partida2.id } });
    await prisma.partida.delete({ where: { id: partida2.id } });
  });
});
