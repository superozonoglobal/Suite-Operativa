import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma/client";
import type { CreateProjectInput, CreateProductInput } from "@/lib/validation/project";

export async function listProjectsWithProgress() {
  const projects = await prisma.project.findMany({
    include: {
      lead: true,
      products: {
        include: { tasks: { include: { assignee: true } } },
      },
      tasks: { include: { assignee: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return projects.map((project) => {
    const products = project.products.map((product) => ({
      ...product,
      taskCount: product.tasks.length,
      doneCount: product.tasks.filter((t) => t.status === "DONE").length,
    }));

    const teamMemberMap = new Map<string, User>();
    for (const task of project.tasks) {
      if (task.assignee) teamMemberMap.set(task.assignee.id, task.assignee);
    }

    return {
      ...project,
      products,
      teamMembers: Array.from(teamMemberMap.values()),
    };
  });
}

export async function createProject(input: CreateProjectInput, actingUser: Pick<User, "level">) {
  if (actingUser.level === "COLABORADOR") {
    throw new Error("Forbidden: only Líder and above can create projects");
  }

  return prisma.project.create({
    data: { name: input.name, leadId: input.leadId },
  });
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: { name: input.name, projectId: input.projectId },
  });
}
