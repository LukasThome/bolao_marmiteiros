import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/mongodb-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Dev bypass (apenas em desenvolvimento) ──────────────
    ...(process.env.NODE_ENV === "development" && process.env.DEV_USER_EMAIL
      ? [
          Credentials({
            id: "dev-bypass",
            name: "Dev Bypass",
            credentials: {},
            async authorize() {
              return {
                id: "dev-user-id",
                email: process.env.DEV_USER_EMAIL!,
                name: process.env.DEV_USER_NAME ?? "Dev User",
                role: "ADMIN",
              };
            },
          }),
        ]
      : []),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Buscar role do banco na primeira emissão
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "MEMBER";
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

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
