import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/authAllowList";
import { resolveJwtToken } from "@/lib/auth/resolveJwtToken";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          omit: { passwordHash: false },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  // Credentials-only auth: sessions are always JWT (no adapter, see ADR-0010).
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  callbacks: {
    async signIn({ user }) {
      return isEmailAllowed(user.email ?? "");
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
