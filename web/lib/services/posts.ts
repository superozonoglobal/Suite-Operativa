import { prisma } from "@/lib/prisma";
import type { SchedulePostInput } from "@/lib/validation/post";

export async function listPostsByMonth(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const items = await prisma.post.findMany({
    where: { scheduledDate: { gte: start, lt: end } },
    include: { assignee: true, task: true },
    orderBy: { scheduledDate: "asc" },
  });
  return { items, total: items.length };
}

export async function listSchedulableTasks() {
  return prisma.task.findMany({
    where: { status: "DONE", posts: { none: {} } },
    include: { project: true, product: true, assignee: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function schedulePost(input: SchedulePostInput) {
  const task = await prisma.task.findUniqueOrThrow({ where: { id: input.taskId } });

  return prisma.post.create({
    data: {
      taskId: task.id,
      projectId: task.projectId,
      productId: task.productId,
      title: task.title,
      platform: input.platform,
      scheduledDate: new Date(`${input.scheduledDate}T00:00:00Z`),
      scheduledTime: input.scheduledTime,
      status: "PROGRAMADO",
      assigneeId: task.assigneeId,
    },
  });
}
