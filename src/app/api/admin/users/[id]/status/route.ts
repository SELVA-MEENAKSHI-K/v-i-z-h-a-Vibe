import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";
import { adminUserStatusSchema } from "@/lib/schemas";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// PATCH /api/admin/users/:id/status — block/unblock a user (admin only).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!rateLimit(`admin-status:${clientIp(req.headers)}`, 30).allowed) return fail("Too many requests.", 429);

    // Prevent an admin from blocking their own account.
    if (params.id === admin.id) return fail("You cannot change your own account status.", 400);

    const input = adminUserStatusSchema.parse(await req.json());
    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!target) return fail("User not found.", 404);

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id: params.id }, data: { status: input.status } });
      // Revoke sessions when blocking so access stops immediately.
      if (input.status === "BLOCKED") await tx.session.deleteMany({ where: { userId: params.id } });
      await tx.auditLog.create({
        data: { actorId: admin.id, action: `user.${input.status === "BLOCKED" ? "block" : "unblock"}`, targetId: params.id },
      });
      return u;
    });

    return ok({ id: updated.id, status: updated.status });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
