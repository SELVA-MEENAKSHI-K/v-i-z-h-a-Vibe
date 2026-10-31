import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { updateTimelineTaskSchema } from "@/lib/schemas";
import { getPlanByIdOrToken, serializePlan } from "@/lib/plans";
import { assertCanAccessPlan, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loadTask(planId: string, taskId: string) {
  return prisma.timelineTask.findFirst({ where: { id: taskId, planId }, select: { id: true } });
}

// PATCH /api/plans/:id/timeline/:taskId — edit a task or toggle its status.
export async function PATCH(req: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard

    const task = await loadTask(existing.id, params.taskId);
    if (!task) return fail("Task not found on this plan.", 404);

    const input = updateTimelineTaskSchema.parse(await req.json());

    // Validate a changed due date stays before the event date.
    if (input.dueDate && existing.startDate) {
      if (new Date(input.dueDate) >= new Date(existing.startDate)) {
        return fail("A preparation deadline must be before the event date.", 422);
      }
    }

    // Keep `done` and `status` consistent: completing sets status; status
    // "completed" sets done.
    const done = input.done ?? (input.status === "completed" ? true : undefined);
    const status = input.status ?? (input.done === true ? "completed" : input.done === false ? "pending" : undefined);

    await prisma.timelineTask.update({
      where: { id: task.id },
      data: {
        title: input.title ?? undefined,
        detail: input.detail === undefined ? undefined : input.detail,
        offsetDays: input.offsetDays ?? undefined,
        dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
        startDate: input.startDate === undefined ? undefined : input.startDate ? new Date(input.startDate) : null,
        priority: input.priority ?? undefined,
        status: status ?? undefined,
        assignee: input.assignee === undefined ? undefined : input.assignee,
        vendorId: input.vendorId === undefined ? undefined : input.vendorId,
        dependsOnId: input.dependsOnId === undefined ? undefined : input.dependsOnId,
        done: done === undefined ? undefined : done,
      },
    });

    const serialized = await serializePlan(existing.id);
    return ok({ plan: serialized });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}

// DELETE /api/plans/:id/timeline/:taskId — remove a task.
export async function DELETE(_req: Request, { params }: { params: { id: string; taskId: string } }) {
  try {
    const existing = await getPlanByIdOrToken(params.id);
    if (!existing) return fail("Plan not found.", 404);
    await assertCanAccessPlan(existing.ownerId); // IDOR guard

    const task = await loadTask(existing.id, params.taskId);
    if (!task) return fail("Task not found on this plan.", 404);

    await prisma.timelineTask.delete({ where: { id: task.id } });

    const serialized = await serializePlan(existing.id);
    return ok({ plan: serialized });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
