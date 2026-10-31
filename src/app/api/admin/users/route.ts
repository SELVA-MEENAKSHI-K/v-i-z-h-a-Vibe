import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/users?search=&role=&status=&page=&pageSize=  (admin only)
// Returns ONLY safe user fields — never passwordHash, tokens or sessions.
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const role = searchParams.get("role") || ""; // "", "USER", "ADMIN"
    const status = searchParams.get("status") || ""; // "", "ACTIVE", "BLOCKED"
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") || 20)));

    const where: Record<string, unknown> = { passwordHash: { not: null } };
    if (role === "USER" || role === "ADMIN") where.role = role;
    if (status === "ACTIVE" || status === "BLOCKED") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { plans: true } },
        },
      }),
    ]);

    return ok({
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
      users: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        eventCount: u._count.plans,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
