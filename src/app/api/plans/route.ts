import { ok, handleError } from "@/lib/api";
import { createPlanSchema } from "@/lib/schemas";
import { createPlan, serializePlan, listPlans } from "@/lib/plans";

export const dynamic = "force-dynamic";

// List the current (demo) user's saved plans for the "My Plans" page.
export async function GET() {
  try {
    const plans = await listPlans();
    return ok(plans);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = createPlanSchema.parse(body);
    const plan = await createPlan(input);
    const serialized = await serializePlan(plan.id);
    return ok(serialized, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
