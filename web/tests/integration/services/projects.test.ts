import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { listProjectsWithProgress, createProject, createProduct } from "@/lib/services/projects";

describe("projects service", () => {
  let userId: string;
  let colaboradorId: string;
  let projectId: string;

  beforeAll(async () => {
    const lider = await prisma.user.create({
      data: { email: "projects-test-lider@example.com", name: "Lider Test", level: "LIDER" },
    });
    userId = lider.id;

    const colaborador = await prisma.user.create({
      data: { email: "projects-test-colaborador@example.com", name: "Colaborador Test", level: "COLABORADOR" },
    });
    colaboradorId = colaborador.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { createdById: userId } });
    await prisma.product.deleteMany({ where: { project: { leadId: userId } } });
    await prisma.project.deleteMany({ where: { leadId: userId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, colaboradorId] } } });
  });

  it("rejects project creation by a COLABORADOR-level actor", async () => {
    await expect(
      createProject({ name: "Should Fail" }, { level: "COLABORADOR" })
    ).rejects.toThrow(/permission|forbidden/i);
  });

  it("creates a project when the actor is LIDER or above", async () => {
    const project = await createProject({ name: "Café Nublado", leadId: userId }, { level: "LIDER" });
    projectId = project.id;
    expect(project.name).toBe("Café Nublado");
  });

  it("rejects product creation by a COLABORADOR-level actor", async () => {
    await expect(
      createProduct({ name: "Should Fail" , projectId }, { level: "COLABORADOR" })
    ).rejects.toThrow(/permission|forbidden/i);
  });

  it("computes per-product progress and distinct team members from task assignees", async () => {
    const product = await createProduct({ name: "Campaña de Lanzamiento", projectId }, { level: "LIDER" });

    await prisma.task.create({
      data: { title: "Task 1", projectId, productId: product.id, assigneeId: colaboradorId, status: "DONE", createdById: userId },
    });
    await prisma.task.create({
      data: { title: "Task 2", projectId, productId: product.id, assigneeId: colaboradorId, status: "TODO", createdById: userId },
    });

    const projects = await listProjectsWithProgress();
    const found = projects.find((p) => p.id === projectId);
    expect(found).toBeDefined();

    const foundProduct = found!.products.find((p) => p.id === product.id);
    expect(foundProduct?.taskCount).toBe(2);
    expect(foundProduct?.doneCount).toBe(1);

    expect(found!.teamMembers.some((m) => m.id === colaboradorId)).toBe(true);
  });
});
