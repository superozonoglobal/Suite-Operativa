import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export async function createNotification(
  userId: string,
  text: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  return client.notification.create({ data: { userId, text } });
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
