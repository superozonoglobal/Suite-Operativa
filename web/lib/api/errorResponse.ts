import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

/**
 * Maps a caught error to a safe JSON response. Known AppErrors (thrown
 * deliberately by our services) surface their message and status code as-is.
 * Anything else (a Prisma error, a bug) is logged server-side and reduced to
 * a generic 500 — never echoed to the client, since that leaks schema/query
 * internals.
 */
export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { data: null, meta: {}, errors: [{ message: err.message }] },
      { status: err.statusCode }
    );
  }

  console.error(err);
  return NextResponse.json(
    { data: null, meta: {}, errors: [{ message: "Internal server error" }] },
    { status: 500 }
  );
}
