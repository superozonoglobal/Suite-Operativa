import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/authAllowList";
import { resolveJwtToken } from "@/lib/auth/resolveJwtToken";
import { isAuthorized } from "@/lib/auth/isAuthorized";
import { authorizeCredentials } from "@/lib/auth/authorizeCredentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        return authorizeCredentials(
          credentials?.email as string | undefined,
          credentials?.password as string | undefined
        );
      },
    }),
  ],
  // Credentials-only auth: sessions are always JWT (no adapter, see ADR-0010).
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ user }) {
      return isEmailAllowed(user.email ?? "");
    },
    authorized({ auth }) {
      return isAuthorized(auth);
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
      return resolveJwtToken(token, dbUser);
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.level = token.level;
        session.user.roleTag = token.roleTag ?? null;
      }
      return session;
    },
  },
});
