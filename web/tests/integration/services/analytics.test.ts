import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getAnalyticsSummary } from "@/lib/services/analytics";

describe("analytics service", () => {
  let userId: string;
  const createdIds: { tasks: string[]; goals: string[] } = { tasks: [], goals: [] };

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: "analytics-test@example.com", name: "Analytics Test", level: "COLABORADOR" },
    });
    userId = user.id;

    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    // On-time DONE task: created 10 days ago, due 5 days ago, completed 6 days ago (before due).
    const onTime = await prisma.task.create({
      data: {
        title: "On time task",
        status: "DONE",
        assigneeId: userId,
        createdById: userId,
        createdAt: daysAgo(10),
        dueDate: daysAgo(5),
        completedAt: daysAgo(6),
      },
    });
    createdIds.tasks.push(onTime.id);

    // Late DONE task: created 10 days ago, due 5 days ago, completed 2 days ago (after due).
    const late = await prisma.task.create({
      data: {
        title: "Late task",
        status: "DONE",
        assigneeId: userId,
        createdById: userId,
        createdAt: daysAgo(10),
        dueDate: daysAgo(5),
        completedAt: daysAgo(2),
      },
    });
    createdIds.tasks.push(late.id);

    // Stagnant task: not DONE, last updated 10 days ago.
    const stagnant = await prisma.task.create({
      data: { title: "Stagnant task", status: "TODO", createdById: userId },
    });
    await prisma.task.update({ where: { id: stagnant.id }, data: { updatedAt: daysAgo(10) } });
    createdIds.tasks.push(stagnant.id);

    // Reworked task: history goes REVIEW then back to PROGRESS.
    const reworked = await prisma.task.create({
      data: {
        title: "Reworked task",
        status: "PROGRESS",
        createdById: userId,
        history: {
          create: [
            { text: "Movida a En Revisión.", createdAt: daysAgo(3) },
            { text: "Movida a En Proceso.", createdAt: daysAgo(2) },
          ],
        },
      },
    });
    createdIds.tasks.push(reworked.id);

    const goal = await prisma.goal.create({
      data: {
        title: "Approved goal",
        type: "NUMERO",
        scope: "PERSONAL",
        userId,
        target: 20,
        current: 10,
        status: "APROBADA",
        month: "2026-07",
      },
    });
    createdIds.goals.push(goal.id);
  });

  afterAll(async () => {
    await prisma.taskHistoryEntry.deleteMany({ where: { taskId: { in: createdIds.tasks } } });
    await prisma.task.deleteMany({ where: { id: { in: createdIds.tasks } } });
    await prisma.goal.deleteMany({ where: { id: { in: createdIds.goals } } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("computes status counts and completion percentage", async () => {
    const summary = await getAnalyticsSummary();
    expect(summary.statusCounts.DONE).toBeGreaterThanOrEqual(2);
    expect(summary.totalTasks).toBeGreaterThanOrEqual(4);
  });

  it("computes on-time rate among DONE tasks with a due date", async () => {
    const summary = await getAnalyticsSummary();
    // At least the 2 fixture DONE tasks exist: 1 on-time, 1 late.
    expect(summary.onTimeRate).toBeGreaterThan(0);
    expect(summary.onTimeRate).toBeLessThan(100);
  });

  it("computes stagnant task count (no activity in 4+ days)", async () => {
    const summary = await getAnalyticsSummary();
    expect(summary.stagnantCount).toBeGreaterThanOrEqual(1);
  });

  it("computes rework rate from tasks that re-entered PROGRESS after REVIEW", async () => {
    const summary = await getAnalyticsSummary();
    expect(summary.reworkRate).toBeGreaterThan(0);
  });

  it("computes average goal completion for APROBADA goals", async () => {
    const summary = await getAnalyticsSummary();
    // 10/20 = 50% is part of the average.
    expect(summary.goalsCompletionAvg).toBeGreaterThan(0);
  });

  it("includes per-member delivery time", async () => {
    const summary = await getAnalyticsSummary();
    const member = summary.perMember.find((m) => m.userId === userId);
    expect(member).toBeDefined();
    expect(member!.avgDeliveryDays).toBeGreaterThan(0);
  });
});
