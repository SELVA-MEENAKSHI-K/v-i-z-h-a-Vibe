import { ok, fail, handleError } from "@/lib/api";
import { discoverVendors } from "@/lib/vendors";
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_SLUGS } from "@/data/vendors";
import { getServerConfig } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// GET /api/vendors?category=&city=&query=&maxPrice=&minRating=
// Vendor discovery: verified DB records + clearly-labelled samples. Public (no
// plan), rate-limited. Never fabricates availability/reviews.
export async function GET(req: Request) {
  try {
    const config = getServerConfig();
    const ip = clientIp(req.headers);
    if (!rateLimit(`vendors:${ip}`, config.rateLimitPerMinute).allowed) {
      return fail("Too many requests. Please slow down.", 429);
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    if (category && !VENDOR_CATEGORY_SLUGS.includes(category)) {
      return fail("Unknown vendor category.", 422);
    }
    const city = searchParams.get("city") || undefined;
    const query = searchParams.get("query") || undefined;
    const maxPriceRaw = searchParams.get("maxPrice");
    const minRatingRaw = searchParams.get("minRating");
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");

    const result = await discoverVendors({
      category,
      city,
      query,
      maxPrice: maxPriceRaw != null && maxPriceRaw !== "" ? Number(maxPriceRaw) : undefined,
      minRating: minRatingRaw != null && minRatingRaw !== "" ? Number(minRatingRaw) : undefined,
      lat: latRaw != null && latRaw !== "" ? Number(latRaw) : undefined,
      lng: lngRaw != null && lngRaw !== "" ? Number(lngRaw) : undefined,
    });

    const { vendors, live, usedProvider, usedSamples, dbCount, keyMissing, providerError, source } = result;

    // Build an HONEST notice that reflects exactly what was returned.
    let notice: string;
    if (usedProvider && live) {
      notice =
        `Live vendors from Geoapify (OpenStreetMap data)${dbCount > 0 ? ` + ${dbCount} verified record(s)` : ""}. ` +
        "Live listings carry no ratings or prices — contact the vendor for a confirmed quote.";
    } else if (usedProvider && providerError) {
      notice = `Live vendor search is unavailable right now (${providerError}). Showing verified records only.`;
    } else if (usedProvider) {
      notice = "No live vendors matched. Showing verified records only.";
    } else if (keyMissing && usedSamples) {
      notice =
        "Sample vendors — not live data. Add GEOAPIFY_API_KEY to discover real vendors near your city. " +
        "Sample prices and ratings are indicative, never confirmed quotes.";
    } else {
      notice = "Showing verified vendor records.";
    }

    return ok({
      categories: VENDOR_CATEGORIES,
      count: vendors.length,
      live,
      usedProvider,
      usedSamples,
      keyMissing,
      providerError,
      source,
      notice,
      vendors,
    });
  } catch (err) {
    return handleError(err);
  }
}
