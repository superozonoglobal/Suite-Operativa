import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listProjectsWithProgress, createProject } from "@/lib/services/projects";
import { createProjectSchema } from "@/lib/validation/project";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const projects = await listProjectsWithProgress();
  return NextResponse.json({ data: projects, meta: { total: projects.length }, errors: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const actingUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actingUser) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  try {
    const project = await createProject(parsed.data, actingUser);
    return NextResponse.json({ data: project, meta: {}, errors: [] }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ data: null, meta: {}, errors: [{ message }] }, { status: 403 });
  }
}
