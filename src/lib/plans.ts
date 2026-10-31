// Plan service: creation, retrieval, and serialization. Keeps DB access out of
// route handlers and provides a stable shape for the client.

import { prisma } from "./db";
import { findEventType } from "@/data/catalog";
import { normalizeVendorRow } from "./vendors";
import type { CreatePlanInput } from "./schemas";

function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export async function ensureDemoUser() {
  return prisma.user.upsert({
    where: { email: "demo@vizhavibe.local" },
    update: {},
    create: { email: "demo@vizhavibe.local", name: "Demo Planner", isDemo: true },
  });
}

// Create a plan owned by the given user (or the demo user when logged out).
export async function createPlan(input: CreatePlanInput, ownerId?: string) {
  const eventType = await prisma.eventType.findUnique({ where: { slug: input.eventTypeSlug } });
  if (!eventType) throw new Error("Unknown event type.");

  const resolvedOwnerId = ownerId ?? (await ensureDemoUser()).id;

  const plan = await prisma.eventPlan.create({
    data: {
      title: input.title,
      city: input.city,
      eventTypeId: eventType.id,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      guestCount: input.guestCount ?? 50,
      budget: input.budget ?? 0,
      styles: input.styles?.join(",") ?? null,
      preferences: input.preferences ? JSON.stringify(input.preferences) : null,
      notes: input.notes ?? null,
      ownerId: resolvedOwnerId,
    },
  });
  return plan;
}

// Confirm a plan belongs to the given owner (IDOR protection). Returns the
// plan's ownerId so callers can compare, or null if the plan doesn't exist.
export async function planOwnerId(idOrToken: string): Promise<string | null> {
  const p = await prisma.eventPlan.findFirst({
    where: { OR: [{ id: idOrToken }, { shareToken: idOrToken }] },
    select: { ownerId: true },
  });
  return p ? p.ownerId : null;
}

// Lightweight list of a user's saved plans for the "My Plans" page.
export async function listPlans(ownerId?: string) {
  const resolvedOwnerId = ownerId ?? (await ensureDemoUser()).id;
  const plans = await prisma.eventPlan.findMany({
    where: { ownerId: resolvedOwnerId },
    orderBy: { updatedAt: "desc" },
    include: {
      eventType: { include: { category: true } },
      selectedVenue: { include: { venue: true } },
    },
  });
  return plans.map((p) => ({
    id: p.id,
    shareToken: p.shareToken,
    title: p.title,
    city: p.city,
    eventTypeName: p.eventType.name,
    categoryName: p.eventType.category.name,
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    guestCount: p.guestCount,
    budget: p.budget,
    styles: p.styles ? p.styles.split(",").filter(Boolean) : [],
    selectedVenueName: p.selectedVenue?.venue.name ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export type PlanListItem = Awaited<ReturnType<typeof listPlans>>[number];

export async function getPlanByIdOrToken(idOrToken: string) {
  const plan = await prisma.eventPlan.findFirst({
    where: { OR: [{ id: idOrToken }, { shareToken: idOrToken }] },
    include: {
      eventType: { include: { category: true } },
      selectedVenue: { include: { venue: true } },
      savedVenues: { include: { venue: true } },
      layout: { include: { objects: true } },
      budgetItems: { orderBy: { sortOrder: "asc" } },
      menus: true,
      tasks: { orderBy: [{ sortOrder: "asc" }, { offsetDays: "desc" }] },
      savedVendors: { include: { vendor: true }, orderBy: { createdAt: "asc" } },
      recommendations: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  return plan;
}

export function serializeVenue(v: {
  id: string;
  providerId: string | null;
  source: string;
  name: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  reviewCount: number | null;
  website: string | null;
  phone: string | null;
  openingHours: string | null;
  photos: string | null;
  venueTypes: string | null;
  mapsUrl: string | null;
  attribution: string | null;
  isSample: boolean;
  lastCheckedAt: Date | null;
}) {
  return {
    id: v.id,
    providerId: v.providerId,
    source: v.source,
    isSample: v.isSample,
    name: v.name,
    address: v.address,
    city: v.city,
    lat: v.lat,
    lng: v.lng,
    rating: v.rating,
    reviewCount: v.reviewCount,
    website: v.website,
    phone: v.phone,
    openingHours: parseJson<string[]>(v.openingHours, []),
    photos: parseJson<string[]>(v.photos, []),
    venueTypes: parseJson<string[]>(v.venueTypes, []),
    mapsUrl: v.mapsUrl,
    attribution: v.attribution,
    lastCheckedAt: v.lastCheckedAt?.toISOString() ?? null,
  };
}

export type SerializedPlan = NonNullable<Awaited<ReturnType<typeof serializePlan>>>;

export async function serializePlan(idOrToken: string) {
  const plan = await getPlanByIdOrToken(idOrToken);
  if (!plan) return null;
  const et = findEventType(plan.eventType.slug);
  return {
    id: plan.id,
    shareToken: plan.shareToken,
    title: plan.title,
    city: plan.city,
    eventType: {
      slug: plan.eventType.slug,
      name: plan.eventType.name,
      categoryName: plan.eventType.category.name,
      defaultStyles: et?.type.defaultStyles ?? [],
    },
    startDate: plan.startDate?.toISOString() ?? null,
    endDate: plan.endDate?.toISOString() ?? null,
    guestCount: plan.guestCount,
    budget: plan.budget,
    styles: plan.styles ? plan.styles.split(",").filter(Boolean) : [],
    preferences: parseJson<Record<string, unknown>>(plan.preferences, {}),
    notes: plan.notes,
    selectedVenue: plan.selectedVenue ? serializeVenue(plan.selectedVenue.venue) : null,
    savedVenues: plan.savedVenues.map((s) => ({ id: s.id, note: s.note, venue: serializeVenue(s.venue) })),
    layout: plan.layout
      ? {
          id: plan.layout.id,
          roomWidth: plan.layout.roomWidth,
          roomDepth: plan.layout.roomDepth,
          illustrative: plan.layout.illustrative,
          objects: plan.layout.objects.map((o) => ({
            id: o.id,
            kind: o.kind,
            label: o.label,
            posX: o.posX,
            posY: o.posY,
            posZ: o.posZ,
            rotY: o.rotY,
            scale: o.scale,
            seats: o.seats,
            style: o.style,
          })),
        }
      : null,
    budgetItems: plan.budgetItems.map((b) => ({
      id: b.id,
      category: b.category,
      label: b.label,
      quantity: b.quantity,
      unitCostMin: b.unitCostMin,
      unitCostMax: b.unitCostMax,
      estimated: b.estimated,
      assumption: b.assumption,
    })),
    menus: plan.menus.map((m) => ({
      id: m.id,
      style: m.style,
      dietary: m.dietary,
      courses: parseJson<{ course: string; items: string[] }[]>(m.courses, []),
      notes: m.notes,
      estimated: m.estimated,
    })),
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      detail: t.detail,
      offsetDays: t.offsetDays,
      startDate: t.startDate?.toISOString() ?? null,
      dueDate: t.dueDate?.toISOString() ?? null,
      done: t.done,
      priority: t.priority,
      status: t.status,
      assignee: t.assignee,
      vendorId: t.vendorId,
      dependsOnId: t.dependsOnId,
    })),
    savedVendors: plan.savedVendors.map((s) => ({
      id: s.id,
      vendorId: s.vendorId,
      status: s.status,
      favourite: s.favourite,
      note: s.note,
      packageName: s.packageName,
      agreedCost: s.agreedCost,
      enquiry: s.enquiry,
      vendor: s.vendor ? normalizeVendorRow(s.vendor) : null,
    })),
    recommendations: plan.recommendations.map((r) => ({
      id: r.id,
      kind: r.kind,
      provider: r.provider,
      payload: parseJson<unknown>(r.payload, null),
      isGenerated: r.isGenerated,
      createdAt: r.createdAt.toISOString(),
    })),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}
