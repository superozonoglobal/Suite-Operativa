import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
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
  ],
  session: { strategy: "database" },
  callbacks: {
    async signIn({ user }) {
      return isEmailAllowed(user.email ?? "");
    },
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        const sessionUser = session.user as typeof session.user & {
          level?: string;
          roleTag?: string | null;
        };
        sessionUser.level = dbUser?.level;
        sessionUser.roleTag = dbUser?.roleTag ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const email = (user.email ?? "").toLowerCase();
      const directorEmail = (process.env.SEED_DIRECTOR_EMAIL ?? "").toLowerCase();
      if (email === directorEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { level: "DIRECTOR" },
        });
      }
    },
  },
});
