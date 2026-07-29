import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { PATCH } from "@/app/api/users/[id]/route";

const TEST_EMAIL = "users-patch-route-test@example.com";

describe("PATCH /api/users/[id]", () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  });

  it("returns a generic 500 (not a raw Prisma error) when the target user doesn't exist", async () => {
    const actor = await prisma.user.create({
      data: { email: TEST_EMAIL, name: "Actor", level: "SUPERUSER" },
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: actor.id, email: TEST_EMAIL },
      expires: "2099-01-01",
    } as never);

    const req = new NextRequest("http://localhost/api/users/does-not-exist", {
      method: "PATCH",
      body: JSON.stringify({ level: "LIDER" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "does-not-exist" }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.errors[0].message).toBe("Internal server error");
    expect(json.errors[0].message).not.toMatch(/prisma|record|findUnique/i);
  });

  it("still returns 403 with a readable message for an actual authorization failure", async () => {
    const target = await prisma.user.create({
      data: { email: "users-patch-target@example.com", name: "Target", level: "COLABORADOR" },
    });
    const actor = await prisma.user.create({
      data: { email: TEST_EMAIL, name: "Actor", level: "COLABORADOR" },
    });

    vi.mocked(auth).mockResolvedValue({
      user: { id: actor.id, email: TEST_EMAIL },
      expires: "2099-01-01",
    } as never);

    const req = new NextRequest(`http://localhost/api/users/${target.id}`, {
      method: "PATCH",
      body: JSON.stringify({ roleTag: "DISENADOR" }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: target.id }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.errors[0].message).toMatch(/forbidden/i);

    await prisma.user.deleteMany({ where: { email: "users-patch-target@example.com" } });
  });
});
