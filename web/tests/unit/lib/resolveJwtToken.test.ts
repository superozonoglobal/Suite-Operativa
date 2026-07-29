import { describe, it, expect } from "vitest";
import { resolveJwtToken } from "@/lib/auth/resolveJwtToken";
import type { JWT } from "next-auth/jwt";

describe("resolveJwtToken", () => {
  it("invalidates the token when the user no longer exists in the DB", () => {
    const token = { sub: "user-1" } as JWT;
    const result = resolveJwtToken(token, null);
    expect(result).toBeNull();
  });

  it("refreshes level and roleTag from a live dbUser", () => {
    const token = { sub: "user-1", level: "COLABORADOR", roleTag: null } as JWT;
    const result = resolveJwtToken(token, { level: "SUPERUSER", roleTag: "DEVELOPER" });
    expect(result).not.toBeNull();
    expect(result?.level).toBe("SUPERUSER");
    expect(result?.roleTag).toBe("DEVELOPER");
  });
});
