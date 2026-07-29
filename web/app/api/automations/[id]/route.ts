import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setAutomationEnabled } from "@/lib/services/automations";
import { errorResponse } from "@/lib/api/errorResponse";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const toggleSchema = z.object({ enabled: z.boolean() });

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
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  try {
    const automation = await setAutomationEnabled(id, parsed.data.enabled, actingUser);
    return NextResponse.json({ data: automation, meta: {}, errors: [] });
  } catch (err) {
    return errorResponse(err);
  }
}
