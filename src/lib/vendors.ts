// Vendor service: discovery (DB verified records + clearly-labelled samples),
// normalization, and the saved-vendor workflow + budget synchronization.
//
// Honesty policy: a vendor's `verified` flag and `isSample` flag always travel
// with it to the client, so the UI can distinguish source-verified data from
// demo/estimated data. We never fabricate availability; prices/ratings are only
// ever shown as they come from the record (samples carry indicative ranges and
// no rating).

import { prisma } from "./db";
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

// Discover vendors: verified/published DB records first, then clearly-labelled
// sample records to fill out categories when the DB has none for the filter.
export async function discoverVendors(filter: VendorFilter): Promise<{ vendors: NormalizedVendor[]; usedSamples: boolean }> {
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

  // Always include samples so every category has something to show, but they
  // are explicitly flagged. Dedupe by name so a verified record wins.
  const dbNames = new Set(dbVendors.map((v) => v.name.toLowerCase()));
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

  return { vendors: [...dbVendors, ...samples], usedSamples: samples.length > 0 };
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
