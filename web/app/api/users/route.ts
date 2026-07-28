import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/services/users";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const users = await listUsers();
  return NextResponse.json({ data: users, meta: { total: users.length }, errors: [] });
}
