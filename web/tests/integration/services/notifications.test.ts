import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createNotification, listUnreadForUser, markAllRead } from "@/lib/services/notifications";

describe("notifications service", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: "notif-test@example.com", name: "Notif Test", level: "COLABORADOR" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("creates a notification and lists it as unread", async () => {
    await createNotification(userId, "Valentina te envió una requisición nueva.");
    const unread = await listUnreadForUser(userId);
    expect(unread.length).toBe(1);
    expect(unread[0].read).toBe(false);
  });

  it("marks all notifications as read", async () => {
    await createNotification(userId, "Otra notificación.");
    await markAllRead(userId);
    const unread = await listUnreadForUser(userId);
    expect(unread.length).toBe(0);
  });
});
