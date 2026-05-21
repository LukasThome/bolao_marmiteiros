import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold">🍱 Bolão dos Marmiteiros</h1>
      <p className="mt-2 text-gray-400">Bem-vindo, {session?.user?.name}!</p>
      <p className="mt-6 text-gray-500 text-sm">Em construção — fase 2: autenticação ✅</p>
    </main>
  );
}
