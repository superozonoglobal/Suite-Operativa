import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUnreadForUser, markAllRead } from "@/lib/services/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const items = await listUnreadForUser(session.user.id);
  return NextResponse.json({ data: items, meta: { total: items.length }, errors: [] });
}

export async function PATCH() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  await markAllRead(session.user.id);
  return NextResponse.json({ data: { ok: true }, meta: {}, errors: [] });
}
