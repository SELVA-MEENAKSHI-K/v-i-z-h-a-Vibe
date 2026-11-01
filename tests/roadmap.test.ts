import { describe, it, expect } from "vitest";
import { generateRoadmap } from "@/lib/ai/roadmap";
import type { SerializedPlan } from "@/lib/plans";

// Minimal plan shaped like SerializedPlan for the roadmap generator. Cast via
// unknown so we can supply only the fields the generator reads without using
// `any` (which the lint config forbids).
function makePlan(overrides: Record<string, unknown> = {}): SerializedPlan {
  return {
    id: "p1",
    shareToken: "tok",
    title: "Meena & Arun Wedding",
    city: "Madurai",
    eventType: { slug: "tamil-wedding", name: "Tamil Wedding", categoryName: "Weddings", defaultStyles: [] },
    startDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    endDate: null,
    guestCount: 250,
    budget: 1500000,
    styles: ["tamil"],
    preferences: { selectedThemeName: "Traditional Tamil Wedding" },
    notes: null,
    selectedVenue: { name: "Thamizh Mandapam", address: "Madurai", isSample: true },
    savedVenues: [],
    layout: { objects: [{ kind: "round-table", seats: 8 }] },
    budgetItems: [
      { category: "venue", label: "Venue rental", quantity: 1, unitCostMin: 120000, unitCostMax: 250000, estimated: true },
      { category: "catering", label: "Catering (per plate)", quantity: 250, unitCostMin: 500, unitCostMax: 900, estimated: true },
    ],
    menus: [{ style: "tamil", dietary: "veg", courses: [{ course: "Main", items: ["Sambar rice", "Avial"] }], estimated: true }],
    tasks: [],
    recommendations: [],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  } as unknown as SerializedPlan;
}

describe("AI roadmap generator", () => {
  it("reflects the user's actual selections (venue, theme, guests)", () => {
    const r = generateRoadmap(makePlan());
    expect(r.overview.venue).toBe("Thamizh Mandapam");
    expect(r.overview.theme).toBe("Traditional Tamil Wedding");
    expect(r.overview.guestCount).toBe(250);
    expect(r.overview.eventType).toBe("Tamil Wedding");
  });

  it("computes catering from the saved budget line (real arithmetic)", () => {
    const r = generateRoadmap(makePlan());
    // 250 * 500..900 = 125000..225000
    expect(r.food.estMin).toBe(125000);
    expect(r.food.estMax).toBe(225000);
  });

  it("produces all 8 roadmap sections", () => {
    const r = generateRoadmap(makePlan());
    expect(r.overview).toBeTruthy();
    expect(r.venuePrep.length).toBeGreaterThan(0);
    expect(r.decoration.items.length).toBeGreaterThan(0);
    expect(r.food.menu.length).toBeGreaterThan(0);
    expect(r.timeline.length).toBeGreaterThan(0);
    expect(r.checklist.length).toBeGreaterThan(0);
    expect(r.budgetReport.lines.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("warns when no venue is selected", () => {
    const r = generateRoadmap(makePlan({ selectedVenue: null }));
    expect(r.overview.venue).toBeNull();
    expect(r.recommendations.some((x) => /venue/i.test(x))).toBe(true);
  });

  it("computes per-guest and remaining budget", () => {
    const r = generateRoadmap(makePlan());
    expect(r.budgetReport.totalMax).toBeGreaterThanOrEqual(r.budgetReport.totalMin);
    expect(r.budgetReport.perGuestMin).toBeGreaterThan(0);
    expect(r.budgetReport.remainingMin).not.toBeNull();
  });

  it("builds an evening timeline for a reception", () => {
    const r = generateRoadmap(makePlan({ eventType: { slug: "reception", name: "Reception", categoryName: "Weddings", defaultStyles: [] } }));
    expect(r.timeline.some((s) => s.time.includes("PM"))).toBe(true);
  });

  it("builds a corporate conference roadmap (different category branch)", () => {
    const r = generateRoadmap(
      makePlan({
        eventType: { slug: "conference", name: "Conference", categoryName: "Corporate", defaultStyles: [] },
        styles: [],
        preferences: {},
      }),
    );
    expect(r.overview.eventType).toBe("Conference");
    expect(r.timeline.length).toBeGreaterThan(0);
  });

  it("handles a plan with no menu and no budget lines without crashing", () => {
    const r = generateRoadmap(makePlan({ menus: [], budgetItems: [], budget: 0 }));
    expect(r.food.estMin).toBe(0);
    expect(r.budgetReport.remainingMin).toBeNull();
  });

  it("flags an over-budget plan in the budget report", () => {
    // Tiny budget vs large catering cost => remaining goes negative/short.
    const r = generateRoadmap(makePlan({ budget: 10000 }));
    expect(r.budgetReport.totalMax).toBeGreaterThan(10000);
  });

  it("names the structured provider by default", () => {
    const r = generateRoadmap(makePlan());
    expect(r.provider).toBe("structured");
    expect(r.generated).toBe(true);
  });
});
