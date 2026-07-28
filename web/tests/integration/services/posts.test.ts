import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { listPostsByMonth, listSchedulableTasks, schedulePost } from "@/lib/services/posts";

describe("posts service", () => {
  let userId: string;
  let doneTaskId: string;
  let pendingTaskId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: "posts-test@example.com", name: "Posts Test", level: "COLABORADOR" },
    });
    userId = user.id;

    const doneTask = await prisma.task.create({
      data: { title: "Post-ready task", status: "DONE", createdById: userId },
    });
    doneTaskId = doneTask.id;

    const pendingTask = await prisma.task.create({
      data: { title: "Still in progress", status: "PROGRESS", createdById: userId },
    });
    pendingTaskId = pendingTask.id;
  });

  afterAll(async () => {
    await prisma.post.deleteMany({ where: { task: { createdById: userId } } });
    await prisma.task.deleteMany({ where: { createdById: userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("lists DONE tasks with no post yet as schedulable", async () => {
    const schedulable = await listSchedulableTasks();
    expect(schedulable.some((t) => t.id === doneTaskId)).toBe(true);
    expect(schedulable.some((t) => t.id === pendingTaskId)).toBe(false);
  });

  it("schedules a post from a task and removes it from the schedulable list", async () => {
    const post = await schedulePost({
      taskId: doneTaskId,
      platform: "INSTAGRAM",
      scheduledDate: "2026-08-05",
    });
    expect(post.status).toBe("PROGRAMADO");
    expect(post.platform).toBe("INSTAGRAM");

    const schedulable = await listSchedulableTasks();
    expect(schedulable.some((t) => t.id === doneTaskId)).toBe(false);
  });

  it("lists posts scheduled within a given month", async () => {
    const { items } = await listPostsByMonth(2026, 8);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.scheduledDate && new Date(p.scheduledDate).getUTCMonth() === 7)).toBe(true);
  });
});
