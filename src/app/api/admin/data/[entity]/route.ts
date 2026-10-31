import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/data/:entity?search=&page=&pageSize=  (admin only)
//
// A single read-only endpoint that powers every monitoring section of the admin
// dashboard. Each entity is joined back to its owning User (via EventPlan.ownerId)
// so the admin can see WHOSE data it is. Only safe, display fields are selected —
// never passwordHash, session rows or reset tokens.
//
// Supported entities:
//   events    — all EventPlans (weddings, birthdays, parties, community events)
//   aiplans   — AiRecommendations (generated plans/themes/menus/etc.)
//   venues    — SavedVenues (venue a plan selected/shortlisted)
//   budgets   — BudgetItems (estimated vs. confirmed spend)
//   vendors   — SavedVendors (quotations, enquiries, agreed cost)
//   themes    — Menus (selected food style + dietary) [+ theme from plan.styles]
//   timelines — TimelineTasks (deadlines, progress)

type Entity = "events" | "aiplans" | "venues" | "budgets" | "vendors" | "themes" | "timelines";
const ENTITIES: Entity[] = ["events", "aiplans", "venues", "budgets", "vendors", "themes", "timelines"];

// Owner (user) summary attached to every row.
const ownerSelect = { select: { id: true, name: true, email: true } } as const;
// Nested: child row -> its plan -> the plan's owner.
const planOwner = { select: { id: true, title: true, city: true, owner: ownerSelect } } as const;

function ownerDTO(owner: { id: string; name: string | null; email: string | null } | null | undefined) {
  return owner ? { id: owner.id, name: owner.name, email: owner.email } : null;
}

export async function GET(req: Request, { params }: { params: { entity: string } }) {
  try {
    await requireAdmin();

    const entity = params.entity as Entity;
    if (!ENTITIES.includes(entity)) return fail("Unknown data section.", 404);

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") || 20)));
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    let total = 0;
    let rows: Record<string, unknown>[] = [];

    switch (entity) {
      case "events": {
        const where = search
          ? { OR: [{ title: { contains: search } }, { city: { contains: search } }] }
          : {};
        const [count, data] = await Promise.all([
          prisma.eventPlan.count({ where }),
          prisma.eventPlan.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              title: true,
              city: true,
              guestCount: true,
              budget: true,
              startDate: true,
              createdAt: true,
              eventType: { select: { name: true, category: { select: { name: true } } } },
              owner: ownerSelect,
              _count: { select: { budgetItems: true, savedVendors: true, tasks: true, recommendations: true } },
            },
          }),
        ]);
        total = count;
        rows = data.map((p) => ({
          id: p.id,
          title: p.title,
          city: p.city,
          type: p.eventType?.name ?? "—",
          category: p.eventType?.category?.name ?? "—",
          guestCount: p.guestCount,
          budget: p.budget,
          startDate: p.startDate?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          owner: ownerDTO(p.owner),
          counts: p._count,
        }));
        break;
      }

      case "aiplans": {
        const where = search ? { OR: [{ kind: { contains: search } }, { provider: { contains: search } }] } : {};
        const [count, data] = await Promise.all([
          prisma.aiRecommendation.count({ where }),
          prisma.aiRecommendation.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: { id: true, kind: true, provider: true, isGenerated: true, createdAt: true, plan: planOwner },
          }),
        ]);
        total = count;
        rows = data.map((r) => ({
          id: r.id,
          kind: r.kind,
          provider: r.provider,
          generated: r.isGenerated,
          createdAt: r.createdAt.toISOString(),
          event: r.plan ? { id: r.plan.id, title: r.plan.title, city: r.plan.city } : null,
          owner: ownerDTO(r.plan?.owner),
        }));
        break;
      }

      case "venues": {
        const where = search ? { venue: { name: { contains: search } } } : {};
        const [count, data] = await Promise.all([
          prisma.savedVenue.count({ where }),
          prisma.savedVenue.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              note: true,
              createdAt: true,
              venue: { select: { name: true, city: true, source: true, rating: true } },
              plan: planOwner,
              selectedByPlan: { select: { id: true } },
            },
          }),
        ]);
        total = count;
        rows = data.map((s) => ({
          id: s.id,
          venueName: s.venue?.name ?? "—",
          city: s.venue?.city ?? s.plan?.city ?? "—",
          source: s.venue?.source ?? "—",
          rating: s.venue?.rating ?? null,
          selected: !!s.selectedByPlan,
          note: s.note,
          createdAt: s.createdAt.toISOString(),
          event: s.plan ? { id: s.plan.id, title: s.plan.title } : null,
          owner: ownerDTO(s.plan?.owner),
        }));
        break;
      }

      case "budgets": {
        const where = search ? { OR: [{ label: { contains: search } }, { category: { contains: search } }] } : {};
        const [count, data] = await Promise.all([
          prisma.budgetItem.count({ where }),
          prisma.budgetItem.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              category: true,
              label: true,
              quantity: true,
              unitCostMin: true,
              unitCostMax: true,
              estimated: true,
              createdAt: true,
              plan: planOwner,
            },
          }),
        ]);
        total = count;
        rows = data.map((b) => ({
          id: b.id,
          category: b.category,
          label: b.label,
          quantity: b.quantity,
          estMin: b.unitCostMin * b.quantity,
          estMax: b.unitCostMax * b.quantity,
          estimated: b.estimated,
          createdAt: b.createdAt.toISOString(),
          event: b.plan ? { id: b.plan.id, title: b.plan.title } : null,
          owner: ownerDTO(b.plan?.owner),
        }));
        break;
      }

      case "vendors": {
        const where = search
          ? { OR: [{ vendor: { name: { contains: search } } }, { packageName: { contains: search } }] }
          : {};
        const [count, data] = await Promise.all([
          prisma.savedVendor.count({ where }),
          prisma.savedVendor.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              status: true,
              favourite: true,
              packageName: true,
              agreedCost: true,
              enquiry: true,
              createdAt: true,
              vendor: { select: { name: true, category: true, city: true } },
              plan: planOwner,
            },
          }),
        ]);
        total = count;
        rows = data.map((v) => ({
          id: v.id,
          vendorName: v.vendor?.name ?? "—",
          category: v.vendor?.category ?? "—",
          city: v.vendor?.city ?? "—",
          status: v.status,
          favourite: v.favourite,
          packageName: v.packageName,
          agreedCost: v.agreedCost,
          hasEnquiry: !!v.enquiry,
          createdAt: v.createdAt.toISOString(),
          event: v.plan ? { id: v.plan.id, title: v.plan.title } : null,
          owner: ownerDTO(v.plan?.owner),
        }));
        break;
      }

      case "themes": {
        const where = search ? { OR: [{ style: { contains: search } }, { dietary: { contains: search } }] } : {};
        const [count, data] = await Promise.all([
          prisma.menu.count({ where }),
          prisma.menu.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              style: true,
              dietary: true,
              estimated: true,
              createdAt: true,
              plan: { select: { id: true, title: true, city: true, styles: true, owner: ownerSelect } },
            },
          }),
        ]);
        total = count;
        rows = data.map((m) => ({
          id: m.id,
          foodStyle: m.style,
          dietary: m.dietary,
          theme: m.plan?.styles ?? null,
          estimated: m.estimated,
          createdAt: m.createdAt.toISOString(),
          event: m.plan ? { id: m.plan.id, title: m.plan.title } : null,
          owner: ownerDTO(m.plan?.owner),
        }));
        break;
      }

      case "timelines": {
        const where = search ? { OR: [{ title: { contains: search } }, { assignee: { contains: search } }] } : {};
        const [count, data] = await Promise.all([
          prisma.timelineTask.count({ where }),
          prisma.timelineTask.findMany({
            where,
            orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
            skip,
            take,
            select: {
              id: true,
              title: true,
              priority: true,
              status: true,
              done: true,
              dueDate: true,
              assignee: true,
              createdAt: true,
              plan: planOwner,
            },
          }),
        ]);
        total = count;
        rows = data.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          done: t.done,
          dueDate: t.dueDate?.toISOString() ?? null,
          assignee: t.assignee,
          createdAt: t.createdAt.toISOString(),
          event: t.plan ? { id: t.plan.id, title: t.plan.title } : null,
          owner: ownerDTO(t.plan?.owner),
        }));
        break;
      }
    }

    return ok({ total, page, pageSize, pages: Math.ceil(total / pageSize) || 1, rows });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
