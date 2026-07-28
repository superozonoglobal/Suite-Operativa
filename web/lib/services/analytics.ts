import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STAGNANT_THRESHOLD_DAYS = 4;

function hasRework(history: { text: string; createdAt: Date }[]) {
  const sorted = [...history].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let sawReview = false;
  for (const entry of sorted) {
    if (entry.text.includes("En Revisión")) sawReview = true;
    else if (sawReview && entry.text.includes("En Proceso")) return true;
  }
  return false;
}

export async function getAnalyticsSummary() {
  const [tasks, goals, users] = await Promise.all([
    prisma.task.findMany({ include: { history: true, assignee: true } }),
    prisma.goal.findMany({ where: { status: "APROBADA" } }),
    prisma.user.findMany(),
  ]);

  const statusCounts = {
    TODO: tasks.filter((t) => t.status === "TODO").length,
    PROGRESS: tasks.filter((t) => t.status === "PROGRESS").length,
    REVIEW: tasks.filter((t) => t.status === "REVIEW").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };
  const totalTasks = tasks.length;
  const completedCount = statusCounts.DONE;
  const completedPercent = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);

  const doneWithDueDate = tasks.filter((t) => t.status === "DONE" && t.dueDate && t.completedAt);
  const onTimeCount = doneWithDueDate.filter((t) => t.completedAt! <= t.dueDate!).length;
  const onTimeRate = doneWithDueDate.length === 0 ? 0 : Math.round((onTimeCount / doneWithDueDate.length) * 100);

  function deliveryDaysFor(task: { createdAt: Date; completedAt: Date | null }) {
    if (!task.completedAt) return null;
    return (task.completedAt.getTime() - task.createdAt.getTime()) / MS_PER_DAY;
  }
  const doneTasks = tasks.filter((t) => t.status === "DONE" && t.completedAt);
  const deliveryDaysList = doneTasks.map(deliveryDaysFor).filter((d): d is number => d !== null);
  const avgDeliveryDays =
    deliveryDaysList.length === 0
      ? 0
      : Math.round((deliveryDaysList.reduce((a, b) => a + b, 0) / deliveryDaysList.length) * 10) / 10;

  const reworkedTasks = tasks.filter((t) => hasRework(t.history));
  const reworkRate = totalTasks === 0 ? 0 : Math.round((reworkedTasks.length / totalTasks) * 100);

  const now = new Date();
  const stagnantCount = tasks.filter(
    (t) => t.status !== "DONE" && now.getTime() - t.updatedAt.getTime() > STAGNANT_THRESHOLD_DAYS * MS_PER_DAY
  ).length;

  const goalCompletionPercents = goals
    .filter((g) => g.target && g.target > 0)
    .map((g) => Math.min(100, (g.current / g.target!) * 100));
  const goalsCompletionAvg =
    goalCompletionPercents.length === 0
      ? 0
      : Math.round(goalCompletionPercents.reduce((a, b) => a + b, 0) / goalCompletionPercents.length);

  const perMember = users.map((user) => {
    const memberDoneTasks = doneTasks.filter((t) => t.assigneeId === user.id);
    const memberDelivery = memberDoneTasks.map(deliveryDaysFor).filter((d): d is number => d !== null);
    const memberAvgDelivery =
      memberDelivery.length === 0
        ? 0
        : Math.round((memberDelivery.reduce((a, b) => a + b, 0) / memberDelivery.length) * 10) / 10;

    const memberTasks = tasks.filter((t) => t.assigneeId === user.id);
    const memberReworked = memberTasks.filter((t) => hasRework(t.history));
    const memberReworkRate =
      memberTasks.length === 0 ? 0 : Math.round((memberReworked.length / memberTasks.length) * 100);

    return {
      userId: user.id,
      name: user.name,
      avgDeliveryDays: memberAvgDelivery,
      reworkRate: memberReworkRate,
    };
  });

  return {
    statusCounts,
    totalTasks,
    completedCount,
    completedPercent,
    onTimeRate,
    avgDeliveryDays,
    reworkRate,
    stagnantCount,
    goalsCompletionAvg,
    perMember,
  };
}
