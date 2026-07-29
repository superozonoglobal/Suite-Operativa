import { describe, it, expect } from "vitest";
import { isAtLeastLevel } from "@/lib/authz";

describe("isAtLeastLevel", () => {
  it("returns true when the actor outranks the minimum", () => {
    expect(isAtLeastLevel("SUPERUSER", "LIDER")).toBe(true);
  });

  it("returns true when the actor exactly matches the minimum", () => {
    expect(isAtLeastLevel("LIDER", "LIDER")).toBe(true);
  });

  it("returns false when the actor is below the minimum", () => {
    expect(isAtLeastLevel("COLABORADOR", "LIDER")).toBe(false);
  });
});
