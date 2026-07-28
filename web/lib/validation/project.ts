import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  leadId: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  projectId: z.string().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
