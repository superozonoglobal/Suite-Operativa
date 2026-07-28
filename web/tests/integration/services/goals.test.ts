import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { listGoals, createGoal, updateGoalProgress, toggleChecklistItem } from "@/lib/services/goals";

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

  it("updates numeric progress", async () => {
    const goal = await createGoal(
      { title: "Progress test", type: "NUMERO", scope: "PERSONAL", target: 10, month: "2026-07" },
      userId
    );
    const updated = await updateGoalProgress(goal.id, 5);
    expect(updated.current).toBe(5);
  });

  it("toggles a checklist item", async () => {
    const goal = await createGoal(
      { title: "Toggle test", type: "CHECKLIST", scope: "PERSONAL", month: "2026-07", checklist: ["Item A"] },
      userId
    );
    const [item] = await prisma.goalChecklistItem.findMany({ where: { goalId: goal.id } });

    const toggled = await toggleChecklistItem(item.id);
    expect(toggled.done).toBe(true);

    const toggledAgain = await toggleChecklistItem(item.id);
    expect(toggledAgain.done).toBe(false);
  });

  it("lists goals filtered by month", async () => {
    await createGoal({ title: "July goal", type: "NUMERO", scope: "PERSONAL", month: "2026-07" }, userId);
    const { items } = await listGoals({ month: "2026-07" });
    expect(items.every((g) => g.month === "2026-07")).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });
});
