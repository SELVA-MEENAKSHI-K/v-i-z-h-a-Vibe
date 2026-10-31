import { ok, fail } from "@/lib/api";
import { getIntegrationStatus } from "@/lib/config";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/health          — fast liveness check (does not touch the DB).
// GET /api/health?deep=1    — readiness check: also verifies the database is
//                             reachable AND seeded (event catalog present).
//
// The deep check exists because event generation depends on Postgres being
// reachable, MIGRATED, and SEEDED. A plain "healthy" response that never hits
// the DB would hide the most common production failure (DB URL wrong / missing
// migrations / unseeded catalog), so the deep probe reports those explicitly.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deep = searchParams.get("deep") === "1" || searchParams.get("deep") === "true";

  const base = {
    status: "healthy",
    service: "vizhavibe",
    time: new Date().toISOString(),
    integrations: getIntegrationStatus(),
  };

  if (!deep) return ok(base);

  // Deep readiness probe.
  try {
    // 1. Can we reach the database at all?
    await prisma.$queryRaw`SELECT 1`;
    // 2. Is the event catalog seeded? (Plan creation needs eventType rows.)
    const eventTypeCount = await prisma.eventType.count();
    const seeded = eventTypeCount > 0;
    return ok({
      ...base,
      database: { reachable: true, migrated: true, seeded, eventTypeCount },
      ready: seeded,
      note: seeded
        ? "Database reachable, migrated and seeded."
        : "Database reachable but NOT seeded — run `npm run seed` (or `prisma db seed`) so the event catalog exists; plan creation and generation will fail until then.",
    });
  } catch (err) {
    // Reaching here means the DB is unreachable OR not migrated (tables absent).
    const message = err instanceof Error ? err.message : "unknown database error";
    return fail(
      "Database not ready. Check DATABASE_URL and that `prisma migrate deploy` has run. " +
        `Details: ${message.slice(0, 200)}`,
      503,
    );
  }
}
