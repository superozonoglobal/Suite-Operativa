import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { respondToRequisition } from "@/lib/services/requisitions";
import { respondRequisitionSchema } from "@/lib/validation/requisition";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = respondRequisitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  try {
    const requisition = await respondToRequisition(id, parsed.data, session.user.id);
    return NextResponse.json({ data: requisition, meta: {}, errors: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    return NextResponse.json({ data: null, meta: {}, errors: [{ message }] }, { status: 403 });
  }
}
