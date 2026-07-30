import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgSettings, updateOrgSettings } from "@/lib/services/orgSettings";
import { z } from "zod";
import { errorResponse } from "@/lib/api/errorResponse";
import type { User } from "@/app/generated/prisma/client";

const updateConfigSchema = z.object({
  allowedEmailDomain: z.string().optional(),
  allowedEmails: z.array(z.string().email()).optional(),
  openRegistration: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const settings = await getOrgSettings();
  return NextResponse.json({ data: settings, meta: {}, errors: [] });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  try {
    const settings = await updateOrgSettings(parsed.data, {
      level: session.user.level as User["level"],
    });
    return NextResponse.json({ data: settings, meta: {}, errors: [] });
  } catch (err) {
    return errorResponse(err);
  }
}
