import { prisma } from "@/lib/prisma";

export async function createNotification(userId: string, text: string) {
  return prisma.notification.create({ data: { userId, text } });
}

export async function listUnreadForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
