import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listRequisitions, createRequisition } from "@/lib/services/requisitions";
import { createRequisitionSchema } from "@/lib/validation/requisition";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const { items, total } = await listRequisitions({
    fromUserId: searchParams.get("fromUserId") ?? undefined,
    toUserId: searchParams.get("toUserId") ?? undefined,
  });
  return NextResponse.json({ data: items, meta: { total }, errors: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createRequisitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  const requisition = await createRequisition(parsed.data, session.user.id);
  return NextResponse.json({ data: requisition, meta: {}, errors: [] }, { status: 201 });
}
