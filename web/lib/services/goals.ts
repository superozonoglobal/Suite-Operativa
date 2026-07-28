import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { CreateGoalInput } from "@/lib/validation/goal";

export async function listGoals(filters: { userId?: string; month?: string; status?: string } = {}) {
  const where: Prisma.GoalWhereInput = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.month) where.month = filters.month;
  if (filters.status) where.status = filters.status as Prisma.GoalWhereInput["status"];

  const items = await prisma.goal.findMany({
    where,
    include: { checklistItems: true, user: true },
    orderBy: { createdAt: "desc" },
  });
  return { items, total: items.length };
}

export async function createGoal(input: CreateGoalInput, createdByUserId: string) {
  const userId = input.scope === "PERSONAL" ? (input.userId ?? createdByUserId) : undefined;

  return prisma.goal.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      scope: input.scope,
      target: input.target,
      month: input.month,
      userId,
      checklistItems: input.checklist
        ? { create: input.checklist.map((label) => ({ label })) }
        : undefined,
    },
    include: { checklistItems: true },
  });
}

export async function updateGoalProgress(id: string, current: number) {
  return prisma.goal.update({ where: { id }, data: { current } });
}

export async function toggleChecklistItem(itemId: string) {
  const item = await prisma.goalChecklistItem.findUniqueOrThrow({ where: { id: itemId } });
  return prisma.goalChecklistItem.update({ where: { id: itemId }, data: { done: !item.done } });
}
