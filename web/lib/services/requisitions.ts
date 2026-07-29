import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import type { CreateRequisitionInput, RespondRequisitionInput } from "@/lib/validation/requisition";
import { createNotification } from "@/lib/services/notifications";
import { ForbiddenError, ConflictError } from "@/lib/errors";

export async function listRequisitions(filters: { fromUserId?: string; toUserId?: string } = {}) {
  const where: Prisma.RequisitionWhereInput = {};
  if (filters.fromUserId) where.fromUserId = filters.fromUserId;
  if (filters.toUserId) where.toUserId = filters.toUserId;

  const items = await prisma.requisition.findMany({
    where,
    include: { fromUser: true, toUser: true },
    orderBy: { createdAt: "desc" },
  });
  return { items, total: items.length };
}

export async function createRequisition(input: CreateRequisitionInput, fromUserId: string) {
  return prisma.$transaction(async (tx) => {
    const requisition = await tx.requisition.create({
      data: {
        fromUserId,
        toUserId: input.toUserId,
        title: input.title,
        description: input.description,
      },
      include: { fromUser: true },
    });

    await createNotification(
      input.toUserId,
      `${requisition.fromUser.name} te envió una requisición nueva.`,
      tx
    );

    return requisition;
  });
}

export async function respondToRequisition(
  id: string,
  input: RespondRequisitionInput,
  actingUserId: string
) {
  return prisma.$transaction(async (tx) => {
    const requisition = await tx.requisition.findUniqueOrThrow({ where: { id } });

    if (requisition.toUserId !== actingUserId) {
      throw new ForbiddenError("Forbidden: only the recipient can respond to this requisition");
    }

    if (requisition.status !== "PENDIENTE") {
      throw new ConflictError("This requisition is no longer PENDIENTE (already responded to)");
    }

    const responder = await tx.user.findUniqueOrThrow({ where: { id: actingUserId } });

    try {
      if (input.status === "ACEPTADA") {
        const task = await tx.task.create({
          data: {
            title: requisition.title,
            description: requisition.description,
            assigneeId: requisition.toUserId,
            createdById: requisition.fromUserId,
            history: { create: { text: "Tarea creada a partir de una requisición aceptada." } },
          },
        });

        const updated = await tx.requisition.update({
          where: { id, status: "PENDIENTE" },
          data: { status: "ACEPTADA", taskId: task.id },
        });

        await createNotification(requisition.fromUserId, `${responder.name} aceptó tu requisición.`, tx);

        return updated;
      }

      const updated = await tx.requisition.update({
        where: { id, status: "PENDIENTE" },
        data: { status: "RECHAZADA", motivo: input.motivo },
      });

      await createNotification(requisition.fromUserId, `${responder.name} rechazó tu requisición.`, tx);

      return updated;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new ConflictError("This requisition is no longer PENDIENTE (already responded to)");
      }
      throw err;
    }
  });
}
