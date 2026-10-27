// Madurai venue catalog — AUTHORIZED, SOURCE-BACKED records only.
//
// IMPORTANT: This file intentionally ships with NO fabricated venue facts.
// Capacity, pricing, contact details, and amenities must come from an
// authorized source (venue-submitted information, or a source whose terms
// permit storage) and must carry a sourceUrl + verification date.
//
// The single entry below is a clearly-marked TEMPLATE with verification
// "pending" and all facts left null. It demonstrates the admin/seed workflow
// without claiming any real-world data. To add real venues, fill fields only
// from a reliable source, set verification to "verified", and record
// lastVerifiedAt + sourceUrl. Do NOT guess values.

export type CatalogSeed = {
  name: string;
  venueType: string;
  address?: string | null;
  city: string;
  area?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  capacityMin?: number | null;
  capacityMax?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  amenities?: string[];
  placeId?: string | null;
  mapsUrl?: string | null;
  sourceName: string;
  sourceUrl?: string | null;
  verification: "verified" | "unverified" | "pending";
  lastVerifiedAt?: string | null;
  published: boolean;
};

export const MADURAI_CATALOG_SEED: CatalogSeed[] = [
  {
    name: "Example Mahal (template — awaiting verification)",
    venueType: "mahal",
    address: null,
    city: "Madurai",
    area: null,
    lat: null,
    lng: null,
    phone: null,
    email: null,
    website: null,
    // No fabricated facts — these stay null until a source confirms them.
    capacityMin: null,
    capacityMax: null,
    priceMin: null,
    priceMax: null,
    amenities: [],
    placeId: null,
    mapsUrl: null,
    sourceName: "Template record — no authorized source yet",
    sourceUrl: null,
    verification: "pending",
    lastVerifiedAt: null,
    // Not published so it never appears as if it were a real, usable venue.
    published: false,
  },
];
