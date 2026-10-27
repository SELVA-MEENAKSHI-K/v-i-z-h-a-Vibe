import { ok } from "@/lib/api";
import { prisma } from "@/lib/db";
import { CATALOG } from "@/data/catalog";

export const dynamic = "force-dynamic";

// Returns categories + event types. Reads from the DB when seeded, otherwise
// falls back to the static catalog so the endpoint always works.
export async function GET() {
  try {
    const categories = await prisma.eventCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { eventTypes: { orderBy: { sortOrder: "asc" } } },
    });

    if (categories.length > 0) {
      return ok(
        categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          icon: c.icon,
          eventTypes: c.eventTypes.map((t) => ({
            slug: t.slug,
            name: t.name,
            description: t.description,
            defaultStyles: t.defaultStyles ? t.defaultStyles.split(",").filter(Boolean) : [],
          })),
        })),
      );
    }
  } catch {
    // DB not ready — fall through to static catalog.
  }

  return ok(
    CATALOG.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      icon: c.icon,
      eventTypes: c.eventTypes.map((t) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        defaultStyles: t.defaultStyles ?? [],
      })),
    })),
  );
}
