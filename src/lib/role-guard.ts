import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "ADMIN" | "MEMBER";

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

export async function requireRole(requiredRole: Role) {
  const { session, error } = await requireAuth();
  if (error || !session) return { session: null, error };
  if (session.user.role !== requiredRole) {
    return {
      session: null,
      error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}
