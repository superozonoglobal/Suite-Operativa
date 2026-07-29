import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listGoals,
  createGoal,
  updateGoalProgress,
  toggleChecklistItem,
  approveGoal,
} from "@/lib/services/goals";
import { getAnalyticsSummary } from "@/lib/services/analytics";

describe("goals service", () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: "goals-test@example.com", name: "Goals Test", level: "COLABORADOR" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.goal.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("creates a personal numeric goal defaulting userId to the creator", async () => {
    const goal = await createGoal(
      { title: "20 piezas de diseño", type: "NUMERO", scope: "PERSONAL", target: 20, month: "2026-07" },
      userId
    );
    expect(goal.userId).toBe(userId);
    expect(goal.current).toBe(0);
  });

  it("creates a team goal with a null userId even when scope is EQUIPO", async () => {
    const goal = await createGoal(
      { title: "Meta de equipo", type: "PORCENTAJE", scope: "EQUIPO", target: 100, month: "2026-07" },
      userId
    );
    expect(goal.userId).toBeNull();
  });

  it("creates a checklist goal with its items", async () => {
    const goal = await createGoal(
      {
        title: "Checklist mensual",
        type: "CHECKLIST",
        scope: "PERSONAL",
        month: "2026-07",
        checklist: ["Moodboard Café Nublado", "Moodboard FitZone"],
      },
      userId
    );

    const items = await prisma.goalChecklistItem.findMany({ where: { goalId: goal.id } });
    expect(items.length).toBe(2);
    expect(items.every((i) => i.done === false)).toBe(true);
  });

  it("updates numeric progress when the actor owns the goal", async () => {
    const goal = await createGoal(
      { title: "Progress test", type: "NUMERO", scope: "PERSONAL", target: 10, month: "2026-07" },
      userId
    );
    const updated = await updateGoalProgress(goal.id, 5, { id: userId, level: "COLABORADOR" });
    expect(updated.current).toBe(5);
  });

  it("rejects updating another user's PERSONAL goal when the actor is a plain COLABORADOR", async () => {
    const goal = await createGoal(
      { title: "Someone else's goal", type: "NUMERO", scope: "PERSONAL", target: 10, month: "2026-07" },
      userId
    );
    const other = await prisma.user.create({
      data: { email: "goals-test-other@example.com", name: "Other Colaborador", level: "COLABORADOR" },
    });

    await expect(
      updateGoalProgress(goal.id, 5, { id: other.id, level: "COLABORADOR" })
    ).rejects.toThrow(/forbidden/i);

    await prisma.user.delete({ where: { id: other.id } });
  });

  it("allows a LIDER to update another user's goal progress", async () => {
    const goal = await createGoal(
      { title: "Team-managed goal", type: "NUMERO", scope: "PERSONAL", target: 10, month: "2026-07" },
      userId
    );
    const lider = await prisma.user.create({
      data: { email: "goals-test-lider@example.com", name: "Lider", level: "LIDER" },
    });

    const updated = await updateGoalProgress(goal.id, 7, { id: lider.id, level: "LIDER" });
    expect(updated.current).toBe(7);

    await prisma.user.delete({ where: { id: lider.id } });
  });

  it("toggles a checklist item when the actor owns the goal", async () => {
    const goal = await createGoal(
      { title: "Toggle test", type: "CHECKLIST", scope: "PERSONAL", month: "2026-07", checklist: ["Item A"] },
      userId
    );
    const [item] = await prisma.goalChecklistItem.findMany({ where: { goalId: goal.id } });

    const toggled = await toggleChecklistItem(item.id, { id: userId, level: "COLABORADOR" });
    expect(toggled.done).toBe(true);

    const toggledAgain = await toggleChecklistItem(item.id, { id: userId, level: "COLABORADOR" });
    expect(toggledAgain.done).toBe(false);
  });

  it("rejects toggling another user's checklist item when the actor is a plain COLABORADOR", async () => {
    const goal = await createGoal(
      { title: "Someone else's checklist", type: "CHECKLIST", scope: "PERSONAL", month: "2026-07", checklist: ["Item A"] },
      userId
    );
    const [item] = await prisma.goalChecklistItem.findMany({ where: { goalId: goal.id } });
    const other = await prisma.user.create({
      data: { email: "goals-test-other2@example.com", name: "Other Colaborador", level: "COLABORADOR" },
    });

    await expect(
      toggleChecklistItem(item.id, { id: other.id, level: "COLABORADOR" })
    ).rejects.toThrow(/forbidden/i);

    await prisma.user.delete({ where: { id: other.id } });
  });

  it("rejects approval by a plain COLABORADOR", async () => {
    const goal = await createGoal(
      { title: "Needs approval", type: "NUMERO", scope: "PERSONAL", target: 10, month: "2026-07" },
      userId
    );

    await expect(
      approveGoal(goal.id, { level: "COLABORADOR" })
    ).rejects.toThrow(/forbidden/i);
  });

  it("approves a goal when the actor is LIDER or above, and it counts toward the analytics average", async () => {
    const goal = await createGoal(
      { title: "Approved goal", type: "NUMERO", scope: "PERSONAL", target: 10, month: "2026-07" },
      userId
    );
    await updateGoalProgress(goal.id, 10, { id: userId, level: "COLABORADOR" });

    const approved = await approveGoal(goal.id, { level: "LIDER" });
    expect(approved.status).toBe("APROBADA");

    const summary = await getAnalyticsSummary();
    expect(summary.goalsCompletionAvg).toBeGreaterThan(0);
  });

  it("lists goals filtered by month", async () => {
    await createGoal({ title: "July goal", type: "NUMERO", scope: "PERSONAL", month: "2026-07" }, userId);
    const { items } = await listGoals({ month: "2026-07" });
    expect(items.every((g) => g.month === "2026-07")).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
});
