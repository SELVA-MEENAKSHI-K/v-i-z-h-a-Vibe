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
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");
    const radiusRaw = searchParams.get("radiusKm");
    const parsed = venueSearchSchema.parse({
      city: searchParams.get("city") || undefined,
      query: searchParams.get("query") || undefined,
      lat: latRaw != null ? Number(latRaw) : undefined,
      lng: lngRaw != null ? Number(lngRaw) : undefined,
      radiusKm: radiusRaw != null ? Number(radiusRaw) : undefined,
    });
    const venueType = searchParams.get("venueType") || undefined;
    // Strict mode (default) still includes hotels-with-possible-facilities but
    // labelled; verifiedOnly=1 excludes them entirely.
    const verifiedOnly = searchParams.get("verifiedOnly") === "1";
    const usedLocation = typeof parsed.lat === "number" && typeof parsed.lng === "number";

    const r = await searchVenues({ ...parsed, venueType, includeUnverified: !verifiedOnly });

    // Build a clear, honest notice describing exactly what the user is seeing.
    let notice: string;
    if (r.usedProvider) {
      notice =
        r.catalogCount > 0
          ? `Live Geoapify results + ${r.catalogCount} verified catalog record(s). Capacity, pricing, and availability are unverified unless marked — contact venue to confirm.`
          : "Live venue data from Geoapify Places (OpenStreetMap data). Capacity, pricing, and availability are unverified — contact venue to confirm.";
    } else if (r.providerError) {
      notice = `Live venue search is unavailable right now (${r.providerError}). ${r.catalogCount > 0 ? "Showing authorized catalog records only." : "No live results to show."}`;
    } else if (r.keyMissing && r.sampleOnly) {
      notice = "Sample data — not live venue information. Add GEOAPIFY_API_KEY to enable live venue search.";
    } else if (r.keyMissing) {
      notice = "Showing authorized catalog records. Add GEOAPIFY_API_KEY to also search live venues.";
    } else {
      notice = "Showing available venues.";
    }

    if (usedLocation && r.usedProvider) {
      notice = `Live event venues near your location (within ${parsed.radiusKm ?? 25} km). ${notice}`;
    } else if (usedLocation && r.keyMissing) {
      notice = "Location detected, but live search needs GEOAPIFY_API_KEY. " + notice;
    }
    if (r.usedProvider && r.excludedCount && r.excludedCount > 0) {
      notice += verifiedOnly
        ? ` ${r.excludedCount} result(s) with unconfirmed event facilities were hidden (verified-only mode).`
        : ` ${r.excludedCount} non-event result(s) were filtered out.`;
    }
    if (r.usedProvider && r.venues.length === 0 && verifiedOnly) {
      notice +=
        " No venues with provider-confirmed event facilities were found here — OpenStreetMap often lacks a banquet-hall category in this area. Turn off verified-only to see nearby hotels (facilities unverified).";
    }

    return ok({
      live: r.live,
      usedProvider: r.usedProvider,
      provider: "geoapify",
      usedLocation,
      keyMissing: r.keyMissing,
      sampleOnly: r.sampleOnly,
      providerError: r.providerError,
      catalogCount: r.catalogCount,
      excludedCount: r.excludedCount ?? 0,
      city: parsed.city ?? null,
      query: parsed.query ?? null,
      source: r.usedProvider ? "geoapify" : r.sampleOnly ? "sample" : "catalog",
      notice,
      count: r.venues.length,
      venues: r.venues,
    });
  } catch (err) {
    return handleError(err);
  }
}
