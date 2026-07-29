import { describe, it, expect } from "vitest";
import { isAuthorized } from "@/lib/auth/isAuthorized";
import type { Session } from "next-auth";

describe("isAuthorized", () => {
  it("rejects a null session", () => {
    expect(isAuthorized(null)).toBe(false);
  });

  it("rejects a session with no user", () => {
    expect(isAuthorized({ expires: "2099-01-01" } as Session)).toBe(false);
  });

  it("allows a session with a user", () => {
    const session = { user: { id: "u1" }, expires: "2099-01-01" } as Session;
    expect(isAuthorized(session)).toBe(true);
  });
});
