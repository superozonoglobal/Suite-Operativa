import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/authAllowList";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  // Credentials provider does not support database-persisted sessions
  // (Auth.js constraint, not a design choice) — see ADR-0008.
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      return isEmailAllowed(user.email ?? "");
    },
    async jwt({ token }) {
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        token.level = dbUser?.level;
        token.roleTag = dbUser?.roleTag ?? null;
      }
      return token;
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
  events: {
    async createUser({ user }) {
      const email = (user.email ?? "").toLowerCase();
      const superuserEmail = (process.env.SEED_SUPERUSER_EMAIL ?? "").toLowerCase();
      if (email === superuserEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { level: "SUPERUSER" },
        });
      }
    },
  },
});
