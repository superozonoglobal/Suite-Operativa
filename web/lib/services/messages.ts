import { prisma } from "@/lib/prisma";
import type { SendMessageInput } from "@/lib/validation/message";
import { createNotification } from "@/lib/services/notifications";

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
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        senderId,
        recipientId: input.recipientId,
        content: input.content,
      },
      include: { sender: true },
    });

    await createNotification(input.recipientId, `${message.sender.name} te envió un mensaje.`, tx);

    return message;
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
