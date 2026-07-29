import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma/client";
import { ForbiddenError } from "@/lib/errors";
import { LEVEL_RANK } from "@/lib/authz";

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export async function updateUserRole(
  targetId: string,
  changes: { roleTag?: User["roleTag"]; level?: User["level"] },
  actingUser: Pick<User, "id" | "level">
) {
  if (actingUser.level === "COLABORADOR") {
    throw new ForbiddenError("Forbidden: only Líder and above can change roles");
  }

  if (changes.level) {
    if (targetId === actingUser.id) {
      throw new ForbiddenError("Forbidden: cannot change your own level");
    }

    if (LEVEL_RANK[changes.level] > LEVEL_RANK[actingUser.level]) {
      throw new ForbiddenError("Forbidden: cannot grant a level higher than your own");
    }

    const target = await prisma.user.findUniqueOrThrow({ where: { id: targetId } });
    if (LEVEL_RANK[target.level] >= LEVEL_RANK[actingUser.level]) {
      throw new ForbiddenError("Forbidden: cannot change the level of a user at or above your own rank");
    }
  }

  return prisma.user.update({
    where: { id: targetId },
    data: {
      roleTag: changes.roleTag,
      level: changes.level,
    },
  });
}
