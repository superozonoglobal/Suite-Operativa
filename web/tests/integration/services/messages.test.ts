import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { listThread, sendMessage, markThreadRead, getAdminRecipient } from "@/lib/services/messages";

describe("messages service", () => {
  let userA: string;
  let userB: string;

  beforeAll(async () => {
    const a = await prisma.user.create({
      data: { email: "msg-test-a@example.com", name: "User A", level: "COLABORADOR" },
    });
    userA = a.id;
    const b = await prisma.user.create({
      data: { email: "msg-test-b@example.com", name: "User B", level: "PROJECT_MANAGER" },
    });
    userB = b.id;
  });

  afterAll(async () => {
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userA }, { senderId: userB }] } });
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
  });

  it("sends a message and it appears in both directions of the thread", async () => {
    await sendMessage({ recipientId: userB, content: "Hola, necesito ayuda" }, userA);
    const thread = await listThread(userA, userB);
    expect(thread.length).toBe(1);
    expect(thread[0].content).toBe("Hola, necesito ayuda");
  });

  it("orders thread messages chronologically regardless of who queries it", async () => {
    await sendMessage({ recipientId: userA, content: "Contame más" }, userB);
    const threadFromA = await listThread(userA, userB);
    const threadFromB = await listThread(userB, userA);
    expect(threadFromA.map((m) => m.content)).toEqual(threadFromB.map((m) => m.content));
    expect(threadFromA.length).toBe(2);
  });

  it("marks unread messages from the other party as read", async () => {
    await markThreadRead(userB, userA);
    const messages = await prisma.message.findMany({ where: { senderId: userA, recipientId: userB } });
    expect(messages.every((m) => m.readAt !== null)).toBe(true);
  });

  it("finds the admin recipient for a colaborador's 1:1 thread", async () => {
    const admin = await getAdminRecipient();
    expect(admin).not.toBeNull();
    expect(["SUPERUSER", "PROJECT_MANAGER"]).toContain(admin!.level);
  });
});
