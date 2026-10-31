import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { budgetSchema } from "@/lib/schemas";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";
import { assertCanAccessPlan, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Replace budget line items and return the plan with recomputed totals.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await getPlanByIdOrToken(params.id);
    if (!plan) return fail("Plan not found.", 404);
    await assertCanAccessPlan(plan.ownerId); // IDOR guard (was missing)

    const body = await req.json();
    const input = budgetSchema.parse(body);

    // Preserve confirmed-vendor budget lines (managed by the vendor module) so a
    // manual budget save never silently drops synced vendor costs.
    const vendorLines = await prisma.budgetItem.findMany({
      where: { planId: plan.id, label: { startsWith: "Vendor: " } },
    });

    // User-supplied lines never include vendor-synced ones (those have the
    // "Vendor: " prefix and are owned by the vendor module); re-add them after.
    const userItems = input.items.filter((it) => !it.label.startsWith("Vendor: "));

    await prisma.$transaction([
      prisma.budgetItem.deleteMany({ where: { planId: plan.id } }),
      prisma.budgetItem.createMany({
        data: [
          ...userItems.map((it, i) => ({
            planId: plan.id,
            category: it.category,
            label: it.label,
            quantity: it.quantity,
            unitCostMin: it.unitCostMin,
            unitCostMax: it.unitCostMax,
            estimated: it.estimated,
            assumption: it.assumption ?? null,
            sortOrder: i,
          })),
          ...vendorLines.map((v, i) => ({
            planId: plan.id,
            category: v.category,
            label: v.label,
            quantity: v.quantity,
            unitCostMin: v.unitCostMin,
            unitCostMax: v.unitCostMax,
            estimated: v.estimated,
            assumption: v.assumption,
            sortOrder: userItems.length + i,
          })),
        ],
      }),
    ]);

    const allItems = [...userItems, ...vendorLines.map((v) => ({ unitCostMin: v.unitCostMin, unitCostMax: v.unitCostMax, quantity: v.quantity }))];
    const totalMin = allItems.reduce((s, it) => s + it.unitCostMin * it.quantity, 0);
    const totalMax = allItems.reduce((s, it) => s + it.unitCostMax * it.quantity, 0);

    const serialized = await serializePlan(plan.id);
    return ok({ plan: serialized, totals: { currency: "INR", totalMin, totalMax, estimated: true } });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
