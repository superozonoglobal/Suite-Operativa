import type { User } from "@/app/generated/prisma/client";

export const LEVEL_RANK: Record<User["level"], number> = {
  COLABORADOR: 0,
  LIDER: 1,
  PROJECT_MANAGER: 2,
  SUPERUSER: 3,
};

export function isAtLeastLevel(actorLevel: User["level"], minLevel: User["level"]): boolean {
  return LEVEL_RANK[actorLevel] >= LEVEL_RANK[minLevel];
}
