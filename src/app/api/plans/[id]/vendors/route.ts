import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { saveVendorSchema } from "@/lib/schemas";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";
import { assertCanAccessPlan, AuthError } from "@/lib/auth";
import { ensureVendorRow } from "@/lib/vendors";

export const dynamic = "force-dynamic";

// POST /api/plans/:id/vendors — save a vendor to the plan (status ENQUIRED).
// Authorized: only the plan owner (or admin / public demo plan) may write.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard

    const input = saveVendorSchema.parse(await req.json());

    // Resolve/promote the vendor to a real catalog row so SavedVendor can FK.
    const vendorId = await ensureVendorRow(input.vendorId);
    if (!vendorId) return fail("Unknown vendor.", 422);

    // Upsert on the unique (planId, vendorId) — re-saving updates the note/pkg.
    const saved = await prisma.savedVendor.upsert({
      where: { planId_vendorId: { planId: existing.id, vendorId } },
      update: {
        note: input.note ?? undefined,
        packageName: input.packageName ?? undefined,
        enquiry: input.enquiry ?? undefined,
      },
      create: {
        planId: existing.id,
        vendorId,
        status: "ENQUIRED",
        note: input.note ?? null,
        packageName: input.packageName ?? null,
        enquiry: input.enquiry ?? null,
      },
    });

    const serialized = await serializePlan(existing.id);
    return ok({ plan: serialized, savedVendorId: saved.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
