import type { JWT } from "next-auth/jwt";

export function resolveJwtToken(
  token: JWT,
  dbUser: { level: string; roleTag: string | null } | null
): JWT | null {
  if (!dbUser) return null;

  token.level = dbUser.level;
  token.roleTag = dbUser.roleTag;
  return token;
}
