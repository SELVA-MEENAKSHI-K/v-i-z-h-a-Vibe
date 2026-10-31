import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { timelineTaskSchema } from "@/lib/schemas";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";
import { assertCanAccessPlan, AuthError } from "@/lib/auth";
import { generateTimeline, dueDateForOffset } from "@/lib/timeline";

export const dynamic = "force-dynamic";

// POST /api/plans/:id/timeline — (re)generate the preparation schedule from the
// plan's actual data and persist TimelineTask rows (replace-all). Returns the
// refreshed plan. Deadlines are always before the event date.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard

    const plan = await serializePlan(existing.id);
    if (!plan) return fail("Plan not found.", 404);

    const generated = generateTimeline(plan);

    // Replace existing generated tasks, then insert fresh ones. We insert in two
    // passes so dependency links (by title) can be resolved to real ids.
    await prisma.timelineTask.deleteMany({ where: { planId: existing.id } });

    // First pass: create tasks (sortOrder reflects the sorted order).
    for (let i = 0; i < generated.length; i++) {
      const t = generated[i];
      await prisma.timelineTask.create({
        data: {
          planId: existing.id,
          title: t.title,
          detail: t.detail,
          offsetDays: t.offsetDays,
          dueDate: plan.startDate ? new Date(dueDateForOffset(plan.startDate, t.offsetDays) as string) : null,
          startDate: null,
          priority: t.priority,
          status: "pending",
          assignee: t.assignee,
          vendorId: t.vendorId,
          done: false,
          sortOrder: i,
        },
      });
    }

    // Second pass: resolve dependency links now that ids exist.
    const rows = await prisma.timelineTask.findMany({ where: { planId: existing.id }, select: { id: true, title: true } });
    const byTitle = new Map(rows.map((r) => [r.title, r.id]));
    for (const t of generated) {
      if (!t.dependsOnTitle) continue;
      const selfId = byTitle.get(t.title);
      const depId = byTitle.get(t.dependsOnTitle);
      if (selfId && depId && selfId !== depId) {
        await prisma.timelineTask.update({ where: { id: selfId }, data: { dependsOnId: depId } });
      }
    }

    const serialized = await serializePlan(existing.id);
    return ok({ plan: serialized, generated: generated.length });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}

// PUT /api/plans/:id/timeline — add a single custom task (manual add).
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard

    const input = timelineTaskSchema.parse(await req.json());

    // Never allow a preparation deadline on/after the event date.
    let offsetDays = input.offsetDays ?? 7;
    if (existing.startDate && input.dueDate) {
      const due = new Date(input.dueDate);
      const event = new Date(existing.startDate);
      if (due >= event) return fail("A preparation deadline must be before the event date.", 422);
      offsetDays = Math.max(1, Math.round((event.getTime() - due.getTime()) / 86400000));
    }

    const count = await prisma.timelineTask.count({ where: { planId: existing.id } });
    await prisma.timelineTask.create({
      data: {
        planId: existing.id,
        title: input.title,
        detail: input.detail ?? null,
        offsetDays,
        dueDate: input.dueDate ? new Date(input.dueDate) : existing.startDate ? new Date(dueDateForOffset(existing.startDate.toISOString(), offsetDays) as string) : null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        priority: input.priority ?? "medium",
        status: input.status ?? "pending",
        assignee: input.assignee ?? null,
        vendorId: input.vendorId ?? null,
        dependsOnId: input.dependsOnId ?? null,
        sortOrder: count,
      },
    });

    const serialized = await serializePlan(existing.id);
    return ok({ plan: serialized }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
