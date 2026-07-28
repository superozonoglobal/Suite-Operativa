import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { CreateTaskInput } from "@/lib/validation/task";

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: { assignee: true; project: true; product: true; comments: true };
}>;

const STATUS_LABELS: Record<string, string> = {
  TODO: "Por Hacer",
  PROGRESS: "En Proceso",
  REVIEW: "En Revisión",
  DONE: "Aprobado / Listo",
};

export async function listTasks(
  filters: { status?: string; assigneeId?: string; projectId?: string } = {}
) {
  const where: Prisma.TaskWhereInput = {};
  if (filters.status) where.status = filters.status as Prisma.TaskWhereInput["status"];
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.projectId) where.projectId = filters.projectId;

  const items = await prisma.task.findMany({
    where,
    include: { assignee: true, project: true, product: true, comments: true },
    orderBy: { createdAt: "desc" },
  });
  return { items, total: items.length };
}

export async function createTask(input: CreateTaskInput, createdById: string) {
  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      productId: input.productId,
      roleTag: input.roleTag as Prisma.TaskCreateInput["roleTag"],
      assigneeId: input.assigneeId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      goalId: input.goalId,
      createdById,
      history: { create: { text: "Tarea creada." } },
    },
  });
}

export async function updateTaskStatus(id: string, status: string, actingUserId: string) {
  void actingUserId; // recorded via the caller's session, not re-derived here

  return prisma.task.update({
    where: { id },
    data: {
      status: status as Prisma.TaskUpdateInput["status"],
      completedAt: status === "DONE" ? new Date() : null,
      history: { create: { text: `Movida a ${STATUS_LABELS[status] ?? status}.` } },
    },
  });
}
