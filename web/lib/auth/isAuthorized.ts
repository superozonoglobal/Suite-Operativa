import type { Session } from "next-auth";

export function isAuthorized(auth: Session | null): boolean {
  return !!auth?.user;
}
