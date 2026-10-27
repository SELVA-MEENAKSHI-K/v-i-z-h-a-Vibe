// Seed: event catalog, sample venues, one demo user, and a sample plan with a
// 3D layout, budget, menu, and timeline. Safe to run repeatedly (idempotent).

import { PrismaClient } from "@prisma/client";
import { CATALOG } from "../src/data/catalog";
import { SAMPLE_VENUES } from "../src/data/sampleVenues";
import { MADURAI_CATALOG_SEED } from "../src/data/maduraiCatalog";
import { generateLayout } from "../src/lib/seating";

const prisma = new PrismaClient();

async function seedCatalog() {
  for (let ci = 0; ci < CATALOG.length; ci++) {
    const cat = CATALOG[ci];
    const category = await prisma.eventCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, sortOrder: ci },
      create: { slug: cat.slug, name: cat.name, description: cat.description, icon: cat.icon, sortOrder: ci },
    });
    for (let ti = 0; ti < cat.eventTypes.length; ti++) {
      const t = cat.eventTypes[ti];
      await prisma.eventType.upsert({
        where: { slug: t.slug },
        update: {
          name: t.name,
          description: t.description,
          defaultStyles: t.defaultStyles?.join(",") ?? null,
          sortOrder: ti,
          categoryId: category.id,
        },
        create: {
          slug: t.slug,
          name: t.name,
          description: t.description,
          defaultStyles: t.defaultStyles?.join(",") ?? null,
          sortOrder: ti,
          categoryId: category.id,
        },
      });
    }
  }
}

async function seedVenues() {
  for (const v of SAMPLE_VENUES) {
    await prisma.venue.upsert({
      where: { providerId: v.providerId },
      update: {},
      create: {
        providerId: v.providerId,
        source: "sample",
        isSample: true,
        name: v.name,
        address: v.address,
        city: v.city,
        lat: v.lat,
        lng: v.lng,
        rating: v.rating,
        reviewCount: v.reviewCount,
        website: v.website,
        phone: v.phone,
        openingHours: JSON.stringify(v.openingHours),
        photos: JSON.stringify([]),
        venueTypes: JSON.stringify(v.venueTypes),
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`,
        attribution: "Sample data — not live venue information.",
        lastCheckedAt: new Date(),
      },
    });
  }
}

async function seedCatalogVenues() {
  // Only seeds non-fabricated template/authorized records. See maduraiCatalog.ts.
  for (const v of MADURAI_CATALOG_SEED) {
    const existing = await prisma.catalogVenue.findFirst({ where: { name: v.name, city: v.city } });
    if (existing) continue;
    await prisma.catalogVenue.create({
      data: {
        name: v.name,
        venueType: v.venueType,
        address: v.address ?? null,
        city: v.city,
        area: v.area ?? null,
        lat: v.lat ?? null,
        lng: v.lng ?? null,
        phone: v.phone ?? null,
        email: v.email ?? null,
        website: v.website ?? null,
        capacityMin: v.capacityMin ?? null,
        capacityMax: v.capacityMax ?? null,
        priceMin: v.priceMin ?? null,
        priceMax: v.priceMax ?? null,
        amenities: v.amenities ? JSON.stringify(v.amenities) : null,
        placeId: v.placeId ?? null,
        mapsUrl: v.mapsUrl ?? null,
        sourceName: v.sourceName,
        sourceUrl: v.sourceUrl ?? null,
        verification: v.verification,
        lastVerifiedAt: v.lastVerifiedAt ? new Date(v.lastVerifiedAt) : null,
        published: v.published,
      },
    });
  }
}

async function seedDemoPlan() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@vizhavibe.local" },
    update: {},
    create: { email: "demo@vizhavibe.local", name: "Demo Planner", isDemo: true },
  });

  const eventType = await prisma.eventType.findUnique({ where: { slug: "tamil-wedding" } });
  if (!eventType) throw new Error("Catalog must be seeded before the demo plan.");

  // Only create the demo plan once (by a stable share token).
  const existing = await prisma.eventPlan.findUnique({ where: { shareToken: "demo-tamil-wedding" } });
  if (existing) {
    console.log("Demo plan already exists, skipping.");
    return;
  }

  const start = new Date();
  start.setDate(start.getDate() + 75);

  const plan = await prisma.eventPlan.create({
    data: {
      shareToken: "demo-tamil-wedding",
      title: "Meena & Arun — Tamil Wedding",
      city: "Madurai",
      eventTypeId: eventType.id,
      startDate: start,
      endDate: start,
      guestCount: 250,
      budget: 1500000,
      styles: "tamil",
      preferences: JSON.stringify({ dietary: ["veg"], notes: "Morning muhurtham; jasmine-forward decor." }),
      ownerId: demoUser.id,
    },
  });

  // Attach a sample venue as the selected venue.
  const sampleVenue = await prisma.venue.findFirst({ where: { providerId: "sample:mdu-1" } });
  if (sampleVenue) {
    const saved = await prisma.savedVenue.create({
      data: { planId: plan.id, venueId: sampleVenue.id, note: "Shortlisted — confirm date & terms." },
    });
    await prisma.eventPlan.update({ where: { id: plan.id }, data: { selectedVenueId: saved.id } });
  }

  // 3D layout generated from guest count.
  const layout = await prisma.venueLayout.create({
    data: { planId: plan.id, roomWidth: 26, roomDepth: 20, illustrative: true },
  });
  const objects = generateLayout(250, 26, 20);
  await prisma.placedObject.createMany({
    data: objects.map((o) => ({
      layoutId: layout.id,
      kind: o.kind,
      label: o.label,
      posX: o.posX,
      posY: o.posY,
      posZ: o.posZ,
      rotY: o.rotY,
      scale: o.scale,
      seats: o.seats,
      style: o.style ?? null,
    })),
  });

  // Budget line items (clearly estimated).
  await prisma.budgetItem.createMany({
    data: [
      { planId: plan.id, category: "venue", label: "Venue rental", quantity: 1, unitCostMin: 120000, unitCostMax: 250000, estimated: true, assumption: "Single-day, peak-season weekend.", sortOrder: 0 },
      { planId: plan.id, category: "catering", label: "Catering (per plate)", quantity: 250, unitCostMin: 500, unitCostMax: 900, estimated: true, assumption: "Traditional veg sadya-style menu.", sortOrder: 1 },
      { planId: plan.id, category: "decor", label: "Decor & jasmine floral", quantity: 1, unitCostMin: 80000, unitCostMax: 250000, estimated: true, assumption: "Stage + entrance + tables.", sortOrder: 2 },
      { planId: plan.id, category: "photography", label: "Photo & video", quantity: 1, unitCostMin: 60000, unitCostMax: 180000, estimated: true, assumption: "Candid + traditional, one day.", sortOrder: 3 },
    ],
  });

  // Menu.
  await prisma.menu.create({
    data: {
      planId: plan.id,
      style: "tamil",
      dietary: "veg",
      courses: JSON.stringify([
        { course: "Welcome", items: ["Filter coffee", "Medu vada"] },
        { course: "Main (Sadya)", items: ["Sambar rice", "Avial", "Poriyal", "Appalam"] },
        { course: "Dessert", items: ["Payasam"] },
      ]),
      notes: "Served on banana leaf; vegetarian.",
      estimated: true,
    },
  });

  // Timeline tasks.
  await prisma.timelineTask.createMany({
    data: [
      { planId: plan.id, title: "Confirm guest list", detail: "Lock ~250 count.", offsetDays: 75, sortOrder: 0 },
      { planId: plan.id, title: "Book venue", detail: "Confirm Madurai hall & muhurtham slot.", offsetDays: 70, sortOrder: 1 },
      { planId: plan.id, title: "Finalize caterer", detail: "Sadya tasting.", offsetDays: 50, sortOrder: 2 },
      { planId: plan.id, title: "Lock decor", detail: "Jasmine + lamp theme.", offsetDays: 40, sortOrder: 3 },
      { planId: plan.id, title: "Finalize seating in 3D", detail: "Use planner to place tables.", offsetDays: 14, sortOrder: 4 },
    ],
  });

  console.log(`Seeded demo plan: /plan/${plan.shareToken}`);
}

async function main() {
  console.log("Seeding VizhaVibe...");
  await seedCatalog();
  await seedVenues();
  await seedCatalogVenues();
  await seedDemoPlan();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
