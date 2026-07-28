import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listGoals, createGoal } from "@/lib/services/goals";
import { createGoalSchema } from "@/lib/validation/goal";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const { items, total } = await listGoals({
    userId: searchParams.get("userId") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  return NextResponse.json({ data: items, meta: { total }, errors: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  const goal = await createGoal(parsed.data, session.user.id);
  return NextResponse.json({ data: goal, meta: {}, errors: [] }, { status: 201 });
}
