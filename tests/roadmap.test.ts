import { describe, it, expect } from "vitest";
import { generateRoadmap } from "@/lib/ai/roadmap";

// Minimal plan shaped like SerializedPlan for the roadmap generator.
function makePlan(overrides: Record<string, unknown> = {}): any {
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
  };
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
});
