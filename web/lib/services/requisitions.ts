import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { CreateRequisitionInput, RespondRequisitionInput } from "@/lib/validation/requisition";

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
  return prisma.requisition.create({
    data: {
      fromUserId,
      toUserId: input.toUserId,
      title: input.title,
      description: input.description,
    },
  });
}

export async function respondToRequisition(
  id: string,
  input: RespondRequisitionInput,
  actingUserId: string
) {
  const requisition = await prisma.requisition.findUniqueOrThrow({ where: { id } });

  if (requisition.toUserId !== actingUserId) {
    throw new Error("Forbidden: only the recipient can respond to this requisition");
  }

  if (input.status === "ACEPTADA") {
    const task = await prisma.task.create({
      data: {
        title: requisition.title,
        description: requisition.description,
        assigneeId: requisition.toUserId,
        createdById: requisition.fromUserId,
        history: { create: { text: "Tarea creada a partir de una requisición aceptada." } },
      },
    });

    return prisma.requisition.update({
      where: { id },
      data: { status: "ACEPTADA", taskId: task.id },
    });
  }

  return prisma.requisition.update({
    where: { id },
    data: { status: "RECHAZADA", motivo: input.motivo },
  });
}
