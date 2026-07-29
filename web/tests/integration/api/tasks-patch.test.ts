import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { PATCH } from "@/app/api/tasks/[id]/route";

const TEST_EMAIL = "tasks-patch-route-test@example.com";

describe("PATCH /api/tasks/[id]", () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await prisma.task.deleteMany({ where: { title: "Route test task" } });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  });

  it("reassigns a task's assigneeId without a 500", async () => {
    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, name: "Route Test User", level: "LIDER" },
    });
    const task = await prisma.task.create({
      data: { title: "Route test task", createdById: user.id },
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: user.id, email: TEST_EMAIL },
      expires: "2099-01-01",
    } as never);

    const req = new NextRequest(`http://localhost/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId: user.id }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: task.id }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.assigneeId).toBe(user.id);
  });
});
