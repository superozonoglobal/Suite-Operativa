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
    const updated = await updateTaskStatus(task.id, "PROGRESS", { id: userId, level: "COLABORADOR" });
    expect(updated.status).toBe("PROGRESS");

    const history = await prisma.taskHistoryEntry.findMany({ where: { taskId: task.id } });
    expect(history.length).toBe(2);
  });

  it("sets completedAt when moved to DONE and clears it when moved away from DONE", async () => {
    const task = await createTask({ title: "Complete me" }, userId);
    const done = await updateTaskStatus(task.id, "DONE", { id: userId, level: "COLABORADOR" });
    expect(done.completedAt).not.toBeNull();

    const reopened = await updateTaskStatus(task.id, "TODO", { id: userId, level: "COLABORADOR" });
    expect(reopened.completedAt).toBeNull();
  });

  it("rejects a status change from a user who is neither assignee, creator, nor Líder+", async () => {
    const task = await createTask({ title: "Not yours" }, userId);
    const stranger = await prisma.user.create({
      data: { email: "test-tasks-stranger@example.com", name: "Stranger", level: "COLABORADOR" },
    });

    await expect(
      updateTaskStatus(task.id, "PROGRESS", { id: stranger.id, level: "COLABORADOR" })
    ).rejects.toThrow(/forbidden/i);

    await prisma.user.delete({ where: { id: stranger.id } });
  });

  it("allows a status change from the task's assignee even if they didn't create it", async () => {
    const assignee = await prisma.user.create({
      data: { email: "test-tasks-assignee@example.com", name: "Assignee", level: "COLABORADOR" },
    });
    const task = await createTask({ title: "Assigned to someone else", assigneeId: assignee.id }, userId);

    const updated = await updateTaskStatus(task.id, "PROGRESS", { id: assignee.id, level: "COLABORADOR" });
    expect(updated.status).toBe("PROGRESS");

    await prisma.user.delete({ where: { id: assignee.id } });
  });

  it("allows a LIDER to change the status of any task", async () => {
    const task = await createTask({ title: "Team task" }, userId);
    const lider = await prisma.user.create({
      data: { email: "test-tasks-lider@example.com", name: "Lider", level: "LIDER" },
    });

    const updated = await updateTaskStatus(task.id, "PROGRESS", { id: lider.id, level: "LIDER" });
    expect(updated.status).toBe("PROGRESS");

    await prisma.user.delete({ where: { id: lider.id } });
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
