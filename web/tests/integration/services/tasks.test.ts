import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTask, listTasks, updateTaskStatus } from "@/lib/services/tasks";

describe("tasks service", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: "test-tasks@example.com", name: "Test User", level: "COLABORADOR" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { createdById: userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("creates a task with default status TODO and a history entry", async () => {
    const task = await createTask({ title: "Test task" }, userId);
    expect(task.status).toBe("TODO");

    const history = await prisma.taskHistoryEntry.findMany({ where: { taskId: task.id } });
    expect(history.length).toBe(1);
    expect(history[0].text).toContain("creada");
  });

  it("moves a task through the kanban statuses and records history", async () => {
    const task = await createTask({ title: "Move me" }, userId);
    const updated = await updateTaskStatus(task.id, "PROGRESS", userId);
    expect(updated.status).toBe("PROGRESS");

    const history = await prisma.taskHistoryEntry.findMany({ where: { taskId: task.id } });
    expect(history.length).toBe(2);
  });

  it("sets completedAt when moved to DONE and clears it when moved away from DONE", async () => {
    const task = await createTask({ title: "Complete me" }, userId);
    const done = await updateTaskStatus(task.id, "DONE", userId);
    expect(done.completedAt).not.toBeNull();

    const reopened = await updateTaskStatus(task.id, "TODO", userId);
    expect(reopened.completedAt).toBeNull();
  });

  it("lists tasks filtered by status", async () => {
    await createTask({ title: "Filtered task" }, userId);
    const { items } = await listTasks({ status: "TODO" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((t) => t.status === "TODO")).toBe(true);
  });

  it("lists tasks filtered by assignee", async () => {
    const task = await createTask({ title: "Assigned task", assigneeId: userId }, userId);
    const { items } = await listTasks({ assigneeId: userId });
    expect(items.some((t) => t.id === task.id)).toBe(true);
  });
});
