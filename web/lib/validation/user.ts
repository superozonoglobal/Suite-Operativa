import { z } from "zod";

const ROLE_TAG_VALUES = [
  "DEVELOPER",
  "VENTAS",
  "COPYWRITING",
  "PUBLICISTA",
  "DISENADOR",
  "FILMMAKER",
  "EDITOR_VIDEO",
  "COMMUNITY_MANAGER",
  "TRAFIKER",
  "ECOMMERCE",
] as const;

const LEVEL_VALUES = ["SUPERUSER", "PROJECT_MANAGER", "LIDER", "COLABORADOR"] as const;

export const updateUserRoleSchema = z.object({
  roleTag: z.enum(ROLE_TAG_VALUES).optional(),
  level: z.enum(LEVEL_VALUES).optional(),
});
