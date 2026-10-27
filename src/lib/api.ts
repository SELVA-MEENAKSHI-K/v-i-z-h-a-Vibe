import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Consistent API response helpers. Errors never leak stack traces or secrets.

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("Invalid request.", 422, err.flatten());
  }
  // Log server-side detail but return a safe message to the client.
  console.error("[api] unhandled error:", err);
  return fail("Something went wrong. Please try again.", 500);
}
