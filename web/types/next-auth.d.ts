import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      level?: string;
      roleTag?: string | null;
    } & DefaultSession["user"];
  }
}
