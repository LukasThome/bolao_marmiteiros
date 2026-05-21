import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function NewRodadaPage({
  params,
}: {
  params: Promise<{ bolaoSlug: string }>;
}) {
  const { bolaoSlug } = await params;

  const bolao = await prisma.bolao.findUnique({ where: { slug: bolaoSlug } });
  if (!bolao) redirect("/dashboard");

  async function createRodada(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");

    const name = (formData.get("name") as string)?.trim();
    const deadline = formData.get("deadline") as string;
    if (!name || !deadline) return;

    const rodada = await prisma.rodada.create({
      data: {
        bolaoId: bolao!.id,
        name,
        deadline: new Date(deadline),
      },
    });

    redirect(`/admin/partidas/${rodada.id}/resultado`);
  }

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="text-sm mb-1 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>
        <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
          {bolao.name}
        </p>
        <h1 className="text-2xl font-bold mb-6">Nova Rodada</h1>

        <form action={createRodada} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Nome da rodada
            </label>
            <input
              name="name"
              required
              placeholder="Ex: Rodada 1"
              className="rounded-lg px-4 py-2.5 outline-none"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Deadline dos palpites
            </label>
            <input
              name="deadline"
              type="datetime-local"
              required
              className="rounded-lg px-4 py-2.5 outline-none"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <button
            type="submit"
            className="font-semibold rounded-lg px-4 py-2.5 transition-colors"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            Criar rodada →
          </button>
        </form>
      </div>
    </main>
  );
}
