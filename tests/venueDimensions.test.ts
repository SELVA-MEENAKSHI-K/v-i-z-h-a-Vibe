import { describe, it, expect } from "vitest";
import { deriveVenueDimensions } from "@/lib/venueDimensions";
import type { Plan } from "@/components/planner/types";

// Minimal Plan stub — only the fields deriveVenueDimensions reads matter.
function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "p1",
    shareToken: "t1",
    title: "Test",
    city: "Madurai",
    eventType: { slug: "reception", name: "Reception", categoryName: "Weddings", defaultStyles: [] },
    startDate: null,
    endDate: null,
    guestCount: 150,
    budget: 0,
    styles: [],
    preferences: {},
    notes: null,
    selectedVenue: null,
    savedVenues: [],
    layout: null,
    budgetItems: [],
    menus: [],
    tasks: [],
    savedVendors: [],
    recommendations: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as Plan;
}

describe("deriveVenueDimensions", () => {
  it("uses an existing saved layout and marks it not-a-sample", () => {
    const plan = makePlan({ layout: { id: "l1", roomWidth: 30, roomDepth: 22, illustrative: true, objects: [] } });
    const d = deriveVenueDimensions(plan);
    expect(d).toMatchObject({ width: 30, depth: 22, isSample: false, source: "layout" });
  });

  it("sizes the room from a verified venue capacity (not a sample)", () => {
    const plan = makePlan({
      selectedVenue: {
        id: "v1", providerId: null, source: "catalog", isSample: false, name: "Hall", address: null,
        city: "Madurai", lat: null, lng: null, rating: null, reviewCount: null, website: null, phone: null,
        openingHours: [], photos: [], venueTypes: [], mapsUrl: null, capacityMin: 200, capacityMax: 400,
        attribution: null, lastCheckedAt: null,
      },
    });
    const d = deriveVenueDimensions(plan);
    expect(d.isSample).toBe(false);
    expect(d.source).toBe("venue-capacity");
    expect(d.width).toBeGreaterThan(0);
    expect(d.depth).toBeGreaterThan(0);
  });

  it("falls back to a guest-count sample when there is no layout or capacity", () => {
    const d = deriveVenueDimensions(makePlan({ guestCount: 300 }));
    expect(d.isSample).toBe(true);
    expect(d.source).toBe("sample");
  });

  it("clamps dimensions within the hall min/max bounds", () => {
    const tiny = deriveVenueDimensions(makePlan({ guestCount: 1 }));
    expect(tiny.width).toBeGreaterThanOrEqual(10);
    expect(tiny.depth).toBeGreaterThanOrEqual(8);

    const huge = deriveVenueDimensions(makePlan({ guestCount: 100000 }));
    expect(huge.width).toBeLessThanOrEqual(90);
    expect(huge.depth).toBeLessThanOrEqual(70);
  });
});
