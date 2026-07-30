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
  "ASESOR",
] as const;

export const registerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(200)
    .regex(/[A-Z]/, "La contraseña debe tener al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe tener al menos un número"),
  roleTag: z.enum(ROLE_TAG_VALUES).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
