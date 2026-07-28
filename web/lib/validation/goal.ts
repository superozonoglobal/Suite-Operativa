import { z } from "zod";

export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["NUMERO", "PORCENTAJE", "CHECKLIST"]),
  scope: z.enum(["PERSONAL", "EQUIPO"]),
  target: z.number().int().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  userId: z.string().optional(),
  checklist: z.array(z.string().min(1)).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
