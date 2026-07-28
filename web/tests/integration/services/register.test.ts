import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser, EmailNotAllowedError, AlreadyRegisteredError } from "@/lib/services/register";

const TEST_EMAILS = [
  "colaborador@superozonoglobal.com",
  "diego.azcarate@example.com",
  "outsider@gmail.com",
  "existing-google-user@superozonoglobal.com",
];

describe("registerUser", () => {
  beforeEach(() => {
    process.env.SEED_DIRECTOR_EMAIL = "diego.azcarate@example.com";
    process.env.ALLOWED_EMAIL_DOMAIN = "superozonoglobal.com";
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
  });

  it("rejects an email that is not on the allow-list", async () => {
    await expect(
      registerUser({ name: "Outsider", email: "outsider@gmail.com", password: "password123" })
    ).rejects.toThrow(EmailNotAllowedError);
  });

  it("creates a new user with COLABORADOR level for a normal allowed email", async () => {
    const user = await registerUser({
      name: "Colaborador Test",
      email: "colaborador@superozonoglobal.com",
      password: "password123",
    });
    expect(user.level).toBe("COLABORADOR");
    expect(user.passwordHash).not.toBeNull();
    expect(user.passwordHash).not.toBe("password123");
  });

  it("bootstraps DIRECTOR level for the seed director email", async () => {
    const user = await registerUser({
      name: "Diego",
      email: "diego.azcarate@example.com",
      password: "password123",
    });
    expect(user.level).toBe("DIRECTOR");
  });

  it("rejects registering twice with the same email", async () => {
    await registerUser({
      name: "Colaborador Test",
      email: "colaborador@superozonoglobal.com",
      password: "password123",
    });

    await expect(
      registerUser({ name: "Colaborador Test", email: "colaborador@superozonoglobal.com", password: "otherpassword" })
    ).rejects.toThrow(AlreadyRegisteredError);
  });

  it("links a password onto an existing Google-created user without changing their level", async () => {
    await prisma.user.create({
      data: {
        email: "existing-google-user@superozonoglobal.com",
        name: "Existing Google User",
        level: "LIDER",
      },
    });

    const user = await registerUser({
      name: "Existing Google User",
      email: "existing-google-user@superozonoglobal.com",
      password: "password123",
    });

    expect(user.level).toBe("LIDER");
    expect(user.passwordHash).not.toBeNull();
  });
});
