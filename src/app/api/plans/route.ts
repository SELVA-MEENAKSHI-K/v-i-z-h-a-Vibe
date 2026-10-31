import { ok, handleError } from "@/lib/api";
import { createPlanSchema } from "@/lib/schemas";
import { createPlan, serializePlan, listPlans } from "@/lib/plans";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// List the current user's saved plans (demo user when logged out).
export async function GET() {
  try {
    const u = await getSessionUser();
    const plans = await listPlans(u?.id);
    return ok(plans);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const u = await getSessionUser();
    const body = await req.json();
    const input = createPlanSchema.parse(body);
    const plan = await createPlan(input, u?.id);
    const serialized = await serializePlan(plan.id);
    return ok(serialized, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
