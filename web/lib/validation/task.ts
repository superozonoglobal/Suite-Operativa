import { z } from "zod";

export const taskStatusEnum = z.enum(["TODO", "PROGRESS", "REVIEW", "DONE"]);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().optional(),
  productId: z.string().optional(),
  roleTag: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  goalId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  status: taskStatusEnum.optional(),
  assigneeId: z.string().nullable().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
