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

export const registerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  roleTag: z.enum(ROLE_TAG_VALUES).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
