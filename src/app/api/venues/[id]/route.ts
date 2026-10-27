import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeVenue } from "@/lib/plans";
import { SAMPLE_VENUES } from "@/data/sampleVenues";
import { normalizeSample } from "@/lib/venues";

export const dynamic = "force-dynamic";

// Venue details. Resolves a stored venue (DB id or providerId) or a sample
// providerId. Live-only providers are returned as normalized sample-free data
// only when persisted; we never fabricate missing fields.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const dbVenue = await prisma.venue.findFirst({
      where: { OR: [{ id }, { providerId: id }] },
    });
    if (dbVenue) {
      return ok(serializeVenue(dbVenue));
    }

    // Sample fallback (e.g. "sample:mdu-1").
    const sample = SAMPLE_VENUES.find((v) => v.providerId === id);
    if (sample) {
      return ok({ ...normalizeSample(sample), id: sample.providerId });
    }

    return fail("Venue not found.", 404);
  } catch (err) {
    return handleError(err);
  }
}
