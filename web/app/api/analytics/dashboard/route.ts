import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/services/analytics";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const summary = await getAnalyticsSummary();
  return NextResponse.json({ data: summary, meta: {}, errors: [] });
}
