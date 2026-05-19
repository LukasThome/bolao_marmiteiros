import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "ADMIN" | "MEMBER";

/**
 * Verifica se a sessão atual pertence a um usuário autenticado.
 * Retorna a sessão ou uma NextResponse 401.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/**
 * Verifica se o usuário autenticado tem a role exigida.
 * Retorna a sessão ou uma NextResponse 401/403.
 */
export async function requireRole(requiredRole: Role) {
  const { session, error } = await requireAuth();
  if (error || !session) return { session: null, error };

  if (session.user.role !== requiredRole) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Acesso negado: permissão insuficiente" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

/**
 * Verifica se o usuário é ADMIN.
 * Atalho para requireRole("ADMIN").
 */
export async function requireAdmin() {
  return requireRole("ADMIN");
}
