import { z } from "zod";

export const updateUserRoleSchema = z.object({
  roleTag: z.string().optional(),
  level: z.string().optional(),
});
