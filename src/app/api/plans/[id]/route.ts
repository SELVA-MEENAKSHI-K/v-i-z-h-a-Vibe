import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { updatePlanSchema } from "@/lib/schemas";
import { serializePlan, getPlanByIdOrToken } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await serializePlan(params.id);
    if (!plan) return fail("Plan not found.", 404);
    return ok(plan);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);

    const body = await req.json();
    const input = updatePlanSchema.parse(body);

    let eventTypeId: string | undefined;
    if (input.eventTypeSlug) {
      const et = await prisma.eventType.findUnique({ where: { slug: input.eventTypeSlug } });
      if (!et) return fail("Unknown event type.", 422);
      eventTypeId = et.id;
    }

    // Validate selectedVenueId belongs to this plan (authorization on own data).
    if (input.selectedVenueId) {
      const saved = await prisma.savedVenue.findFirst({
        where: { id: input.selectedVenueId, planId: existing.id },
      });
      if (!saved) return fail("Selected venue is not saved to this plan.", 422);
    }

    await prisma.eventPlan.update({
      where: { id: existing.id },
      data: {
        title: input.title ?? undefined,
        city: input.city ?? undefined,
        eventTypeId,
        startDate: input.startDate === undefined ? undefined : input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate === undefined ? undefined : input.endDate ? new Date(input.endDate) : null,
        guestCount: input.guestCount ?? undefined,
        budget: input.budget ?? undefined,
        styles: input.styles ? input.styles.join(",") : undefined,
        preferences: input.preferences ? JSON.stringify(input.preferences) : undefined,
        notes: input.notes ?? undefined,
        selectedVenueId: input.selectedVenueId === undefined ? undefined : input.selectedVenueId,
      },
    });

    const serialized = await serializePlan(existing.id);
    return ok(serialized);
  } catch (err) {
    return handleError(err);
  }
}
