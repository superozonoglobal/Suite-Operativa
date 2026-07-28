import { z } from "zod";

export const createRequisitionSchema = z.object({
  toUserId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const respondRequisitionSchema = z.object({
  status: z.enum(["ACEPTADA", "RECHAZADA"]),
  motivo: z.string().max(500).optional(),
});

export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>;
export type RespondRequisitionInput = z.infer<typeof respondRequisitionSchema>;
