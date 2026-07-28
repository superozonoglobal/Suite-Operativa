import { prisma } from "@/lib/prisma";
import type { SendMessageInput } from "@/lib/validation/message";

export async function listThread(userId: string, otherUserId: string) {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendMessage(input: SendMessageInput, senderId: string) {
  return prisma.message.create({
    data: {
      senderId,
      recipientId: input.recipientId,
      content: input.content,
    },
  });
}

export async function markThreadRead(userId: string, otherUserId: string) {
  await prisma.message.updateMany({
    where: { senderId: otherUserId, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function getAdminRecipient() {
  return (
    (await prisma.user.findFirst({ where: { level: "SUPERUSER" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ where: { level: "PROJECT_MANAGER" }, orderBy: { createdAt: "asc" } }))
  );
}
