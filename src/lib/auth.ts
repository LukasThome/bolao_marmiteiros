import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,

    // Dev bypass (apenas em desenvolvimento)
    ...(process.env.NODE_ENV === "development" && process.env.DEV_USER_EMAIL
      ? [
          Credentials({
            id: "dev-bypass",
            name: "Dev Bypass",
            credentials: {},
            async authorize() {
              return {
                id: "000000000000000000000001",
                email: process.env.DEV_USER_EMAIL!,
                name: process.env.DEV_USER_NAME ?? "Dev User",
                role: "ADMIN",
              };
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Credentials provider (dev bypass) already sets role on user object
        const credRole = (user as { role?: string }).role;
        if (credRole) {
          token.role = credRole;
        } else {
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
