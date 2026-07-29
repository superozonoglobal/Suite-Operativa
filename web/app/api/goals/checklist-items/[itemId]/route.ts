import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleChecklistItem } from "@/lib/services/goals";
import { errorResponse } from "@/lib/api/errorResponse";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function PATCH(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const actingUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actingUser) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { itemId } = await params;

  try {
    const item = await toggleChecklistItem(itemId, actingUser);
    return NextResponse.json({ data: item, meta: {}, errors: [] });
  } catch (err) {
    return errorResponse(err);
  }
}
