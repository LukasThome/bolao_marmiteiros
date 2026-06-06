import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuditoriaCreate = vi.fn();
const mockAuditoriafindMany = vi.fn();
const mockAuditoriaCount = vi.fn();
const mockBolaoMemberFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditoriaPontos: {
      create: mockAuditoriaCreate,
      findMany: mockAuditoriafindMany,
      count: mockAuditoriaCount,
    },
    bolaoMember: {
      findUnique: mockBolaoMemberFindUnique,
    },
  },
}));

const { registrarAuditoria, obterHistoricoPontos } = await import(
  "@/features/boloes/lib/auditoria"
);

describe("Auditoria de Pontos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registrarAuditoria", () => {
    it("registra uma transação de auditoria com saldo antes e depois", async () => {
      mockBolaoMemberFindUnique.mockResolvedValue({ totalPts: 10 });
      mockAuditoriaCreate.mockResolvedValue({ id: "audit-1" });

      await registrarAuditoria(
        "user-1",
        "bolao-1",
        "PALPITE_ACERTADO",
        3,
        "Acerto exato",
        "palpite-1",
        "partida-1"
      );

      expect(mockAuditoriaCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          bolaoId: "bolao-1",
          tipo: "PALPITE_ACERTADO",
          pontos: 3,
          saldoAntes: 10,
          saldoDepois: 13,
          descricao: "Acerto exato",
          palpiteId: "palpite-1",
          partidaId: "partida-1",
        },
      });
    });

    it("calcula saldo corretamente quando membro não existe", async () => {
      mockBolaoMemberFindUnique.mockResolvedValue(null);
      mockAuditoriaCreate.mockResolvedValue({ id: "audit-1" });

      await registrarAuditoria("user-novo", "bolao-1", "PALPITE_ACERTADO", 1);

      expect(mockAuditoriaCreate).toHaveBeenCalledWith({
        data: {
          userId: "user-novo",
          bolaoId: "bolao-1",
          tipo: "PALPITE_ACERTADO",
          pontos: 1,
          saldoAntes: 0,
          saldoDepois: 1,
          descricao: undefined,
          palpiteId: undefined,
          partidaId: undefined,
        },
      });
    });

    it("registra auditoria de ajuste manual", async () => {
      mockBolaoMemberFindUnique.mockResolvedValue({ totalPts: 5 });
      mockAuditoriaCreate.mockResolvedValue({ id: "audit-2" });

      await registrarAuditoria(
        "user-1",
        "bolao-1",
        "AJUSTE_MANUAL",
        -2,
        "Ajuste por erro de sistema"
      );

      expect(mockAuditoriaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: "AJUSTE_MANUAL",
          pontos: -2,
          saldoAntes: 5,
          saldoDepois: 3,
          descricao: "Ajuste por erro de sistema",
        }),
      });
    });

    it("registra auditoria de reversão", async () => {
      mockBolaoMemberFindUnique.mockResolvedValue({ totalPts: 10 });
      mockAuditoriaCreate.mockResolvedValue({ id: "audit-3" });

      await registrarAuditoria(
        "user-1",
        "bolao-1",
        "REVERSAO",
        -3,
        "Resultado alterado, removendo pontos"
      );

      expect(mockAuditoriaCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo: "REVERSAO",
          pontos: -3,
        }),
      });
    });
  });

  describe("obterHistoricoPontos", () => {
    it("retorna histórico de pontos com paginação", async () => {
      const registros = [
        { id: "1", pontos: 3, createdAt: new Date() },
        { id: "2", pontos: 1, createdAt: new Date() },
      ];

      mockAuditoriafindMany.mockResolvedValue(registros);
      mockAuditoriaCount.mockResolvedValue(10);

      const resultado = await obterHistoricoPontos("user-1", "bolao-1", 2, 0);

      expect(resultado).toEqual({
        registros,
        total: 10,
      });

      expect(mockAuditoriafindMany).toHaveBeenCalledWith({
        where: { userId: "user-1", bolaoId: "bolao-1" },
        orderBy: { createdAt: "desc" },
        take: 2,
        skip: 0,
      });
    });

    it("respira paginação correta", async () => {
      mockAuditoriafindMany.mockResolvedValue([]);
      mockAuditoriaCount.mockResolvedValue(50);

      await obterHistoricoPontos("user-1", "bolao-1", 25, 25);

      expect(mockAuditoriafindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 25,
        })
      );
    });
  });
});
