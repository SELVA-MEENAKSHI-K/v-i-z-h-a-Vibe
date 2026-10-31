import { ok, fail, handleError } from "@/lib/api";
import { serializePlan, getPlanByIdOrToken } from "@/lib/plans";
import { generateRoadmap } from "@/lib/ai/roadmap";
import { generateTimeline, dueDateForOffset } from "@/lib/timeline";
import { assertCanAccessPlan, AuthError } from "@/lib/auth";
import { getServerConfig } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Persist the generated preparation timeline as TimelineTask rows (replace-all).
async function persistTimeline(planId: string, startDateIso: string | null, plan: Awaited<ReturnType<typeof serializePlan>>) {
  if (!plan) return;
  const generated = generateTimeline(plan);
  await prisma.timelineTask.deleteMany({ where: { planId } });
  for (let i = 0; i < generated.length; i++) {
    const t = generated[i];
    await prisma.timelineTask.create({
      data: {
        planId,
        title: t.title,
        detail: t.detail,
        offsetDays: t.offsetDays,
        dueDate: startDateIso ? new Date(dueDateForOffset(startDateIso, t.offsetDays) as string) : null,
        priority: t.priority,
        status: "pending",
        assignee: t.assignee,
        vendorId: t.vendorId,
        done: false,
        sortOrder: i,
      },
    });
  }
  const rows = await prisma.timelineTask.findMany({ where: { planId }, select: { id: true, title: true } });
  const byTitle = new Map(rows.map((r) => [r.title, r.id]));
  for (const t of generated) {
    if (!t.dependsOnTitle) continue;
    const selfId = byTitle.get(t.title);
    const depId = byTitle.get(t.dependsOnTitle);
    if (selfId && depId && selfId !== depId) {
      await prisma.timelineTask.update({ where: { id: selfId }, data: { dependsOnId: depId } });
    }
  }
}

// POST /api/plans/:id/roadmap — generate a complete event roadmap grounded in
// the plan's actual selections (venue, vendors, theme, menu, budget, guests).
// This is the "Generate Final Plan" action: it also persists the preparation
// timeline so vendor + schedule modules stay in sync with the final plan.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const config = getServerConfig();
    const ip = clientIp(req.headers);
    const limit = rateLimit(`roadmap:${ip}`, config.rateLimitPerMinute);
    if (!limit.allowed) return fail("Too many requests. Please slow down.", 429);

    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard (was missing)

    const plan = await serializePlan(params.id);
    if (!plan) return fail("Plan not found.", 404);

    // The roadmap is a STRUCTURED plan computed from the user's real selections
    // (venue, vendors, theme, menu, budget, guests) — not model output. The
    // provider label reflects whether a live AI provider is configured.
    const roadmap = generateRoadmap(plan, config.aiLive ? config.aiProvider : "structured");

    // Generate Final Plan also builds + persists the preparation timeline.
    try {
      await persistTimeline(existing.id, plan.startDate, plan);
    } catch {
      // Non-fatal — the roadmap is still returned even if timeline write fails.
    }

    // Persist as an AI recommendation record (clearly flagged generated).
    try {
      await prisma.aiRecommendation.create({
        data: {
          planId: existing.id,
          kind: "roadmap",
          provider: roadmap.provider,
          payload: JSON.stringify(roadmap),
          isGenerated: true,
        },
      });
    } catch {
      // Non-fatal — still return the roadmap even if persistence fails.
    }

    // Return the refreshed plan so the client timeline/vendor views update.
    const refreshed = await serializePlan(existing.id);
    return ok({ generated: true, provider: roadmap.provider, roadmap, aiLive: config.aiLive, plan: refreshed });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
