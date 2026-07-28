import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      level?: string;
      roleTag?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    level?: string;
    roleTag?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    level?: string;
    roleTag?: string | null;
  }
}
