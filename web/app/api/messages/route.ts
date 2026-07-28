import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listThread, sendMessage, markThreadRead } from "@/lib/services/messages";
import { sendMessageSchema } from "@/lib/validation/message";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");
  if (!withUserId) {
    return NextResponse.json(
      { data: null, meta: {}, errors: [{ message: "'with' query param is required" }] },
      { status: 400 }
    );
  }

  const thread = await listThread(session.user.id, withUserId);
  await markThreadRead(session.user.id, withUserId);
  return NextResponse.json({ data: thread, meta: {}, errors: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  const message = await sendMessage(parsed.data, session.user.id);
  return NextResponse.json({ data: message, meta: {}, errors: [] }, { status: 201 });
}
