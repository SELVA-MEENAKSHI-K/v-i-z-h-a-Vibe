import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users/:id — safe user detail + their events (admin only).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const u = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        plans: {
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, city: true, startDate: true, createdAt: true },
        },
      },
    });
    if (!u) return fail("User not found.", 404);

    const plansGenerated = await prisma.aiRecommendation.count({
      where: { kind: "roadmap", plan: { ownerId: u.id } },
    });

    return ok({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      eventCount: u.plans.length,
      plansGenerated,
      events: u.plans.map((p) => ({
        id: p.id,
        title: p.title,
        city: p.city,
        startDate: p.startDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
