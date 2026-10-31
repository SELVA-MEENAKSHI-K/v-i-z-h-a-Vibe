// Vendor service: discovery (DB verified records + clearly-labelled samples),
// normalization, and the saved-vendor workflow + budget synchronization.
//
// Honesty policy: a vendor's `verified` flag and `isSample` flag always travel
// with it to the client, so the UI can distinguish source-verified data from
// demo/estimated data. We never fabricate availability; prices/ratings are only
// ever shown as they come from the record (samples carry indicative ranges and
// no rating).

import { prisma } from "./db";
import { getServerConfig } from "./config";
import { distanceKm } from "./venues";
import { filterSampleVendors, vendorBudgetCategory, type VendorFilter, type VendorPackage } from "@/data/vendors";

export type NormalizedVendor = {
  id: string;
  source: string; // "sample" | "catalog" | "manual"
  isSample: boolean;
  verified: boolean;
  name: string;
  category: string;
  city: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  photos: string[];
  rating: number | null;
  reviewCount: number | null;
  packages: VendorPackage[];
  sourceName: string | null;
  sourceUrl: string | null;
};

function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

type VendorRow = {
  id: string;
  name: string;
  category: string;
  city: string;
  area: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  photos: string | null;
  rating: number | null;
  reviewCount: number | null;
  packages: string | null;
  source: string;
  sourceName: string | null;
  sourceUrl: string | null;
  verification: string;
  isSample: boolean;
};

export function normalizeVendorRow(v: VendorRow): NormalizedVendor {
  return {
    id: v.id,
    source: v.source,
    isSample: v.isSample,
    verified: v.verification === "verified",
    name: v.name,
    category: v.category,
    city: v.city,
    area: v.area,
    address: v.address,
    phone: v.phone,
    email: v.email,
    website: v.website,
    photos: parseJson<string[]>(v.photos, []),
    rating: v.rating,
    reviewCount: v.reviewCount,
    packages: parseJson<VendorPackage[]>(v.packages, []),
    sourceName: v.sourceName,
    sourceUrl: v.sourceUrl,
  };
}

// --- Live provider (Geoapify Places) ----------------------------------------
//
// VizhaVibe discovers REAL vendors via the Geoapify Places API (OpenStreetMap
// data), mirroring the venue discovery integration. Honesty rules enforced
// here, identical to venues:
//   • Live results carry source="geoapify", verified=false, and a source
//     URL/name + lastVerifiedAt so the UI can attribute them.
//   • We NEVER fabricate ratings, reviews, prices, packages or availability.
//     Geoapify/OSM provides none of those, so live vendors show NO price and
//     the UI renders "Contact vendor for a confirmed quote".
//   • We do NOT copy live Geoapify content into our Vendor catalog table. Live
//     results are returned transient; only a user action (save) promotes a
//     clearly-flagged record, per the existing ensureVendorRow() path.

// Approx city centres (kept local to avoid a venues import cycle beyond the
// Haversine helper we reuse).
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  madurai: { lat: 9.9252, lng: 78.1198 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
};

// Per-category Geoapify text-search terms. OSM has no clean "wedding caterer"
// taxonomy, so we query named businesses by term near the city centre and keep
// only plausible matches. Terms are intentionally specific to each category so
// unrelated categories never return the same places.
const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  photography: ["photography studio", "wedding photographer", "photo studio"],
  catering: ["catering service", "caterers", "banquet catering"],
  decoration: ["event decorators", "wedding decoration", "flower decoration"],
  makeup: ["bridal makeup", "makeup studio", "beauty parlour"],
  music: ["event dj", "live band", "sound and lighting"],
  invitations: ["wedding cards", "invitation printing", "printing press"],
  transportation: ["car rental", "travels", "bus rental"],
  equipment: ["event rentals", "tent house", "sound equipment rental"],
};

type GeocodeFeature = {
  properties?: {
    name?: string;
    formatted?: string;
    address_line1?: string;
    city?: string;
    lat?: number;
    lon?: number;
    categories?: string[];
    website?: string;
    "datasource"?: { raw?: { phone?: string; "contact:phone"?: string } };
    place_id?: string;
  };
};

function geoMapsUrl(lat: number | null, lng: number | null): string | null {
  if (lat != null && lng != null) return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  return null;
}

function normalizeGeoapifyVendor(f: GeocodeFeature, category: string, cityHint?: string): NormalizedVendor | null {
  const p = f.properties ?? {};
  const name = p.name || p.address_line1 || "";
  if (!name) return null; // never surface an unnamed business as a vendor
  const lat = typeof p.lat === "number" ? p.lat : null;
  const lng = typeof p.lon === "number" ? p.lon : null;
  const raw = p.datasource?.raw ?? {};
  const phone = raw.phone || raw["contact:phone"] || null;
  return {
    id: `geoapify:${category}:${p.place_id || `${lat},${lng},${name}`}`,
    source: "geoapify",
    isSample: false,
    verified: false,
    name,
    category,
    city: p.city ?? cityHint ?? null,
    area: p.city ?? null,
    address: p.formatted ?? null,
    phone,
    email: null,
    website: p.website ?? null,
    // No verified photo from OSM — the card shows a labelled category illustration.
    photos: [],
    // Geoapify/OSM provides NO ratings, reviews, prices or packages. We show none.
    rating: null,
    reviewCount: null,
    packages: [],
    sourceName: "Geoapify Places (OpenStreetMap data)",
    sourceUrl: p.website ?? geoMapsUrl(lat, lng),
  };
}

async function discoverLiveVendors(
  apiKey: string,
  category: string | undefined,
  center: { lat: number; lng: number },
  city: string | undefined,
  query: string | undefined,
  radiusKm: number,
  revalidate: number,
): Promise<{ vendors: NormalizedVendor[]; error: string | null }> {
  // Which categories to search: the selected one, or all eight.
  const cats = category ? [category] : Object.keys(CATEGORY_SEARCH_TERMS);
  const seen = new Set<string>();
  const collected: NormalizedVendor[] = [];
  let lastError: string | null = null;

  for (const cat of cats) {
    const base = CATEGORY_SEARCH_TERMS[cat] ?? [cat];
    const terms = query?.trim() ? [`${query.trim()} ${base[0]}`] : base;
    for (const term of terms) {
      const text = city ? `${term} ${city}` : term;
      const url =
        "https://api.geoapify.com/v1/geocode/search?" +
        new URLSearchParams({
          text,
          filter: `circle:${center.lng},${center.lat},${Math.round(radiusKm * 1000)}`,
          bias: `proximity:${center.lng},${center.lat}`,
          limit: "10",
          apiKey,
        }).toString();
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate } });
        if (!res.ok) {
          lastError = `Geoapify error ${res.status}`;
          continue;
        }
        const json = (await res.json()) as { features?: GeocodeFeature[] };
        for (const f of json.features ?? []) {
          const v = normalizeGeoapifyVendor(f, cat, city);
          if (!v) continue;
          if (seen.has(v.id)) continue;
          const lat = f.properties?.lat ?? null;
          const lng = f.properties?.lon ?? null;
          if (lat == null || lng == null) continue;
          if (distanceKm(center.lat, center.lng, lat, lng) > radiusKm) continue;
          seen.add(v.id);
          collected.push(v);
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "vendor search failed";
      }
    }
  }

  return { vendors: collected, error: collected.length === 0 ? lastError : null };
}

export type VendorDiscoverResult = {
  vendors: NormalizedVendor[];
  // Honest state flags (mirrors the venue discovery result).
  live: boolean; // live Geoapify results are present
  usedProvider: boolean; // the provider was queried
  usedSamples: boolean; // labelled sample records are included
  dbCount: number; // verified/catalog DB records included
  keyMissing: boolean; // no GEOAPIFY_API_KEY configured
  providerError: string | null; // provider failed; we degraded gracefully
  source: "geoapify" | "catalog" | "sample";
};

// Discover vendors. Priority & honesty:
//   1. Verified/published DB (catalog) records first — always.
//   2. Live Geoapify results when a key is configured (real, attributed, no
//      fabricated price/rating).
//   3. Clearly-labelled sample records ONLY when there is no live provider, so
//      every category still shows something — never silently faked as real.
export async function discoverVendors(filter: VendorFilter & { lat?: number; lng?: number; radiusKm?: number }): Promise<VendorDiscoverResult> {
  const config = getServerConfig();

  // 1. Verified/published DB records.
  const where: Record<string, unknown> = { published: true };
  if (filter.category) where.category = filter.category;
  if (filter.city) where.city = filter.city;
  if (filter.query) where.name = { contains: filter.query };
  const rows = (await prisma.vendor.findMany({ where, orderBy: [{ verification: "asc" }, { name: "asc" }], take: 60 })) as unknown as VendorRow[];
  const dbVendors = rows.map(normalizeVendorRow).filter((v) => {
    if (typeof filter.minRating === "number" && (v.rating ?? 0) < filter.minRating) return false;
    if (typeof filter.maxPrice === "number") {
      const cheapest = v.packages.length ? Math.min(...v.packages.map((p) => p.priceMin)) : Infinity;
      if (cheapest > filter.maxPrice) return false;
    }
    return true;
  });
  const dbNames = new Set(dbVendors.map((v) => v.name.toLowerCase()));

  // 2. Live provider (Geoapify) when configured.
  if (config.placesLive) {
    const hasCoords = typeof filter.lat === "number" && typeof filter.lng === "number";
    const center = hasCoords
      ? { lat: filter.lat as number, lng: filter.lng as number }
      : filter.city
        ? CITY_CENTERS[filter.city.trim().toLowerCase()]
        : CITY_CENTERS.madurai; // default to Madurai, the launch city

    const radiusKm = Math.min(50, Math.max(1, filter.radiusKm ?? 25));
    const { vendors: live, error } = await discoverLiveVendors(
      config.geoapifyKey,
      filter.category,
      center,
      filter.city,
      filter.query,
      radiusKm,
      Math.max(60, config.placesCacheHours * 3600),
    );

    // Live results can't be price/rating filtered (they carry none); apply the
    // minRating filter only to DB rows, which we already did above.
    const liveDeduped = live.filter((v) => !dbNames.has(v.name.toLowerCase()));

    return {
      vendors: [...dbVendors, ...liveDeduped],
      live: liveDeduped.length > 0,
      usedProvider: true,
      usedSamples: false,
      dbCount: dbVendors.length,
      keyMissing: false,
      providerError: liveDeduped.length === 0 ? error : null,
      source: liveDeduped.length > 0 ? "geoapify" : dbVendors.length > 0 ? "catalog" : "geoapify",
    };
  }

  // 3. No live provider: DB records + clearly-labelled samples.
  const samples = filterSampleVendors(filter)
    .filter((s) => !dbNames.has(s.name.toLowerCase()))
    .map(
      (s): NormalizedVendor => ({
        id: s.id,
        source: "sample",
        isSample: true,
        verified: false,
        name: s.name,
        category: s.category,
        city: s.city,
        area: s.area ?? null,
        address: s.address ?? null,
        phone: s.phone ?? null,
        email: s.email ?? null,
        website: s.website ?? null,
        photos: s.photos,
        rating: s.rating,
        reviewCount: s.reviewCount,
        packages: s.packages,
        sourceName: "Sample",
        sourceUrl: null,
      }),
    );

  return {
    vendors: [...dbVendors, ...samples],
    live: false,
    usedProvider: false,
    usedSamples: samples.length > 0,
    dbCount: dbVendors.length,
    keyMissing: true,
    providerError: null,
    source: dbVendors.length > 0 && samples.length === 0 ? "catalog" : "sample",
  };
}

// --- Saved-vendor serialization (for the plan) ------------------------------

export type SerializedSavedVendor = {
  id: string;
  vendorId: string;
  status: string; // ENQUIRED | NEGOTIATING | CONFIRMED | CANCELLED
  favourite: boolean;
  note: string | null;
  packageName: string | null;
  agreedCost: number | null;
  enquiry: string | null;
  vendor: NormalizedVendor | null;
};

// Resolve a vendor by id — either a DB Vendor row or a sample id ("sample:…").
export async function resolveVendor(vendorId: string): Promise<NormalizedVendor | null> {
  if (vendorId.startsWith("sample:")) {
    const all = filterSampleVendors({});
    const s = all.find((v) => v.id === vendorId);
    if (!s) return null;
    return {
      id: s.id,
      source: "sample",
      isSample: true,
      verified: false,
      name: s.name,
      category: s.category,
      city: s.city,
      area: s.area ?? null,
      address: s.address ?? null,
      phone: s.phone ?? null,
      email: s.email ?? null,
      website: s.website ?? null,
      photos: s.photos,
      rating: s.rating,
      reviewCount: s.reviewCount,
      packages: s.packages,
      sourceName: "Sample",
      sourceUrl: null,
    };
  }
  const row = (await prisma.vendor.findUnique({ where: { id: vendorId } })) as unknown as VendorRow | null;
  return row ? normalizeVendorRow(row) : null;
}

// Ensure a DB Vendor row exists for a sample vendor so SavedVendor can FK to it.
// (Samples are promoted to real catalog rows on first save; still flagged.)
export async function ensureVendorRow(vendorId: string): Promise<string | null> {
  if (!vendorId.startsWith("sample:")) {
    const row = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    return row ? row.id : null;
  }
  const s = filterSampleVendors({}).find((v) => v.id === vendorId);
  if (!s) return null;
  // Deterministic dedupe: one catalog row per sample identity (name+category+city).
  const existing = await prisma.vendor.findFirst({
    where: { name: s.name, category: s.category, city: s.city, source: "sample" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.vendor.create({
    data: {
      name: s.name,
      category: s.category,
      city: s.city,
      area: s.area ?? null,
      address: s.address ?? null,
      photos: JSON.stringify(s.photos),
      rating: s.rating,
      reviewCount: s.reviewCount,
      packages: JSON.stringify(s.packages),
      source: "sample",
      sourceName: "Sample",
      verification: "unverified",
      isSample: true,
      published: true,
    },
    select: { id: true },
  });
  return created.id;
}

// Recompute the plan's vendor budget lines from CONFIRMED saved vendors.
// Each confirmed vendor with an agreedCost becomes a NON-estimated budget line
// in its mapped category. We only touch vendor-sourced lines (label prefix),
// leaving the user's own budget lines intact.
const VENDOR_LINE_PREFIX = "Vendor: ";

export async function syncVendorBudget(planId: string): Promise<void> {
  const saved = (await prisma.savedVendor.findMany({
    where: { planId, status: "CONFIRMED" },
    include: { vendor: true },
  })) as unknown as Array<{ agreedCost: number | null; packageName: string | null; vendor: VendorRow }>;

  // Remove previous vendor-sourced budget lines for this plan.
  await prisma.budgetItem.deleteMany({ where: { planId, label: { startsWith: VENDOR_LINE_PREFIX } } });

  const confirmed = saved.filter((s) => typeof s.agreedCost === "number" && (s.agreedCost ?? 0) > 0);
  if (confirmed.length === 0) return;

  // Place vendor lines after existing lines.
  const count = await prisma.budgetItem.count({ where: { planId } });
  await prisma.budgetItem.createMany({
    data: confirmed.map((s, i) => ({
      planId,
      category: vendorBudgetCategory(s.vendor.category),
      label: `${VENDOR_LINE_PREFIX}${s.vendor.name}${s.packageName ? ` (${s.packageName})` : ""}`,
      quantity: 1,
      unitCostMin: s.agreedCost as number,
      unitCostMax: s.agreedCost as number,
      estimated: false, // confirmed vendor cost is NOT an estimate
      assumption: "Confirmed vendor cost",
      sortOrder: count + i,
    })),
  });
}
