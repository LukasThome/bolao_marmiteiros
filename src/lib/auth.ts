import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email e Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),

    // Dev bypass (apenas em desenvolvimento)
    ...(process.env.NODE_ENV === "development" && process.env.DEV_USER_EMAIL
      ? [
          Credentials({
            id: "dev-bypass",
            name: "Dev Bypass",
            credentials: {},
            async authorize() {
              let dbUser = await prisma.user.findUnique({
                where: { email: process.env.DEV_USER_EMAIL! },
              });
              if (!dbUser) {
                dbUser = await prisma.user.create({
                  data: {
                    email: process.env.DEV_USER_EMAIL!,
                    name: process.env.DEV_USER_NAME ?? "Dev User",
                    role: "ADMIN",
                  },
                });
              }
              return { id: dbUser.id, email: dbUser.email, name: dbUser.name, role: dbUser.role };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;

        // Garante que o role vem do banco (Credentials retorna role diretamente)
        if (!token.role) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { role: true },
          });
          token.role = dbUser?.role ?? "MEMBER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
