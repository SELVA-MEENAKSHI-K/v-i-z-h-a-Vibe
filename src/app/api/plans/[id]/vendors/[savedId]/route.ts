import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { updateVendorSchema } from "@/lib/schemas";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";
import { assertCanAccessPlan, AuthError } from "@/lib/auth";
import { syncVendorBudget } from "@/lib/vendors";

export const dynamic = "force-dynamic";

// Confirm the saved-vendor row belongs to this plan (defence in depth on top of
// the plan-level IDOR guard).
async function loadSaved(planId: string, savedId: string) {
  return prisma.savedVendor.findFirst({ where: { id: savedId, planId }, select: { id: true } });
}

// PATCH /api/plans/:id/vendors/:savedId — update status / favourite / agreed
// cost / note. Confirming (or changing agreed cost) re-syncs the budget.
export async function PATCH(req: Request, { params }: { params: { id: string; savedId: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard

    const saved = await loadSaved(existing.id, params.savedId);
    if (!saved) return fail("Saved vendor not found on this plan.", 404);

    const input = updateVendorSchema.parse(await req.json());

    await prisma.savedVendor.update({
      where: { id: saved.id },
      data: {
        status: input.status ?? undefined,
        favourite: input.favourite ?? undefined,
        note: input.note === undefined ? undefined : input.note,
        packageName: input.packageName === undefined ? undefined : input.packageName,
        agreedCost: input.agreedCost === undefined ? undefined : input.agreedCost,
        enquiry: input.enquiry === undefined ? undefined : input.enquiry,
      },
    });

    // Confirmed vendor costs flow into the budget automatically; any change to
    // status or agreedCost may add/remove/update a vendor budget line.
    await syncVendorBudget(existing.id);

    const serialized = await serializePlan(existing.id);
    return ok({ plan: serialized });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}

// DELETE /api/plans/:id/vendors/:savedId — remove a saved vendor and re-sync.
export async function DELETE(_req: Request, { params }: { params: { id: string; savedId: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard

    const saved = await loadSaved(existing.id, params.savedId);
    if (!saved) return fail("Saved vendor not found on this plan.", 404);

    await prisma.savedVendor.delete({ where: { id: saved.id } });
    await syncVendorBudget(existing.id);

    const serialized = await serializePlan(existing.id);
    return ok({ plan: serialized });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
