import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  registerUser,
  EmailNotAllowedError,
  AlreadyRegisteredError,
  RequiresAdminSetupError,
} from "@/lib/services/register";

const TEST_EMAILS = [
  "colaborador@superozonoglobal.com",
  "leo.superuser-test@example.com",
  "outsider@gmail.com",
  "existing-user-no-password@superozonoglobal.com",
  "role-test@superozonoglobal.com",
  "passwordless-superuser@superozonoglobal.com",
  "passwordless-pm@superozonoglobal.com",
];

describe("registerUser", () => {
  beforeEach(() => {
    process.env.SEED_SUPERUSER_EMAIL = "leo.superuser-test@example.com";
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

  it("bootstraps SUPERUSER level for the seed superuser email", async () => {
    const user = await registerUser({
      name: "Leo",
      email: "leo.superuser-test@example.com",
      password: "password123",
    });
    expect(user.level).toBe("SUPERUSER");
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

  it("links a password onto an existing passwordless user without changing their level", async () => {
    await prisma.user.create({
      data: {
        email: "existing-user-no-password@superozonoglobal.com",
        name: "Existing User",
        level: "LIDER",
      },
    });

    const user = await registerUser({
      name: "Existing User",
      email: "existing-user-no-password@superozonoglobal.com",
      password: "password123",
    });

    expect(user.level).toBe("LIDER");
    expect(user.passwordHash).not.toBeNull();
  });

  it("persists the self-declared roleTag", async () => {
    const user = await registerUser({
      name: "Role Test",
      email: "role-test@superozonoglobal.com",
      password: "password123",
      roleTag: "DISENADOR",
    });
    expect(user.roleTag).toBe("DISENADOR");
  });

  it("rejects claiming a passwordless SUPERUSER row via self-registration", async () => {
    await prisma.user.create({
      data: {
        email: "passwordless-superuser@superozonoglobal.com",
        name: "Pre-assigned Superuser",
        level: "SUPERUSER",
      },
    });

    await expect(
      registerUser({
        name: "Attacker",
        email: "passwordless-superuser@superozonoglobal.com",
        password: "password123",
      })
    ).rejects.toThrow(RequiresAdminSetupError);
  });

  it("rejects claiming a passwordless PROJECT_MANAGER row via self-registration", async () => {
    await prisma.user.create({
      data: {
        email: "passwordless-pm@superozonoglobal.com",
        name: "Pre-assigned PM",
        level: "PROJECT_MANAGER",
      },
    });

    await expect(
      registerUser({
        name: "Attacker",
        email: "passwordless-pm@superozonoglobal.com",
        password: "password123",
      })
    ).rejects.toThrow(RequiresAdminSetupError);
  });

  it("leaves roleTag null when not provided", async () => {
    const user = await registerUser({
      name: "Colaborador Test",
      email: "colaborador@superozonoglobal.com",
      password: "password123",
    });
    expect(user.roleTag).toBeNull();
  });
});
