import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { Prisma } from "@prisma/client";
import Link from "next/link";

export default async function NewBolaoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function createBolao(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");

    const name = (formData.get("name") as string)?.trim();
    if (!name) return;

    const slug = slugify(name);

    let bolaoSlug: string;
    try {
      const bolao = await prisma.bolao.create({
        data: {
          name,
          slug,
          members: { create: { userId: session.user.id } },
        },
      });
      bolaoSlug = bolao.slug;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        redirect("/admin/boloes/new?error=slug-exists");
      }
      redirect("/admin/boloes/new?error=unknown");
    }

    redirect(`/admin/rodadas/${bolaoSlug}/new`);
  }

  const errorMsg: Record<string, string> = {
    "slug-exists": "Já existe um bolão com esse nome. Tente outro.",
    "unknown": "Erro inesperado ao criar o bolão.",
  };

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="text-sm mb-6 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold mb-6">Novo Bolão</h1>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--danger)", color: "var(--danger)" }}
          >
            {errorMsg[error] ?? "Erro desconhecido."}
          </div>
        )}

        <form action={createBolao} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Nome do bolão
            </label>
            <input
              name="name"
              required
              placeholder="Ex: Brasileirão 2025"
              className="rounded-lg px-4 py-2.5 outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
                color: "var(--text-primary)",
              }}
            />
          </div>

          <button
            type="submit"
            className="font-semibold rounded-lg px-4 py-2.5 transition-colors"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            Criar bolão →
          </button>
        </form>

        <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          Após criar o bolão, você poderá adicionar rodadas e partidas.
        </p>
      </div>
    </main>
  );
}
