import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateGoalProgress } from "@/lib/services/goals";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateGoalSchema = z.object({ current: z.number().int() });

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  const goal = await updateGoalProgress(id, parsed.data.current);
  return NextResponse.json({ data: goal, meta: {}, errors: [] });
}
