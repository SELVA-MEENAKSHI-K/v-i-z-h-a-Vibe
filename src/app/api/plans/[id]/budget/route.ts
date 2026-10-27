import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { budgetSchema } from "@/lib/schemas";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Replace budget line items and return the plan with recomputed totals.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await getPlanByIdOrToken(params.id);
    if (!plan) return fail("Plan not found.", 404);

    const body = await req.json();
    const input = budgetSchema.parse(body);

    await prisma.$transaction([
      prisma.budgetItem.deleteMany({ where: { planId: plan.id } }),
      prisma.budgetItem.createMany({
        data: input.items.map((it, i) => ({
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
      }),
    ]);

    const totalMin = input.items.reduce((s, it) => s + it.unitCostMin * it.quantity, 0);
    const totalMax = input.items.reduce((s, it) => s + it.unitCostMax * it.quantity, 0);

    const serialized = await serializePlan(plan.id);
    return ok({ plan: serialized, totals: { currency: "INR", totalMin, totalMax, estimated: true } });
  } catch (err) {
    return handleError(err);
  }
}
