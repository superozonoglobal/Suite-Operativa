import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateGoalProgress, approveGoal } from "@/lib/services/goals";
import { errorResponse } from "@/lib/api/errorResponse";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateGoalSchema = z
  .object({
    current: z.number().int().optional(),
    status: z.enum(["APROBADA"]).optional(),
  })
  .refine((data) => data.current !== undefined || data.status !== undefined, {
    message: "current or status is required",
  });

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
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.status === "APROBADA") {
      const goal = await approveGoal(id, actingUser);
      return NextResponse.json({ data: goal, meta: {}, errors: [] });
    }

    const goal = await updateGoalProgress(id, parsed.data.current!, actingUser);
    return NextResponse.json({ data: goal, meta: {}, errors: [] });
  } catch (err) {
    return errorResponse(err);
  }
}
