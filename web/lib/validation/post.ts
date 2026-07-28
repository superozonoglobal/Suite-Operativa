import { z } from "zod";

export const schedulePostSchema = z.object({
  taskId: z.string().min(1),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "FACEBOOK", "LINKEDIN", "X", "YOUTUBE"]),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().optional(),
});

export type SchedulePostInput = z.infer<typeof schedulePostSchema>;
