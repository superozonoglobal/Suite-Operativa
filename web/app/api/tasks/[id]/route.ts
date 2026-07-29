import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskStatus, updateTaskFields } from "@/lib/services/tasks";
import { updateTaskSchema } from "@/lib/validation/task";
import { errorResponse } from "@/lib/api/errorResponse";

// Next.js 16: dynamic route params are a Promise (see plan Global Constraints).
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: { assignee: true, project: true, product: true, comments: true, history: true },
  });
  if (!task) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Task not found" }] }, { status: 404 });
  }
  return NextResponse.json({ data: task, meta: {}, errors: [] });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const actingUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actingUser) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.status) {
      const task = await updateTaskStatus(id, parsed.data.status, actingUser);
      return NextResponse.json({ data: task, meta: {}, errors: [] });
    }

    const { status: _status, ...rest } = parsed.data;
    void _status;
    const task = await updateTaskFields(id, rest, actingUser);
    return NextResponse.json({ data: task, meta: {}, errors: [] });
  } catch (err) {
    return errorResponse(err);
  }
}
