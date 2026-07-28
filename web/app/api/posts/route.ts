import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listPostsByMonth, listSchedulableTasks, schedulePost } from "@/lib/services/posts";
import { schedulePostSchema } from "@/lib/validation/post";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (searchParams.get("schedulable") === "true") {
    const schedulable = await listSchedulableTasks();
    return NextResponse.json({ data: schedulable, meta: { total: schedulable.length }, errors: [] });
  }

  if (!year || !month) {
    return NextResponse.json(
      { data: null, meta: {}, errors: [{ message: "year and month query params are required" }] },
      { status: 400 }
    );
  }

  const { items, total } = await listPostsByMonth(year, month);
  return NextResponse.json({ data: items, meta: { total }, errors: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schedulePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  const post = await schedulePost(parsed.data);
  return NextResponse.json({ data: post, meta: {}, errors: [] }, { status: 201 });
}
