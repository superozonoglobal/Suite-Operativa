import { prisma } from "@/lib/prisma";
import type { Prisma, User } from "@/app/generated/prisma/client";
import type { CreateGoalInput } from "@/lib/validation/goal";
import { ForbiddenError } from "@/lib/errors";
import { isAtLeastLevel } from "@/lib/authz";

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

function assertCanEditGoal(goal: { userId: string | null }, actingUser: Pick<User, "id" | "level">) {
  const isOwner = goal.userId === actingUser.id;
  if (!isOwner && !isAtLeastLevel(actingUser.level, "LIDER")) {
    throw new ForbiddenError("Forbidden: only the goal's owner or Líder+ can edit this goal");
  }
}

export async function updateGoalProgress(
  id: string,
  current: number,
  actingUser: Pick<User, "id" | "level">
) {
  const goal = await prisma.goal.findUniqueOrThrow({ where: { id } });
  assertCanEditGoal(goal, actingUser);

  return prisma.goal.update({ where: { id }, data: { current } });
}

export async function toggleChecklistItem(itemId: string, actingUser: Pick<User, "id" | "level">) {
  const item = await prisma.goalChecklistItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { goal: true },
  });
  assertCanEditGoal(item.goal, actingUser);

  return prisma.goalChecklistItem.update({ where: { id: itemId }, data: { done: !item.done } });
}

export async function approveGoal(id: string, actingUser: Pick<User, "level">) {
  if (!isAtLeastLevel(actingUser.level, "LIDER")) {
    throw new ForbiddenError("Forbidden: only Líder and above can approve goals");
  }

  return prisma.goal.update({ where: { id }, data: { status: "APROBADA" } });
}
