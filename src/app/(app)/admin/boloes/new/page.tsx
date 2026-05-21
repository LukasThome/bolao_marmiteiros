import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import Link from "next/link";

export default async function NewBolaoPage() {
  async function createBolao(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/login");

    const name = (formData.get("name") as string)?.trim();
    if (!name) return;

    const slug = slugify(name);

    try {
      const bolao = await prisma.bolao.create({
        data: {
          name,
          slug,
          members: { create: { userId: session.user.id } },
        },
      });
      redirect(`/admin/rodadas/${bolao.slug}/new`);
    } catch {
      redirect("/admin/boloes/new?error=slug-exists");
    }
  }

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="text-sm mb-6 inline-block" style={{ color: "var(--text-secondary)" }}>
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold mb-6">Novo Bolão</h1>

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
