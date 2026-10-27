import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Persist a venue (from search) and attach it to the plan's shortlist.
const saveVenueSchema = z.object({
  providerId: z.string().min(1),
  source: z.enum(["google", "sample"]),
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  rating: z.number().optional().nullable(),
  reviewCount: z.number().optional().nullable(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  openingHours: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  venueTypes: z.array(z.string()).optional(),
  mapsUrl: z.string().optional().nullable(),
  attribution: z.string().optional().nullable(),
  select: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await getPlanByIdOrToken(params.id);
    if (!plan) return fail("Plan not found.", 404);

    const body = await req.json();
    const v = saveVenueSchema.parse(body);

    const venue = await prisma.venue.upsert({
      where: { providerId: v.providerId },
      update: {
        name: v.name,
        address: v.address ?? null,
        city: v.city ?? null,
        lat: v.lat ?? null,
        lng: v.lng ?? null,
        rating: v.rating ?? null,
        reviewCount: v.reviewCount ?? null,
        website: v.website ?? null,
        phone: v.phone ?? null,
        openingHours: JSON.stringify(v.openingHours ?? []),
        photos: JSON.stringify(v.photos ?? []),
        venueTypes: JSON.stringify(v.venueTypes ?? []),
        mapsUrl: v.mapsUrl ?? null,
        attribution: v.attribution ?? null,
        source: v.source,
        isSample: v.source === "sample",
        lastCheckedAt: new Date(),
      },
      create: {
        providerId: v.providerId,
        source: v.source,
        isSample: v.source === "sample",
        name: v.name,
        address: v.address ?? null,
        city: v.city ?? null,
        lat: v.lat ?? null,
        lng: v.lng ?? null,
        rating: v.rating ?? null,
        reviewCount: v.reviewCount ?? null,
        website: v.website ?? null,
        phone: v.phone ?? null,
        openingHours: JSON.stringify(v.openingHours ?? []),
        photos: JSON.stringify(v.photos ?? []),
        venueTypes: JSON.stringify(v.venueTypes ?? []),
        mapsUrl: v.mapsUrl ?? null,
        attribution: v.attribution ?? null,
        lastCheckedAt: new Date(),
      },
    });

    const saved = await prisma.savedVenue.upsert({
      where: { planId_venueId: { planId: plan.id, venueId: venue.id } },
      update: {},
      create: { planId: plan.id, venueId: venue.id },
    });

    if (v.select) {
      await prisma.eventPlan.update({ where: { id: plan.id }, data: { selectedVenueId: saved.id } });
    }

    const serialized = await serializePlan(plan.id);
    return ok(serialized, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
