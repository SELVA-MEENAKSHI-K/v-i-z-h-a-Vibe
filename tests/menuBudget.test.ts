import { describe, it, expect } from "vitest";
import { requiredQuantity, computeFoodEstimate, remainingAfterFood } from "@/lib/menuBudget";
import { MENU_ITEMS, COURSES, filterMenuItems } from "@/data/menuItems";

describe("menu catalog", () => {
  it("has at least 10 menu items", () => {
    expect(MENU_ITEMS.length).toBeGreaterThanOrEqual(10);
  });

  it("every item has a price range, serving, course and cuisine", () => {
    const courseSlugs = COURSES.map((c) => c.slug);
    for (const m of MENU_ITEMS) {
      expect(m.priceMax).toBeGreaterThanOrEqual(m.priceMin);
      expect(m.priceMin).toBeGreaterThan(0);
      expect(m.serving.length).toBeGreaterThan(0);
      expect(courseSlugs).toContain(m.course);
    }
  });

  it("filters by diet", () => {
    const veg = filterMenuItems({ diet: "veg" });
    expect(veg.every((m) => m.diet === "veg")).toBe(true);
    expect(veg.length).toBeGreaterThan(0);
  });
});

describe("requiredQuantity", () => {
  it("rounds up servings for the guest count", () => {
    expect(requiredQuantity(100, 1)).toBe(100);
    expect(requiredQuantity(101, 0.5)).toBe(51); // ceil(50.5)
    expect(requiredQuantity(10, 2)).toBe(20);
  });

  it("handles zero guests", () => {
    expect(requiredQuantity(0, 1)).toBe(0);
  });
});

describe("computeFoodEstimate", () => {
  const selections = [
    { slug: "a", name: "A", servingsPerGuest: 1, priceMin: 50, priceMax: 100 },
    { slug: "b", name: "B", servingsPerGuest: 1, priceMin: 30, priceMax: 60 },
  ];

  it("computes per-line and total food cost with real arithmetic", () => {
    const est = computeFoodEstimate(100, selections);
    // Line A: 100 * 50..100 = 5000..10000; Line B: 100 * 30..60 = 3000..6000
    expect(est.lines[0].quantity).toBe(100);
    expect(est.lines[0].subtotalMin).toBe(5000);
    expect(est.lines[0].subtotalMax).toBe(10000);
    expect(est.foodMin).toBe(8000);
    expect(est.foodMax).toBe(16000);
    expect(est.totalMin).toBe(8000); // no tax configured
    expect(est.totalMax).toBe(16000);
  });

  it("computes per-person cost", () => {
    const est = computeFoodEstimate(100, selections);
    expect(est.perPersonMin).toBe(80); // 8000 / 100
    expect(est.perPersonMax).toBe(160); // 16000 / 100
  });

  it("applies an explicit service/tax percentage only when configured", () => {
    const est = computeFoodEstimate(100, selections, 10);
    expect(est.serviceTaxPct).toBe(10);
    expect(est.serviceMin).toBe(800); // 10% of 8000
    expect(est.serviceMax).toBe(1600);
    expect(est.totalMin).toBe(8800);
    expect(est.totalMax).toBe(17600);
  });

  it("returns zero totals for an empty selection", () => {
    const est = computeFoodEstimate(50, []);
    expect(est.foodMin).toBe(0);
    expect(est.totalMax).toBe(0);
    expect(est.perPersonMin).toBe(0);
  });
});

describe("remainingAfterFood", () => {
  it("returns remaining budget", () => {
    expect(remainingAfterFood(100000, 30000)).toBe(70000);
  });
  it("is negative when over budget", () => {
    expect(remainingAfterFood(20000, 30000)).toBe(-10000);
  });
  it("returns null when no budget is set", () => {
    expect(remainingAfterFood(0, 30000)).toBeNull();
  });
});
