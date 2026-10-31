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

    const { vendors, usedSamples } = await discoverVendors({
      category,
      city,
      query,
      maxPrice: maxPriceRaw != null && maxPriceRaw !== "" ? Number(maxPriceRaw) : undefined,
      minRating: minRatingRaw != null && minRatingRaw !== "" ? Number(minRatingRaw) : undefined,
    });

    return ok({
      categories: VENDOR_CATEGORIES,
      count: vendors.length,
      usedSamples,
      notice: usedSamples
        ? "Showing verified vendors where available, plus clearly-labelled sample vendors. Sample prices and ratings are indicative, not confirmed quotes."
        : "Showing verified vendor records.",
      vendors,
    });
  } catch (err) {
    return handleError(err);
  }
}
