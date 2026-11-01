import { describe, it, expect } from "vitest";
import {
  inr,
  budgetToPos,
  posToBudget,
  isoLocal,
  describeDate,
  feel,
  BUDGET_MIN,
  BUDGET_MAX,
} from "@/components/setup/wizardHelpers";

describe("inr", () => {
  it("formats small amounts with the en-IN grouping", () => {
    expect(inr(5000)).toBe("₹5,000");
    expect(inr(0)).toBe("₹0");
  });
  it("uses lakh and crore suffixes", () => {
    expect(inr(100000)).toBe("₹1 L");
    expect(inr(150000)).toBe("₹1.5 L");
    expect(inr(10000000)).toBe("₹1 Cr");
    expect(inr(25000000)).toBe("₹2.5 Cr");
  });
  it("guards against non-finite input", () => {
    expect(inr(Number.NaN)).toBe("₹0");
    expect(inr(Number.POSITIVE_INFINITY)).toBe("₹0");
  });
});

describe("budget slider mapping", () => {
  it("clamps to the min/max bounds", () => {
    expect(budgetToPos(0)).toBe(0); // falsy → BUDGET_MIN → position 0
    expect(budgetToPos(BUDGET_MIN)).toBe(0);
    expect(budgetToPos(BUDGET_MAX)).toBe(1000);
    expect(budgetToPos(BUDGET_MAX * 2)).toBe(1000); // clamped
  });
  it("round-trips approximately (pos → budget → pos)", () => {
    for (const pos of [0, 250, 500, 750, 1000]) {
      const back = budgetToPos(posToBudget(pos));
      expect(Math.abs(back - pos)).toBeLessThanOrEqual(5);
    }
  });
  it("posToBudget stays within bounds and rounds to sensible steps", () => {
    expect(posToBudget(0)).toBeGreaterThanOrEqual(BUDGET_MIN - 5000);
    const mid = posToBudget(500);
    expect(mid).toBeGreaterThan(BUDGET_MIN);
    expect(mid).toBeLessThan(BUDGET_MAX);
  });
});

describe("isoLocal", () => {
  it("formats a local date as YYYY-MM-DD with zero padding", () => {
    expect(isoLocal(new Date(2027, 0, 5))).toBe("2027-01-05");
    expect(isoLocal(new Date(2027, 11, 25))).toBe("2027-12-25");
  });
});

describe("describeDate", () => {
  it("returns null for empty or invalid input", () => {
    expect(describeDate("")).toBeNull();
    expect(describeDate("not-a-date")).toBeNull();
  });
  it("marks a past date as past", () => {
    const info = describeDate("2000-01-01");
    expect(info).not.toBeNull();
    expect(info?.past).toBe(true);
    expect(info?.rel).toMatch(/ago/);
  });
  it("describes a future date as not past", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const info = describeDate(isoLocal(future));
    expect(info?.past).toBe(false);
    expect(info?.rel).toMatch(/in \d+ day/);
  });
});

describe("feel", () => {
  it("buckets per-guest spend into the four tiers", () => {
    expect(feel(300).label).toBe("Tight");
    expect(feel(1000).label).toBe("Balanced");
    expect(feel(2000).label).toBe("Comfortable");
    expect(feel(5000).label).toBe("Premium");
  });
  it("each tier carries a tone class and a meter percentage", () => {
    const f = feel(5000);
    expect(f.tone).toMatch(/^text-/);
    expect(f.pct).toBeGreaterThan(0);
    expect(f.pct).toBeLessThanOrEqual(100);
  });
});
