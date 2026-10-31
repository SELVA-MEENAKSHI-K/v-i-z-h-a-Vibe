import { describe, it, expect } from "vitest";
import { resolveEventEnvironment } from "@/lib/eventEnvironment";
import { generateShowcaseArrangement, computeSeatingStats } from "@/lib/showcaseSeating";

describe("event environment mapping", () => {
  it("maps each wedding style to a distinct look", () => {
    const tamil = resolveEventEnvironment({ eventTypeSlug: "tamil-wedding", styles: ["tamil"] });
    const kerala = resolveEventEnvironment({ eventTypeSlug: "kerala-wedding", styles: ["kerala"] });
    const north = resolveEventEnvironment({ eventTypeSlug: "north-indian-wedding", styles: ["north-indian"] });
    expect(tamil.displayName).toMatch(/tamil/i);
    expect(kerala.displayName).toMatch(/kerala/i);
    expect(north.displayName).toMatch(/north indian/i);
    // Distinct colours — the explicit "never the same for every event" rule.
    const colors = new Set([tamil.stageColor, kerala.stageColor, north.stageColor]);
    expect(colors.size).toBe(3);
  });

  it("gives birthdays a cluster layout with a dance floor, community a theatre layout", () => {
    const bday = resolveEventEnvironment({ eventTypeSlug: "birthday" });
    expect(bday.arrangement).toBe("cluster");
    expect(bday.decorations).toContain("balloon-cluster");
    expect(bday.decorations).toContain("cake-table");

    const comm = resolveEventEnvironment({ eventTypeSlug: "conference", categorySlug: "corporate" });
    expect(comm.arrangement).toBe("theatre");
  });

  it("lets an applied theme colour override the stage/accent", () => {
    const env = resolveEventEnvironment({
      eventTypeSlug: "reception",
      themeStageColor: "#123456",
      themeAccentColor: "#abcdef",
    });
    expect(env.stageColor).toBe("#123456");
    expect(env.accentColor).toBe("#abcdef");
    expect(env.palette).toContain("#123456");
  });

  it("falls back to a valid environment for an unknown slug", () => {
    const env = resolveEventEnvironment({ eventTypeSlug: "something-made-up" });
    expect(env.displayName).toBeTruthy();
    expect(env.palette.length).toBeGreaterThan(0);
  });
});

describe("showcase seating generation", () => {
  it("creates round tables that can seat the guests (banquet)", () => {
    const arr = generateShowcaseArrangement({
      guestCount: 80,
      roomWidth: 26,
      roomDepth: 20,
      arrangement: "banquet-round",
      hasDanceFloor: true,
    });
    expect(arr.tables.length).toBeGreaterThan(0);
    expect(arr.tables.every((t) => t.shape === "round")).toBe(true);
    expect(arr.danceFloor).not.toBeNull();
    expect(arr.stage.width).toBeGreaterThan(0);
  });

  it("creates theatre chair rows (no tables) for theatre arrangement", () => {
    const arr = generateShowcaseArrangement({
      guestCount: 120,
      roomWidth: 24,
      roomDepth: 20,
      arrangement: "theatre",
      hasDanceFloor: false,
    });
    expect(arr.chairRows.length).toBeGreaterThan(0);
    expect(arr.tables.length).toBe(0);
    expect(arr.aisle).not.toBeNull();
  });

  it("keeps all tables within the room bounds", () => {
    const w = 26;
    const d = 20;
    const arr = generateShowcaseArrangement({ guestCount: 160, roomWidth: w, roomDepth: d, arrangement: "banquet-round", hasDanceFloor: false });
    for (const t of arr.tables) {
      expect(Math.abs(t.x)).toBeLessThanOrEqual(w / 2 + 0.01);
      expect(Math.abs(t.z)).toBeLessThanOrEqual(d / 2 + 0.01);
    }
  });
});

describe("seating statistics", () => {
  it("computes accurate arranged / available (available = capacity - arranged)", () => {
    const arr = generateShowcaseArrangement({ guestCount: 80, roomWidth: 26, roomDepth: 20, arrangement: "banquet-round", hasDanceFloor: false });
    const stats = computeSeatingStats(80, 26, 20, arr);
    expect(stats.seatsArranged).toBe(arr.tables.reduce((s, t) => s + t.seats, 0));
    expect(stats.availableSeats).toBe(stats.totalCapacity - stats.seatsArranged);
    expect(stats.availableSeats).toBeGreaterThanOrEqual(0);
    expect(stats.totalCapacity).toBeGreaterThanOrEqual(stats.seatsArranged);
  });

  it("never reports occupancy when no reservation data is given", () => {
    const arr = generateShowcaseArrangement({ guestCount: 50, roomWidth: 20, roomDepth: 16, arrangement: "banquet-round", hasDanceFloor: false });
    const stats = computeSeatingStats(50, 20, 16, arr);
    expect(stats.occupiedSeats).toBeUndefined();
  });

  it("reports occupancy only when real reservation data is supplied", () => {
    const arr = generateShowcaseArrangement({ guestCount: 50, roomWidth: 20, roomDepth: 16, arrangement: "banquet-round", hasDanceFloor: false });
    const stats = computeSeatingStats(50, 20, 16, arr, 24);
    expect(stats.occupiedSeats).toBe(24);
  });

  it("counts tables and dining seats", () => {
    const arr = generateShowcaseArrangement({ guestCount: 64, roomWidth: 24, roomDepth: 18, arrangement: "banquet-round", hasDanceFloor: false });
    const stats = computeSeatingStats(64, 24, 18, arr);
    expect(stats.tableCount).toBe(arr.tables.length);
    expect(stats.diningSeats).toBe(arr.tables.length * 8);
  });
});
