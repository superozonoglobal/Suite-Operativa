import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { listAutomations, createAutomation, setAutomationEnabled } from "@/lib/services/automations";

describe("automations service", () => {
  let liderId: string;
  let colaboradorId: string;

  beforeAll(async () => {
    const lider = await prisma.user.create({
      data: { email: "autom-test-lider@example.com", name: "Lider Test", level: "LIDER" },
    });
    liderId = lider.id;

    const colaborador = await prisma.user.create({
      data: { email: "autom-test-colab@example.com", name: "Colaborador Test", level: "COLABORADOR" },
    });
    colaboradorId = colaborador.id;
  });

  afterAll(async () => {
    await prisma.automation.deleteMany({ where: { createdById: liderId } });
    await prisma.user.deleteMany({ where: { id: { in: [liderId, colaboradorId] } } });
  });

  it("rejects creation by a COLABORADOR-level actor", async () => {
    await expect(
      createAutomation(
        { name: "Avisar vencimientos", trigger: "task:due_soon", action: { type: "notify" } },
        { id: colaboradorId, level: "COLABORADOR" }
      )
    ).rejects.toThrow(/permission|forbidden/i);
  });

  it("creates an automation when the actor is LIDER or above", async () => {
    const automation = await createAutomation(
      { name: "Avisar vencimientos", trigger: "task:due_soon", action: { type: "notify" } },
      { id: liderId, level: "LIDER" }
    );
    expect(automation.enabled).toBe(true);
    expect(automation.createdById).toBe(liderId);
  });

  it("toggles enabled state when the actor is LIDER or above", async () => {
    const automation = await createAutomation(
      { name: "Toggle test", trigger: "task:overdue", action: { type: "notify" } },
      { id: liderId, level: "LIDER" }
    );
    const disabled = await setAutomationEnabled(automation.id, false, { level: "LIDER" });
    expect(disabled.enabled).toBe(false);
  });

  it("rejects toggling enabled state when the actor is a plain COLABORADOR", async () => {
    const automation = await createAutomation(
      { name: "Toggle forbidden test", trigger: "task:overdue", action: { type: "notify" } },
      { id: liderId, level: "LIDER" }
    );

    await expect(
      setAutomationEnabled(automation.id, false, { level: "COLABORADOR" })
    ).rejects.toThrow(/forbidden/i);
  });

  it("lists automations", async () => {
    const { items } = await listAutomations();
    expect(items.length).toBeGreaterThan(0);
  });
});
