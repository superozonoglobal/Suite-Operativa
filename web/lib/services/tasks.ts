import { prisma } from "@/lib/prisma";
import type { Prisma, User } from "@/app/generated/prisma/client";
import type { CreateTaskInput } from "@/lib/validation/task";
import { ForbiddenError } from "@/lib/errors";
import { isAtLeastLevel } from "@/lib/authz";

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

function assertCanEditTask(
  task: { assigneeId: string | null; createdById: string },
  actingUser: Pick<User, "id" | "level">
) {
  const isOwner = task.assigneeId === actingUser.id || task.createdById === actingUser.id;
  if (!isOwner && !isAtLeastLevel(actingUser.level, "LIDER")) {
    throw new ForbiddenError("Forbidden: only the task's assignee, creator, or Líder+ can edit this task");
  }
}

export async function updateTaskStatus(
  id: string,
  status: string,
  actingUser: Pick<User, "id" | "level">
) {
  const task = await prisma.task.findUniqueOrThrow({ where: { id } });
  assertCanEditTask(task, actingUser);

  return prisma.task.update({
    where: { id },
    data: {
      status: status as Prisma.TaskUpdateInput["status"],
      completedAt: status === "DONE" ? new Date() : null,
      history: { create: { text: `Movida a ${STATUS_LABELS[status] ?? status}.` } },
    },
  });
}

export async function updateTaskFields(
  id: string,
  changes: { assigneeId?: string | null; title?: string; description?: string; dueDate?: string | null },
  actingUser: Pick<User, "id" | "level">
) {
  const task = await prisma.task.findUniqueOrThrow({ where: { id } });
  assertCanEditTask(task, actingUser);

  const data: Prisma.TaskUncheckedUpdateInput = { ...changes };
  if (changes.dueDate !== undefined) {
    data.dueDate = changes.dueDate ? new Date(changes.dueDate) : null;
  }

  return prisma.task.update({ where: { id }, data });
}
