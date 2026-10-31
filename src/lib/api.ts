import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Consistent API response helpers. Errors never leak stack traces or secrets.

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}

// Prisma error-code / class signatures we can classify WITHOUT importing the
// Prisma runtime types here (keeps this helper dependency-light). We only read
// a `code`/`name` string — never the message, which could contain the DSN.
function classifyPrisma(err: unknown): { status: number; message: string } | null {
  if (!err || typeof err !== "object") return null;
  const code = "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const name = "name" in err ? String((err as { name?: unknown }).name ?? "") : "";

  // Can't reach the database (bad DATABASE_URL, DB down, network/SSL).
  if (code === "P1000" || code === "P1001" || code === "P1002" || code === "P1017" || name === "PrismaClientInitializationError") {
    return { status: 503, message: "The service is temporarily unable to reach its database. Please try again shortly." };
  }
  // A required table/column is missing — migrations not applied on this DB.
  if (code === "P2021" || code === "P2022") {
    return { status: 503, message: "The service is not fully set up yet. Please try again shortly." };
  }
  // Unique-constraint violation (e.g. duplicate email) — caller usually handles
  // this, but map it to a safe 409 if it bubbles up here.
  if (code === "P2002") {
    return { status: 409, message: "That record already exists." };
  }
  return null;
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail("Invalid request.", 422, err.flatten());
  }

  // Classify well-known database errors into actionable (but non-leaky) codes.
  const prisma = classifyPrisma(err);
  if (prisma) {
    // Log the CODE/NAME for diagnosis, not the full message (may contain a DSN).
    const code = (err as { code?: string }).code ?? (err as { name?: string }).name ?? "unknown";
    console.error(`[api] database error (${code}) -> HTTP ${prisma.status}`);
    return fail(prisma.message, prisma.status);
  }

  // Unknown error: log full detail server-side (for the deploy logs) but never
  // return it to the client. Avoid echoing secrets by logging the error object
  // which the platform captures; we do not forward its text to the response.
  console.error("[api] unhandled error:", err);
  return fail("Something went wrong. Please try again.", 500);
}
