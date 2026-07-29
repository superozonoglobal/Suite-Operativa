import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { listRequisitions, createRequisition, respondToRequisition } from "@/lib/services/requisitions";

describe("requisitions service", () => {
  let fromUserId: string;
  let toUserId: string;

  beforeAll(async () => {
    const from = await prisma.user.create({
      data: { email: "req-test-from@example.com", name: "From User", level: "COLABORADOR" },
    });
    fromUserId = from.id;

    const to = await prisma.user.create({
      data: { email: "req-test-to@example.com", name: "To User", level: "COLABORADOR" },
    });
    toUserId = to.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { createdById: fromUserId } });
    await prisma.requisition.deleteMany({ where: { fromUserId } });
    await prisma.user.deleteMany({ where: { id: { in: [fromUserId, toUserId] } } });
  });

  it("creates a requisition with status PENDIENTE", async () => {
    const req = await createRequisition(
      { toUserId, title: "Necesito 3 piezas para historias" },
      fromUserId
    );
    expect(req.status).toBe("PENDIENTE");
    expect(req.taskId).toBeNull();
  });

  it("rejects a response from someone other than the recipient", async () => {
    const req = await createRequisition({ toUserId, title: "Otra requisición" }, fromUserId);
    await expect(
      respondToRequisition(req.id, { status: "ACEPTADA" }, fromUserId)
    ).rejects.toThrow(/permission|forbidden/i);
  });

  it("accepting a requisition creates a linked task assigned to the recipient", async () => {
    const req = await createRequisition({ toUserId, title: "Diseñar banner" }, fromUserId);
    const accepted = await respondToRequisition(req.id, { status: "ACEPTADA" }, toUserId);

    expect(accepted.status).toBe("ACEPTADA");
    expect(accepted.taskId).not.toBeNull();

    const task = await prisma.task.findUnique({ where: { id: accepted.taskId! } });
    expect(task?.title).toBe("Diseñar banner");
    expect(task?.assigneeId).toBe(toUserId);
  });

  it("rejecting a requisition does not create a task", async () => {
    const req = await createRequisition({ toUserId, title: "Should be rejected" }, fromUserId);
    const rejected = await respondToRequisition(req.id, { status: "RECHAZADA", motivo: "Sin tiempo" }, toUserId);

    expect(rejected.status).toBe("RECHAZADA");
    expect(rejected.taskId).toBeNull();
    expect(rejected.motivo).toBe("Sin tiempo");
  });

  it("lists requisitions filtered by recipient", async () => {
    const { items } = await listRequisitions({ toUserId });
    expect(items.every((r) => r.toUserId === toUserId)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("responding twice to the same requisition creates only one task (no TOCTOU duplicate)", async () => {
    const req = await createRequisition({ toUserId, title: "Doble click" }, fromUserId);

    const first = await respondToRequisition(req.id, { status: "ACEPTADA" }, toUserId);
    expect(first.status).toBe("ACEPTADA");

    await expect(
      respondToRequisition(req.id, { status: "ACEPTADA" }, toUserId)
    ).rejects.toThrow(/pendiente|already|status/i);

    const tasks = await prisma.task.findMany({ where: { requisitions: { some: { id: req.id } } } });
    expect(tasks.length).toBe(1);
  });
});
