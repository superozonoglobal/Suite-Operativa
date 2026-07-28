import { z } from "zod";

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  trigger: z.string().min(1),
  action: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional(),
});

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
