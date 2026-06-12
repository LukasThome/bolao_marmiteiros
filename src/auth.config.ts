import type { NextAuthConfig } from "next-auth";

// Config sem Prisma — segura para rodar no Edge runtime (middleware/proxy)
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // /api/cron é protegido por CRON_SECRET (não por sessão), então é público para o middleware
      const publicPaths = ["/login", "/register", "/api/auth", "/api/register", "/join", "/api/cron"];
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
