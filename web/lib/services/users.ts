import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma/client";

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export async function updateUserRole(
  targetId: string,
  changes: { roleTag?: string; level?: string },
  actingUser: Pick<User, "level">
) {
  if (actingUser.level === "COLABORADOR") {
    throw new Error("Forbidden: only Líder and above can change roles");
  }

  return prisma.user.update({
    where: { id: targetId },
    data: {
      roleTag: changes.roleTag as User["roleTag"],
      level: changes.level as User["level"],
    },
  });
}
