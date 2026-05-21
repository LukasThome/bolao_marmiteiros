import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Config sem Prisma — segura para rodar no Edge runtime (middleware/proxy)
export const authConfig: NextAuthConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicPaths = ["/login", "/api/auth"];
      const isPublic = publicPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublic) return true;
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }
      return true;
    },
  },
};
