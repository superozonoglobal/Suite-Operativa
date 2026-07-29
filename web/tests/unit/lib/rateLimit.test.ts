import { describe, it, expect } from "vitest";
import { RateLimiter } from "@/lib/rateLimit";

describe("RateLimiter", () => {
  it("allows attempts up to the max within the window", () => {
    const limiter = new RateLimiter(3, 60_000);
    const now = 1000;
    expect(limiter.check("a@example.com", now)).toBe(true);
    expect(limiter.check("a@example.com", now)).toBe(true);
    expect(limiter.check("a@example.com", now)).toBe(true);
  });

  it("blocks once the max attempts is exceeded within the window", () => {
    const limiter = new RateLimiter(3, 60_000);
    const now = 1000;
    limiter.check("a@example.com", now);
    limiter.check("a@example.com", now);
    limiter.check("a@example.com", now);
    expect(limiter.check("a@example.com", now)).toBe(false);
  });

  it("tracks separate keys independently", () => {
    const limiter = new RateLimiter(1, 60_000);
    const now = 1000;
    expect(limiter.check("a@example.com", now)).toBe(true);
    expect(limiter.check("b@example.com", now)).toBe(true);
    expect(limiter.check("a@example.com", now)).toBe(false);
  });

  it("resets the count after the window passes", () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.check("a@example.com", 1000);
    expect(limiter.check("a@example.com", 1000)).toBe(false);
    expect(limiter.check("a@example.com", 1000 + 60_001)).toBe(true);
  });
});
