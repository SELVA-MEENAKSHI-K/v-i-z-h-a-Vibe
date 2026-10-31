// Venue discovery. Three clearly-labeled, never-mixed sources:
//   1. "google"  — live Google Places (New) Text Search (when a key is set)
//   2. "catalog" — admin-managed, source-verified DB records (CatalogVenue)
//   3. "sample"  — fictional demo placeholders (only when nothing else applies)
//
// Google policy: we persist only Place IDs + our own app data. Google-returned
// fields are shown live and never stored as durable facts here.

import { getServerConfig } from "./config";
import { prisma } from "./db";
import { sampleVenuesForCity, type SampleVenue } from "@/data/sampleVenues";

export type VenueSource = "geoapify" | "catalog" | "sample";

export type NormalizedVenue = {
  providerId: string;
  source: VenueSource;
  isSample: boolean;
  // true only for catalog records that are source-verified.
  verified: boolean;
  name: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  phone: string | null;
  openingHours: string[];
  photos: string[];
  venueTypes: string[];
  mapsUrl: string | null;
  // Capacity/price shown ONLY when verified in the catalog; otherwise null.
  capacityMin: number | null;
  capacityMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  amenities: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  attribution: string;
  lastCheckedAt: string;
  // Distance from the user's live location (km), when a GPS search was used.
  distanceKm?: number | null;
  // Fields we could not verify (surface as "Contact venue to confirm.").
  unverified: string[];
  // Event-venue classification (for strict filtering & honest labelling):
  //  "event-venue"    = provider categories clearly indicate an event venue
  //  "hotel-possible" = a hotel/resort that MAY have event facilities (unverified)
  //  "other"          = not an event venue (restaurant, shop, etc.)
  eventClass: "event-venue" | "hotel-possible" | "other";
  // True only when the provider data confirms event facilities.
  eventVerified: boolean;
};

const ALWAYS_UNVERIFIED = ["capacity", "pricing", "availability", "included services", "booking terms"];

// --- Strict event-venue classification -------------------------------------
// Geoapify (OSM) has no single "banquet hall" category, so we classify from the
// provider's category list + name. We NEVER label something an event venue from
// its name alone — the name can only *demote* (exclude obvious non-venues) or
// corroborate a category signal.

// Geoapify category substrings that indicate a real event/function venue.
const EVENT_VENUE_CATEGORY_HINTS = [
  "events_venue",
  "event_venue",
  "conference",
  "exhibition",
  "community_centre",
  "entertainment.culture",
  "banquet",
  "wedding",
];

// Hotels / resorts: may have a banquet hall, but unverified from category alone.
const HOTEL_CATEGORY_HINTS = ["accommodation.hotel", "accommodation.resort", "accommodation.motel"];

// Names that corroborate an event venue (used only alongside a venue/hotel cat).
const EVENT_NAME_HINTS = [
  "mahal",
  "mandapam",
  "kalyana",
  "convention",
  "banquet",
  "palace",
  "hall",
  "gardens",
  "residency",
  "thirumana",
];

// Obvious non-venues to exclude outright even if returned by a broad category
// or a fuzzy text search (restaurants, eateries, shops, etc.).
const EXCLUDE_NAME_HINTS = [
  "tea",
  "cafe",
  "café",
  "coffee",
  "bakery",
  "restaurant",
  "bhavan",
  "mess",
  "hotel a2b",
  "a2b",
  "tiffin",
  "sweets",
  "store",
  "mart",
  "supermarket",
  "grocery",
  "medical",
  "pharmacy",
  "hospital",
  "school",
  "college",
  "petrol",
  "bank",
];

function classifyEventSuitability(categories: string[], name: string): {
  eventClass: "event-venue" | "hotel-possible" | "other";
  eventVerified: boolean;
} {
  const cats = categories.map((c) => c.toLowerCase());
  const n = name.toLowerCase();

  const hasEventCat = cats.some((c) => EVENT_VENUE_CATEGORY_HINTS.some((h) => c.includes(h)));
  const isHotel = cats.some((c) => HOTEL_CATEGORY_HINTS.some((h) => c.includes(h)));
  const nameSuggestsVenue = EVENT_NAME_HINTS.some((h) => n.includes(h));
  const nameSuggestsExclude = EXCLUDE_NAME_HINTS.some((h) => n.includes(h));

  // Hard exclude: names that clearly denote a restaurant/shop/etc. are never
  // event venues, even if the provider returned them from a venue text search.
  if (nameSuggestsExclude) return { eventClass: "other", eventVerified: false };

  // A clear event-venue category => verified event venue.
  if (hasEventCat) return { eventClass: "event-venue", eventVerified: true };

  // A hotel/resort whose name also suggests a venue => possible, unverified.
  if (isHotel) return { eventClass: "hotel-possible", eventVerified: false };

  // Non-hotel places whose NAME strongly suggests a mandapam/hall, and which are
  // not obvious food/retail — treat as possible (unverified), never "verified".
  if (nameSuggestsVenue && !nameSuggestsExclude) return { eventClass: "hotel-possible", eventVerified: false };

  return { eventClass: "other", eventVerified: false };
}

function directionsUrl(lat?: number | null, lng?: number | null): string | null {
  if (lat != null && lng != null) {
    // OpenStreetMap link (matches the Geoapify / OSM data source).
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  }
  return null;
}

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function normalizeSample(v: SampleVenue): NormalizedVenue {
  return {
    providerId: v.providerId,
    source: "sample",
    isSample: true,
    verified: false,
    // Sample venues are curated event venues (demo only, clearly labelled).
    eventClass: "event-venue",
    eventVerified: false,
    name: v.name,
    address: v.address,
    city: v.city,
    lat: v.lat,
    lng: v.lng,
    rating: v.rating,
    reviewCount: v.reviewCount,
    website: v.website,
    phone: v.phone,
    openingHours: v.openingHours,
    photos: [],
    venueTypes: v.venueTypes,
    mapsUrl: directionsUrl(v.lat, v.lng),
    capacityMin: null,
    capacityMax: null,
    priceMin: null,
    priceMax: null,
    amenities: [],
    sourceName: "Sample",
    sourceUrl: null,
    attribution: "Sample data — not live venue information.",
    lastCheckedAt: new Date().toISOString(),
    unverified: [...ALWAYS_UNVERIFIED],
  };
}

type CatalogRow = {
  id: string;
  name: string;
  venueType: string;
  address: string | null;
  city: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  capacityMin: number | null;
  capacityMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
  amenities: string | null;
  placeId: string | null;
  mapsUrl: string | null;
  sourceName: string;
  sourceUrl: string | null;
  verification: string;
  lastVerifiedAt: Date | null;
};

export function normalizeCatalog(v: CatalogRow): NormalizedVenue {
  const isVerified = v.verification === "verified";
  return {
    providerId: `catalog:${v.id}`,
    source: "catalog",
    isSample: false,
    verified: isVerified,
    // Catalog records are curated event venues; event facilities are
    // considered confirmed only when the record is source-verified.
    eventClass: "event-venue",
    eventVerified: isVerified,
    name: v.name,
    address: v.address,
    city: v.city,
    lat: v.lat,
    lng: v.lng,
    // Catalog records don't carry provider ratings.
    rating: null,
    reviewCount: null,
    website: v.website,
    phone: v.phone,
    openingHours: [],
    photos: [],
    venueTypes: [v.venueType],
    mapsUrl: v.mapsUrl ?? directionsUrl(v.lat, v.lng),
    // Only expose capacity/price when verified; otherwise null => "confirm".
    capacityMin: isVerified ? v.capacityMin : null,
    capacityMax: isVerified ? v.capacityMax : null,
    priceMin: isVerified ? v.priceMin : null,
    priceMax: isVerified ? v.priceMax : null,
    amenities: isVerified ? parseJsonArray(v.amenities) : [],
    sourceName: v.sourceName,
    sourceUrl: v.sourceUrl,
    attribution: `Source: ${v.sourceName}${isVerified ? ` · verified ${v.lastVerifiedAt ? new Date(v.lastVerifiedAt).toLocaleDateString("en-IN") : ""}` : " · Not verified"}`,
    lastCheckedAt: (v.lastVerifiedAt ?? new Date()).toISOString(),
    // If not verified, everything persistent is unverified.
    unverified: isVerified ? ["availability", "booking terms"] : [...ALWAYS_UNVERIFIED],
  };
}

// Shape of a Geoapify Places (v2) GeoJSON feature (only fields we use).
type GeoapifyFeature = {
  type?: string;
  properties?: {
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    lat?: number;
    lon?: number;
    categories?: string[];
    website?: string;
    datasource?: { raw?: Record<string, unknown> };
    contact?: { phone?: string };
    phone?: string;
    place_id?: string;
  };
  geometry?: { type?: string; coordinates?: [number, number] };
};

function geoapifyMapsUrl(lat: number | null, lng: number | null): string | null {
  if (lat != null && lng != null) {
    // Link to OpenStreetMap (Geoapify data source) for the venue location.
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  }
  return null;
}

export function normalizeGeoapify(f: GeoapifyFeature, city?: string): NormalizedVenue {
  const p = f.properties ?? {};
  const coords = f.geometry?.coordinates;
  const lat = typeof p.lat === "number" ? p.lat : coords ? coords[1] : null;
  const lng = typeof p.lon === "number" ? p.lon : coords ? coords[0] : null;
  const phone = p.contact?.phone ?? p.phone ?? null;
  const address = p.formatted ?? ([p.address_line1, p.address_line2].filter(Boolean).join(", ") || null);
  const id = p.place_id || `${lat},${lng},${p.name ?? ""}`;
  const name = p.name || p.address_line1 || "Unnamed place";
  const { eventClass, eventVerified } = classifyEventSuitability(p.categories ?? [], name);
  return {
    providerId: `geoapify:${id}`,
    source: "geoapify",
    isSample: false,
    verified: false,
    eventClass,
    eventVerified,
    name,
    address,
    city: p.city ?? city ?? null,
    lat,
    lng,
    // Geoapify Places does not provide ratings / reviews.
    rating: null,
    reviewCount: null,
    website: p.website ?? null,
    phone,
    openingHours: [],
    photos: [],
    venueTypes: p.categories ?? [],
    mapsUrl: geoapifyMapsUrl(lat, lng),
    // We never fabricate capacity/price for live venues.
    capacityMin: null,
    capacityMax: null,
    priceMin: null,
    priceMax: null,
    amenities: [],
    sourceName: "Geoapify Places (OpenStreetMap data)",
    sourceUrl: geoapifyMapsUrl(lat, lng),
    attribution: "Source: Geoapify Places API, data © OpenStreetMap contributors.",
    lastCheckedAt: new Date().toISOString(),
    unverified: [...ALWAYS_UNVERIFIED],
  };
}

// Approximate center points to bias Places search toward the right area.
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  madurai: { lat: 9.9252, lng: 78.1198 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
};

// Geoapify Geocoding API result (text search). Unlike the Places category API,
// this surfaces named amenities (marriage halls, mandapams, function halls)
// that OSM has as POIs but not under a banquet-hall category.
type GeocodeFeature = {
  properties?: {
    name?: string;
    formatted?: string;
    address_line1?: string;
    city?: string;
    lat?: number;
    lon?: number;
    result_type?: string;
    category?: string;
    categories?: string[];
    place_id?: string;
    website?: string;
    "datasource"?: unknown;
  };
};

// The multiple venue search terms we combine (no single-keyword dependency).
const VENUE_SEARCH_TERMS = [
  "kalyana mandapam",
  "marriage hall",
  "wedding hall",
  "banquet hall",
  "convention centre",
  "function hall",
  "mahal",
  "event hall",
];

function normalizeGeocode(f: GeocodeFeature, cityHint?: string): NormalizedVenue {
  const p = f.properties ?? {};
  const lat = typeof p.lat === "number" ? p.lat : null;
  const lng = typeof p.lon === "number" ? p.lon : null;
  const name = p.name || p.address_line1 || "Unnamed venue";
  // Geocoded hits come from venue text searches but Geoapify matching is fuzzy,
  // so keep ONLY those whose name actually denotes an event venue
  // (mahal/mandapam/hall/convention/function/arangam/…). Everything else —
  // restaurants, plain hotels, residencies — is classified "other" and dropped.
  const nLower = name.toLowerCase();
  const nameSuggestsVenue = EVENT_NAME_HINTS.some((h) => nLower.includes(h)) || /\b(arangam|mandapam|mahal|kalyana|thirumana|auditorium)\b/.test(nLower);
  const nameSuggestsExclude = EXCLUDE_NAME_HINTS.some((h) => nLower.includes(h));
  const keep = nameSuggestsVenue && !nameSuggestsExclude;
  return {
    providerId: `geoapify:${p.place_id || `${lat},${lng},${name}`}`,
    source: "geoapify",
    isSample: false,
    verified: false,
    eventClass: keep ? "hotel-possible" : "other",
    eventVerified: false,
    name,
    address: p.formatted ?? null,
    city: p.city ?? cityHint ?? null,
    lat,
    lng,
    rating: null,
    reviewCount: null,
    website: p.website ?? null,
    phone: null,
    openingHours: [],
    photos: [],
    venueTypes: p.categories ?? (p.category ? [p.category] : []),
    mapsUrl: geoapifyMapsUrl(lat, lng),
    capacityMin: null,
    capacityMax: null,
    priceMin: null,
    priceMax: null,
    amenities: [],
    sourceName: "Geoapify Geocoding (OpenStreetMap data)",
    sourceUrl: geoapifyMapsUrl(lat, lng),
    attribution: "Source: Geoapify Geocoding API, data © OpenStreetMap contributors.",
    lastCheckedAt: new Date().toISOString(),
    unverified: [...ALWAYS_UNVERIFIED],
  };
}

// Run multiple venue-term geocoding queries near a center, combine + dedupe by
// place_id, keep only results within radiusKm, and sort nearest-first.
async function geocodeVenueSearch(
  apiKey: string,
  center: { lat: number; lng: number },
  radiusKm: number,
  city: string | undefined,
  extraQuery: string | undefined,
  revalidate: number,
): Promise<{ venues: NormalizedVenue[]; error: string | null }> {
  const terms = extraQuery?.trim() ? [extraQuery.trim(), ...VENUE_SEARCH_TERMS] : VENUE_SEARCH_TERMS;
  const seen = new Set<string>();
  const collected: NormalizedVenue[] = [];
  let lastError: string | null = null;

  for (const term of terms) {
    const text = city ? `${term} ${city}` : term;
    const url =
      "https://api.geoapify.com/v1/geocode/search?" +
      new URLSearchParams({
        text,
        filter: `circle:${center.lng},${center.lat},${Math.round(radiusKm * 1000)}`,
        bias: `proximity:${center.lng},${center.lat}`,
        limit: "20",
        apiKey,
      }).toString();
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate } });
      if (!res.ok) {
        lastError = `Geoapify geocoding error ${res.status}`;
        continue;
      }
      const json = (await res.json()) as { features?: GeocodeFeature[] };
      for (const f of json.features ?? []) {
        const v = normalizeGeocode(f, city);
        const id = v.providerId;
        if (seen.has(id)) continue;
        if (v.eventClass === "other") continue; // drop non-venues
        if (v.lat == null || v.lng == null) continue;
        const d = distanceKm(center.lat, center.lng, v.lat, v.lng);
        if (d > radiusKm) continue; // strict radius
        seen.add(id);
        collected.push({ ...v, distanceKm: Number(d.toFixed(1)) });
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "geocoding failed";
    }
  }

  collected.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  return { venues: collected, error: collected.length === 0 ? lastError : null };
}

async function searchCatalog(opts: { city?: string; query?: string; venueType?: string }): Promise<NormalizedVenue[]> {
  try {
    const where: Record<string, unknown> = { published: true };
    if (opts.city) where.city = opts.city;
    if (opts.venueType) where.venueType = opts.venueType;
    const rows = (await prisma.catalogVenue.findMany({
      where,
      orderBy: [{ verification: "asc" }, { name: "asc" }],
      take: 50,
    })) as unknown as CatalogRow[];
    const q = opts.query?.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => `${r.name} ${r.venueType} ${r.area ?? ""} ${r.address ?? ""}`.toLowerCase().includes(q))
      : rows;
    return filtered.map(normalizeCatalog);
  } catch {
    // Table may not exist yet (pre-migration) — treat as empty.
    return [];
  }
}

export type VenueSearchResponse = {
  venues: NormalizedVenue[];
  live: boolean;
  usedProvider: boolean;
  catalogCount: number;
  sampleOnly: boolean;
  keyMissing: boolean;
  providerError: string | null;
  // How many provider results were filtered out as non-event-venues.
  excludedCount?: number;
};

// Haversine distance in km between two lat/lng points.
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export type SearchOpts = {
  city?: string;
  query?: string;
  venueType?: string;
  // Real-time, location-based search: the user's current GPS coordinates.
  lat?: number;
  lng?: number;
  radiusKm?: number;
  // When true (default), include hotels/resorts whose event facilities are
  // unverified (clearly labelled). When false, return only verified event
  // venues and exclude "hotel-possible" results entirely.
  includeUnverified?: boolean;
};

export async function searchVenues(opts: SearchOpts): Promise<VenueSearchResponse> {
  const config = getServerConfig();

  // Always include authorized catalog records (clearly labeled, verified/not).
  const catalog = await searchCatalog(opts);

  // Live Geoapify Places search when a key is configured.
  if (config.placesLive) {
    // Prefer the user's live coordinates; fall back to the city center.
    const hasCoords = typeof opts.lat === "number" && typeof opts.lng === "number";
    const center = hasCoords
      ? { lat: opts.lat as number, lng: opts.lng as number }
      : opts.city
        ? CITY_CENTERS[opts.city.trim().toLowerCase()]
        : undefined;

    // Without any center we can't do a spatial search; degrade gracefully.
    if (!center) {
      return {
        venues: catalog,
        live: false,
        usedProvider: false,
        catalogCount: catalog.length,
        sampleOnly: false,
        keyMissing: false,
        providerError: "Select a city or share your location to search live venues.",
      };
    }

    const radiusM = Math.round(Math.min(50, Math.max(1, opts.radiusKm ?? 25)) * 1000);

    // Geoapify categories scoped to EVENT venues only. We deliberately exclude
    // restaurants, cafés, shops and marketplaces. Hotels/resorts are requested
    // so we can surface those that may have banquet facilities — but they are
    // classified "hotel-possible" and labelled "Event facilities unverified".
    // Valid Geoapify categories scoped toward event venues. Geoapify/OSM has no
    // dedicated "banquet hall" category, so we query the closest buckets and
    // apply strict classification (classifyEventSuitability) to the results.
    // We intentionally DO NOT query catering/commercial-retail categories.
    const categories = [
      "entertainment.culture", // cultural/community/event halls
      "building.commercial", // commercial buildings (some are event/convention)
      "accommodation.hotel", // hotels (classified "hotel-possible", labelled)
    ].join(",");

    const params = new URLSearchParams({
      categories,
      filter: `circle:${center.lng},${center.lat},${radiusM}`,
      bias: `proximity:${center.lng},${center.lat}`,
      limit: "30",
      lang: "en",
      apiKey: config.geoapifyKey,
    });
    // Specific text (e.g. a venue name like "Arunadu") -> Geoapify `name`.
    if (opts.query?.trim()) params.set("name", opts.query.trim());

    try {
      const res = await fetch(`https://api.geoapify.com/v2/places?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        next: { revalidate: Math.max(60, config.placesCacheHours * 3600) },
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return {
          venues: catalog,
          live: false,
          usedProvider: false,
          catalogCount: catalog.length,
          sampleOnly: false,
          keyMissing: false,
          providerError: `Geoapify Places error ${res.status}: ${detail.slice(0, 160)}`,
        };
      }

      const json = (await res.json()) as { features?: GeoapifyFeature[] };
      const allPlaces = (json.features ?? []).map((f) => normalizeGeoapify(f, opts.city));

      // STRICT event-venue filtering: never show restaurants, cafés, shops or
      // other businesses. Keep verified event venues always; include
      // hotels/resorts ("hotel-possible") only when includeUnverified !== false,
      // always clearly labelled as unverified in the UI.
      const includeUnverified = opts.includeUnverified !== false;
      let places = allPlaces.filter((v) => {
        if (v.eventClass === "event-venue") return true;
        if (v.eventClass === "hotel-possible") return includeUnverified;
        return false; // "other" => excluded
      });
      const excludedCount = allPlaces.length - places.length;

      // If the user picked a venue-type filter, narrow by it (name/category).
      if (opts.venueType) {
        const vt = opts.venueType.toLowerCase().replace(/_/g, " ");
        places = places.filter((v) => `${v.name} ${v.venueTypes.join(" ")}`.toLowerCase().includes(vt.split(" ")[0]));
      }

      // Compute distance from the search center and sort nearest-first. This
      // makes both "near me" (GPS) and city searches location-aware.
      places = places
        .map((v) => ({
          ...v,
          distanceKm:
            v.lat != null && v.lng != null
              ? Number(distanceKm(center.lat, center.lng, v.lat, v.lng).toFixed(1))
              : null,
        }))
        .sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });

      // ALSO run the Geocoding text search — this is what actually surfaces
      // named marriage halls / mandapams / function halls that the Places
      // category API misses in OSM. Combine + dedupe by providerId (place_id).
      const geo = await geocodeVenueSearch(
        config.geoapifyKey,
        center,
        Math.min(50, Math.max(1, opts.radiusKm ?? 25)),
        opts.city,
        opts.query,
        Math.max(60, config.placesCacheHours * 3600),
      );
      const byId = new Map<string, NormalizedVenue>();
      for (const v of [...geo.venues, ...places]) {
        if (!byId.has(v.providerId)) byId.set(v.providerId, v);
      }
      const merged = Array.from(byId.values()).sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

      // Catalog (authorized) first, then combined live Geoapify results.
      return {
        venues: [...catalog, ...merged],
        live: true,
        usedProvider: true,
        catalogCount: catalog.length,
        sampleOnly: false,
        keyMissing: false,
        providerError: merged.length === 0 ? geo.error : null,
        excludedCount,
      };
    } catch (err) {
      return {
        venues: catalog,
        live: false,
        usedProvider: false,
        catalogCount: catalog.length,
        sampleOnly: false,
        keyMissing: false,
        providerError: err instanceof Error ? err.message : "Geoapify search failed.",
      };
    }
  }

  // No Geoapify key. Return catalog records if any; otherwise labeled samples.
  if (catalog.length > 0) {
    return {
      venues: catalog,
      live: false,
      usedProvider: false,
      catalogCount: catalog.length,
      sampleOnly: false,
      keyMissing: true,
      providerError: null,
    };
  }

  const samples = sampleVenuesForCity(opts.city).map(normalizeSample);
  const q = opts.query?.trim().toLowerCase();
  const filtered = q ? samples.filter((v) => `${v.name} ${v.venueTypes.join(" ")}`.toLowerCase().includes(q)) : samples;
  return {
    venues: filtered,
    live: false,
    usedProvider: false,
    catalogCount: 0,
    sampleOnly: true,
    keyMissing: true,
    providerError: null,
  };
}
