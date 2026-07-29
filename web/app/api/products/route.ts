import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/services/projects";
import { createProductSchema } from "@/lib/validation/project";
import { errorResponse } from "@/lib/api/errorResponse";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const actingUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!actingUser) {
    return NextResponse.json({ data: null, meta: {}, errors: [{ message: "Unauthorized" }] }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, meta: {}, errors: parsed.error.issues.map((i) => ({ message: i.message })) },
      { status: 400 }
    );
  }

  try {
    const product = await createProduct(parsed.data, actingUser);
    return NextResponse.json({ data: product, meta: {}, errors: [] }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
