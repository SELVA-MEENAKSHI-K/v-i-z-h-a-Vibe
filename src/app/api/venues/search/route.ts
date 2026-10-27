import { ok, fail, handleError } from "@/lib/api";
import { venueSearchSchema } from "@/lib/schemas";
import { searchVenues } from "@/lib/venues";
import { getServerConfig } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const config = getServerConfig();
    const ip = clientIp(req.headers);
    const limit = rateLimit(`search:${ip}`, config.rateLimitPerMinute);
    if (!limit.allowed) {
      return fail("Too many requests. Please slow down and try again in a minute.", 429);
    }

    const { searchParams } = new URL(req.url);
    const parsed = venueSearchSchema.parse({
      city: searchParams.get("city") || undefined,
      query: searchParams.get("query") || undefined,
    });
    const venueType = searchParams.get("venueType") || undefined;

    const r = await searchVenues({ ...parsed, venueType });

    // Build a clear, honest notice describing exactly what the user is seeing.
    let notice: string;
    if (r.usedGoogle) {
      notice =
        r.catalogCount > 0
          ? `Live Google results${r.catalogCount ? ` + ${r.catalogCount} verified catalog record(s)` : ""}. Capacity, pricing, and availability are unverified unless marked — contact venue to confirm.`
          : "Live venue data from Google Maps Platform. Capacity, pricing, and availability are unverified — contact venue to confirm.";
    } else if (r.googleError) {
      notice = "Google search is temporarily unavailable. Showing authorized catalog records only.";
    } else if (r.keyMissing && r.sampleOnly) {
      notice = "Sample data — not live venue information. Add GOOGLE_PLACES_API_KEY to enable live venue search.";
    } else if (r.keyMissing) {
      notice = "Showing authorized catalog records. Add GOOGLE_PLACES_API_KEY to also search live Google venues.";
    } else {
      notice = "Showing available venues.";
    }

    return ok({
      live: r.live,
      usedGoogle: r.usedGoogle,
      keyMissing: r.keyMissing,
      sampleOnly: r.sampleOnly,
      googleError: r.googleError,
      catalogCount: r.catalogCount,
      city: parsed.city ?? null,
      query: parsed.query ?? null,
      source: r.usedGoogle ? "google" : r.sampleOnly ? "sample" : "catalog",
      notice,
      count: r.venues.length,
      venues: r.venues,
    });
  } catch (err) {
    return handleError(err);
  }
}
