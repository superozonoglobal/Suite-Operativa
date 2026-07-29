import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { listUsers, updateUserRole } from "@/lib/services/users";

const TEST_EMAILS = ["users-test-target@example.com", "users-test-actor@example.com"];

describe("users service", () => {
  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
  });

  it("lists users", async () => {
    const users = await listUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  it("never includes passwordHash in listUsers results", async () => {
    const user = await prisma.user.create({
      data: {
        email: "users-test-actor@example.com",
        name: "Actor",
        level: "COLABORADOR",
        passwordHash: "some-bcrypt-hash",
      },
    });

    const users = await listUsers();
    const found = users.find((u) => u.id === user.id) as unknown as Record<string, unknown>;
    expect(found).toBeDefined();
    expect(found.passwordHash).toBeUndefined();
    expect("passwordHash" in found).toBe(false);
  });

  describe("updateUserRole", () => {
    it("rejects a role change attempted by a COLABORADOR-level actor", async () => {
      const target = await prisma.user.create({
        data: { email: "users-test-target@example.com", name: "Target", level: "COLABORADOR" },
      });
      const actor = await prisma.user.create({
        data: { email: "users-test-actor@example.com", name: "Actor", level: "COLABORADOR" },
      });

      await expect(
        updateUserRole(target.id, { roleTag: "DISENADOR" }, actor)
      ).rejects.toThrow(/permission|forbidden/i);
    });

    it("allows a LIDER-level actor to change roles", async () => {
      const target = await prisma.user.create({
        data: { email: "users-test-target@example.com", name: "Target", level: "COLABORADOR" },
      });
      const actor = await prisma.user.create({
        data: { email: "users-test-actor@example.com", name: "Actor", level: "LIDER" },
      });

      const updated = await updateUserRole(target.id, { roleTag: "DISENADOR", level: "LIDER" }, actor);
      expect(updated.roleTag).toBe("DISENADOR");
      expect(updated.level).toBe("LIDER");
    });

    it("allows a PROJECT_MANAGER-level actor to change roles", async () => {
      const target = await prisma.user.create({
        data: { email: "users-test-target@example.com", name: "Target", level: "COLABORADOR" },
      });
      const actor = await prisma.user.create({
        data: { email: "users-test-actor@example.com", name: "Actor", level: "PROJECT_MANAGER" },
      });

      const updated = await updateUserRole(target.id, { roleTag: "COPYWRITING" }, actor);
      expect(updated.roleTag).toBe("COPYWRITING");
    });

    it("rejects a LIDER granting themselves SUPERUSER (self-escalation)", async () => {
      const actor = await prisma.user.create({
        data: { email: "users-test-actor@example.com", name: "Actor", level: "LIDER" },
      });

      await expect(
        updateUserRole(actor.id, { level: "SUPERUSER" }, actor)
      ).rejects.toThrow(/forbidden|permission/i);
    });

    it("rejects an actor granting a level higher than their own to someone else", async () => {
      const target = await prisma.user.create({
        data: { email: "users-test-target@example.com", name: "Target", level: "COLABORADOR" },
      });
      const actor = await prisma.user.create({
        data: { email: "users-test-actor@example.com", name: "Actor", level: "PROJECT_MANAGER" },
      });

      await expect(
        updateUserRole(target.id, { level: "SUPERUSER" }, actor)
      ).rejects.toThrow(/forbidden|permission/i);
    });

    it("rejects a LIDER attempting to change a PROJECT_MANAGER's level", async () => {
      const target = await prisma.user.create({
        data: { email: "users-test-target@example.com", name: "Target", level: "PROJECT_MANAGER" },
      });
      const actor = await prisma.user.create({
        data: { email: "users-test-actor@example.com", name: "Actor", level: "LIDER" },
      });

      await expect(
        updateUserRole(target.id, { level: "COLABORADOR" }, actor)
      ).rejects.toThrow(/forbidden|permission/i);
    });

    it("rejects any actor editing their own level, even a SUPERUSER", async () => {
      const actor = await prisma.user.create({
        data: { email: "users-test-actor@example.com", name: "Actor", level: "SUPERUSER" },
      });

      await expect(
        updateUserRole(actor.id, { level: "PROJECT_MANAGER" }, actor)
      ).rejects.toThrow(/forbidden|permission/i);
    });
  });
});
