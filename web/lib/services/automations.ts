import { prisma } from "@/lib/prisma";
import type { Prisma, User } from "@/app/generated/prisma/client";
import type { CreateAutomationInput } from "@/lib/validation/automation";
import { ForbiddenError } from "@/lib/errors";

export async function listAutomations() {
  const items = await prisma.automation.findMany({ orderBy: { createdAt: "desc" } });
  return { items, total: items.length };
}

export async function createAutomation(
  input: CreateAutomationInput,
  actingUser: Pick<User, "id" | "level">
) {
  if (actingUser.level === "COLABORADOR") {
    throw new ForbiddenError("Forbidden: only Líder and above can create automations");
  }

  return prisma.automation.create({
    data: {
      name: input.name,
      description: input.description,
      trigger: input.trigger,
      action: input.action as Prisma.InputJsonValue,
      enabled: input.enabled ?? true,
      createdById: actingUser.id,
    },
  });
}

export async function setAutomationEnabled(
  id: string,
  enabled: boolean,
  actingUser: Pick<User, "level">
) {
  if (actingUser.level === "COLABORADOR") {
    throw new ForbiddenError("Forbidden: only Líder and above can toggle automations");
  }

  return prisma.automation.update({ where: { id }, data: { enabled } });
}
