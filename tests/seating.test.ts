import { describe, it, expect } from "vitest";
import { totalSeats, seatingStatus, generateLayout } from "@/lib/seating";

describe("seating math", () => {
  it("counts seats using explicit seats or kind defaults", () => {
    const objs = [
      { kind: "round-table", seats: 8 },
      { kind: "round-table" }, // default 8
      { kind: "chair", seats: 1 },
      { kind: "stage" }, // 0
    ];
    expect(totalSeats(objs)).toBe(17);
  });

  it("reports shortfall when guests exceed seats", () => {
    const status = seatingStatus(100, [{ kind: "round-table", seats: 8 }]);
    expect(status.seatsConfigured).toBe(8);
    expect(status.shortfall).toBe(92);
    expect(status.surplus).toBe(0);
    expect(status.tablesNeeded).toBe(Math.ceil(100 / 8));
  });

  it("reports surplus and 100% utilization when seats exceed guests", () => {
    const objs = Array.from({ length: 10 }, () => ({ kind: "round-table", seats: 8 })); // 80 seats
    const status = seatingStatus(50, objs);
    expect(status.seatsConfigured).toBe(80);
    expect(status.surplus).toBe(30);
    expect(status.shortfall).toBe(0);
    expect(status.utilizationPct).toBe(Math.round((50 / 80) * 100));
  });

  it("generates a guest-count-aware layout that can seat everyone", () => {
    const objects = generateLayout(80, 26, 20);
    const tables = objects.filter((o) => o.kind === "round-table");
    expect(tables.length).toBe(Math.ceil(80 / 8));
    // Fixed furniture present.
    expect(objects.some((o) => o.kind === "stage")).toBe(true);
    expect(objects.some((o) => o.kind === "entrance")).toBe(true);
    expect(objects.some((o) => o.kind === "buffet")).toBe(true);
    // Enough seats for all guests.
    expect(totalSeats(objects)).toBeGreaterThanOrEqual(80);
  });

  it("keeps generated objects within room bounds", () => {
    const w = 26;
    const d = 20;
    const objects = generateLayout(200, w, d);
    for (const o of objects) {
      expect(Math.abs(o.posX)).toBeLessThanOrEqual(w / 2 + 0.01);
      expect(Math.abs(o.posZ)).toBeLessThanOrEqual(d / 2 + 0.01);
    }
  });
});
