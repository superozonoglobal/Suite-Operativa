import { describe, it, expect } from "vitest";
import { registerSchema } from "@/lib/validation/register";

const base = { name: "Test User", email: "test@example.com" };

describe("registerSchema password rules", () => {
  it("accepts a password with 8+ chars, an uppercase letter, and a number", () => {
    const result = registerSchema.safeParse({ ...base, password: "Password1" });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...base, password: "Pass1a" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no uppercase letter", () => {
    const result = registerSchema.safeParse({ ...base, password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no number", () => {
    const result = registerSchema.safeParse({ ...base, password: "Passwordabc" });
    expect(result.success).toBe(false);
  });
});
