import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { catalogVenueSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// Simple admin guard: require ADMIN_TOKEN to match the x-admin-token header.
// If ADMIN_TOKEN is unset, writes are disabled (read stays public).
function assertAdmin(req: Request): string | null {
  const expected = process.env.ADMIN_TOKEN?.trim() || "";
  if (!expected) return "Admin writes are disabled. Set ADMIN_TOKEN in .env to manage catalog venues.";
  const got = req.headers.get("x-admin-token")?.trim() || "";
  if (got !== expected) return "Unauthorized.";
  return null;
}

// GET — list published catalog records (public, read-only).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || undefined;
    const rows = await prisma.catalogVenue.findMany({
      where: { published: true, ...(city ? { city } : {}) },
      orderBy: [{ verification: "asc" }, { name: "asc" }],
      take: 100,
    });
    return ok({ count: rows.length, venues: rows });
  } catch (err) {
    return handleError(err);
  }
}

// POST — create or update an authorized catalog record (admin only).
export async function POST(req: Request) {
  try {
    const authErr = assertAdmin(req);
    if (authErr) return fail(authErr, authErr === "Unauthorized." ? 401 : 403);

    const body = await req.json();
    const input = catalogVenueSchema.parse(body);

    const data = {
      name: input.name,
      venueType: input.venueType,
      address: input.address ?? null,
      city: input.city,
      area: input.area ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      capacityMin: input.capacityMin ?? null,
      capacityMax: input.capacityMax ?? null,
      priceMin: input.priceMin ?? null,
      priceMax: input.priceMax ?? null,
      amenities: input.amenities ? JSON.stringify(input.amenities) : null,
      placeId: input.placeId ?? null,
      mapsUrl: input.mapsUrl ?? null,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl ?? null,
      verification: input.verification,
      lastVerifiedAt: input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : null,
      published: input.published,
    };

    // Upsert by placeId when provided, else create a new record.
    const existing = input.placeId
      ? await prisma.catalogVenue.findFirst({ where: { placeId: input.placeId } })
      : null;

    const venue = existing
      ? await prisma.catalogVenue.update({ where: { id: existing.id }, data })
      : await prisma.catalogVenue.create({ data });

    return ok(venue, { status: existing ? 200 : 201 });
  } catch (err) {
    return handleError(err);
  }
}
