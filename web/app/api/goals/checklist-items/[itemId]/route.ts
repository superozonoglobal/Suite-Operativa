import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleChecklistItem } from "@/lib/services/goals";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function PATCH(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { itemId } = await params;
  const item = await toggleChecklistItem(itemId);
  return NextResponse.json({ data: item, meta: {}, errors: [] });
}
