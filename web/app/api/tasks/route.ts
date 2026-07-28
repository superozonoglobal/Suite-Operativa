import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listTasks, createTask } from "@/lib/services/tasks";
import { createTaskSchema } from "@/lib/validation/task";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const { items, total } = await listTasks({
    status: searchParams.get("status") ?? undefined,
    assigneeId: searchParams.get("assigneeId") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
  });
  return NextResponse.json({ data: items, meta: { total }, errors: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  const task = await createTask(parsed.data, session.user.id);
  return NextResponse.json({ data: task, meta: {}, errors: [] }, { status: 201 });
}
