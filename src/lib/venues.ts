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

export type VenueSource = "google" | "catalog" | "sample";

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
  // Fields we could not verify (surface as "Contact venue to confirm.").
  unverified: string[];
};

const ALWAYS_UNVERIFIED = ["capacity", "pricing", "availability", "included services", "booking terms"];

function directionsUrl(lat?: number | null, lng?: number | null, placeId?: string | null): string | null {
  if (placeId && placeId.startsWith("google:")) {
    const raw = placeId.replace(/^google:/, "");
    return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${encodeURIComponent(raw)}`;
  }
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
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
    mapsUrl: directionsUrl(v.lat, v.lng, v.providerId),
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
    name: v.name,
    address: v.address,
    city: v.city,
    lat: v.lat,
    lng: v.lng,
    // Catalog records don't carry Google ratings.
    rating: null,
    reviewCount: null,
    website: v.website,
    phone: v.phone,
    openingHours: [],
    photos: [],
    venueTypes: [v.venueType],
    mapsUrl: v.mapsUrl ?? (v.placeId ? directionsUrl(null, null, `google:${v.placeId}`) : directionsUrl(v.lat, v.lng)),
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

// Shape of a Google Places (New) `places` entry (only fields we request).
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  types?: string[];
  photos?: { name?: string }[];
  googleMapsUri?: string;
};

export function normalizeGoogle(p: GooglePlace, city?: string): NormalizedVenue {
  const lat = p.location?.latitude ?? null;
  const lng = p.location?.longitude ?? null;
  return {
    providerId: p.id ? `google:${p.id}` : `google:unknown:${Math.random().toString(36).slice(2)}`,
    source: "google",
    isSample: false,
    verified: false,
    name: p.displayName?.text ?? "Unnamed place",
    address: p.formattedAddress ?? null,
    city: city ?? null,
    lat,
    lng,
    rating: typeof p.rating === "number" ? p.rating : null,
    reviewCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    website: p.websiteUri ?? null,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
    openingHours: p.regularOpeningHours?.weekdayDescriptions ?? [],
    photos: (p.photos ?? []).map((ph) => ph.name ?? "").filter(Boolean),
    venueTypes: p.types ?? [],
    mapsUrl: p.googleMapsUri ?? directionsUrl(lat, lng, p.id ? `google:${p.id}` : null),
    // We never fabricate capacity/price for live venues.
    capacityMin: null,
    capacityMax: null,
    priceMin: null,
    priceMax: null,
    amenities: [],
    sourceName: "Google Maps Platform",
    sourceUrl: p.googleMapsUri ?? null,
    attribution: "Source: Google Maps Platform (Places API). Subject to Google's terms.",
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

// Keywords appended to short queries so "mahal"/"party hall" map to event venues.
const VENUE_INTENT = "wedding hall marriage hall mahal banquet hall party hall convention center event venue";

function buildTextQuery(query: string | undefined, city: string | undefined): string {
  const q = (query || "").trim();
  const cityPart = city ? ` in ${city}, Tamil Nadu, India` : "";
  if (!q) return `wedding and banquet halls${cityPart}`;
  // If the query is a short/generic venue word, enrich it; otherwise keep the
  // user's exact term (e.g. a specific venue name like "Arunadu") and add city.
  const generic = /^(mahal|hall|wedding|marriage|banquet|party|convention|venue|resort|garden)s?$/i.test(q);
  if (generic) return `${q} ${VENUE_INTENT}${cityPart}`;
  return `${q}${cityPart}`;
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
  usedGoogle: boolean;
  catalogCount: number;
  sampleOnly: boolean;
  keyMissing: boolean;
  googleError: string | null;
};

export async function searchVenues(opts: { city?: string; query?: string; venueType?: string }): Promise<VenueSearchResponse> {
  const config = getServerConfig();

  // Always include authorized catalog records (clearly labeled, verified/not).
  const catalog = await searchCatalog(opts);

  // Live Google search when a key is configured.
  if (config.placesLive) {
    const center = opts.city ? CITY_CENTERS[opts.city.trim().toLowerCase()] : undefined;
    const textQuery = buildTextQuery(opts.query, opts.city);
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.googlePlacesKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.regularOpeningHours,places.types,places.photos,places.googleMapsUri",
        },
        body: JSON.stringify({
          textQuery,
          maxResultCount: 15,
          languageCode: "en",
          ...(center
            ? { locationBias: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: 25000 } } }
            : {}),
        }),
        next: { revalidate: Math.max(60, config.placesCacheHours * 3600) },
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return {
          venues: catalog,
          live: false,
          usedGoogle: false,
          catalogCount: catalog.length,
          sampleOnly: false,
          keyMissing: false,
          googleError: `Places API error ${res.status}: ${detail.slice(0, 160)}`,
        };
      }

      const json = (await res.json()) as { places?: GooglePlace[] };
      const google = (json.places ?? []).map((p) => normalizeGoogle(p, opts.city));
      // Catalog (authorized) first, then live Google results. Both labeled.
      return {
        venues: [...catalog, ...google],
        live: true,
        usedGoogle: true,
        catalogCount: catalog.length,
        sampleOnly: false,
        keyMissing: false,
        googleError: null,
      };
    } catch (err) {
      return {
        venues: catalog,
        live: false,
        usedGoogle: false,
        catalogCount: catalog.length,
        sampleOnly: false,
        keyMissing: false,
        googleError: err instanceof Error ? err.message : "Google search failed.",
      };
    }
  }

  // No Google key. Return catalog records if any; otherwise labeled samples.
  if (catalog.length > 0) {
    return {
      venues: catalog,
      live: false,
      usedGoogle: false,
      catalogCount: catalog.length,
      sampleOnly: false,
      keyMissing: true,
      googleError: null,
    };
  }

  const samples = sampleVenuesForCity(opts.city).map(normalizeSample);
  const q = opts.query?.trim().toLowerCase();
  const filtered = q ? samples.filter((v) => `${v.name} ${v.venueTypes.join(" ")}`.toLowerCase().includes(q)) : samples;
  return {
    venues: filtered,
    live: false,
    usedGoogle: false,
    catalogCount: 0,
    sampleOnly: true,
    keyMissing: true,
    googleError: null,
  };
}
