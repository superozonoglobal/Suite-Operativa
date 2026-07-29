import { describe, it, expect, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorizeCredentials } from "@/lib/auth/authorizeCredentials";
import { RateLimiter } from "@/lib/rateLimit";

const TEST_EMAIL = "authorize-test@example.com";

describe("authorizeCredentials", () => {
  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  });

  it("returns null when email or password is missing", async () => {
    const limiter = new RateLimiter(5, 60_000);
    expect(await authorizeCredentials(undefined, "password123", limiter)).toBeNull();
    expect(await authorizeCredentials(TEST_EMAIL, undefined, limiter)).toBeNull();
  });

  it("returns the user for correct credentials", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, name: "Test User", passwordHash },
    });

    const limiter = new RateLimiter(5, 60_000);
    const result = await authorizeCredentials(TEST_EMAIL, "password123", limiter);
    expect(result).toEqual({ id: user.id, email: TEST_EMAIL, name: "Test User" });
  });

  it("returns null for a wrong password", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    await prisma.user.create({ data: { email: TEST_EMAIL, name: "Test User", passwordHash } });

    const limiter = new RateLimiter(5, 60_000);
    expect(await authorizeCredentials(TEST_EMAIL, "wrong-password", limiter)).toBeNull();
  });

  it("returns null for a nonexistent user without throwing", async () => {
    const limiter = new RateLimiter(5, 60_000);
    expect(await authorizeCredentials("nobody@example.com", "anything123", limiter)).toBeNull();
  });

  it("rate-limits repeated attempts for the same email", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    await prisma.user.create({ data: { email: TEST_EMAIL, name: "Test User", passwordHash } });

    const limiter = new RateLimiter(2, 60_000);
    await authorizeCredentials(TEST_EMAIL, "wrong-password", limiter);
    await authorizeCredentials(TEST_EMAIL, "wrong-password", limiter);

    // third attempt is rate-limited even with the CORRECT password
    const result = await authorizeCredentials(TEST_EMAIL, "password123", limiter);
    expect(result).toBeNull();
  });
});
