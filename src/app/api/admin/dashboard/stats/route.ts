import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/dashboard/stats — real DB counts (admin only).
export async function GET() {
  try {
    await requireAdmin();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Only count real accounts (have a passwordHash) — exclude the demo user.
    const realUser = { passwordHash: { not: null } } as const;

    const [totalUsers, blockedUsers, newThisMonth, totalEvents, totalPlans] = await Promise.all([
      prisma.user.count({ where: realUser }),
      prisma.user.count({ where: { ...realUser, status: "BLOCKED" } }),
      prisma.user.count({ where: { ...realUser, createdAt: { gte: startOfMonth } } }),
      prisma.eventPlan.count(),
      prisma.aiRecommendation.count({ where: { kind: "roadmap" } }),
    ]);

    return ok({
      totalUsers,
      activeUsers: totalUsers - blockedUsers,
      blockedUsers,
      totalEvents,
      totalPlansGenerated: totalPlans,
      newUsersThisMonth: newThisMonth,
    });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
