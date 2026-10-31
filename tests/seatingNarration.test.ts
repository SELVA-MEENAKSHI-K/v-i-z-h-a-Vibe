import { describe, it, expect } from "vitest";
import { resolveEventEnvironment } from "@/lib/eventEnvironment";
import { generateShowcaseArrangement, computeSeatingStats } from "@/lib/showcaseSeating";
import { buildNarration } from "@/lib/seatingNarration";
import { deriveVenueDimensions } from "@/lib/venueDimensions";
import type { Plan } from "@/components/planner/types";

// Build a minimal plan + the exact same derived data the showcase uses, so the
// narration is tested against REAL computed values (no hardcoding anywhere).
function scenario(opts: { eventTypeSlug: string; categoryName: string; styles?: string[]; guestCount: number; title: string }) {
  const plan = {
    title: opts.title,
    guestCount: opts.guestCount,
    styles: opts.styles ?? [],
    preferences: {},
    selectedVenue: null,
    layout: null,
    eventType: { slug: opts.eventTypeSlug, name: opts.title, categoryName: opts.categoryName, defaultStyles: [] },
  } as unknown as Plan;

  const dims = deriveVenueDimensions(plan);
  const env = resolveEventEnvironment({
    eventTypeSlug: opts.eventTypeSlug,
    categorySlug: opts.categoryName,
    styles: opts.styles,
  });
  const arrangement = generateShowcaseArrangement({
    guestCount: opts.guestCount,
    roomWidth: dims.width,
    roomDepth: dims.depth,
    arrangement: env.arrangement,
    hasDanceFloor: env.hasDanceFloor,
  });
  const stats = computeSeatingStats(opts.guestCount, dims.width, dims.depth, arrangement);
  return { env, arrangement, stats, dims };
}

const GUEST_COUNTS = [50, 100, 150, 250, 500];

describe("seating narration — numbers come from live data", () => {
  for (const g of GUEST_COUNTS) {
    it(`speaks the real computed figures for ${g} guests`, () => {
      const s = scenario({ eventTypeSlug: "north-indian-wedding", categoryName: "Weddings", styles: ["north-indian"], guestCount: g, title: "Test Wedding" });
      const script = buildNarration({ lang: "en", eventName: "Test Wedding", ...s });

      // Guest count, capacity, arranged, available, dimensions all appear verbatim.
      expect(script.full).toContain(`${g} guests`);
      expect(script.full).toContain(`${s.stats.totalCapacity} seats`);
      expect(script.full).toContain(`${s.stats.seatsArranged} seats arranged`);
      expect(script.full).toContain(`${s.dims.width} metres wide by ${s.dims.depth} metres deep`);

      // Sufficiency verdict matches the actual capacity calculation.
      expect(script.sufficient).toBe(s.stats.totalCapacity >= g);
      if (!script.sufficient) {
        expect(script.seatsNeeded).toBe(g - s.stats.totalCapacity);
        expect(script.full).toMatch(/more seats? (is|are) needed|Consider a larger venue/);
      }
    });
  }

  it("never claims all guests are accommodated when capacity is insufficient", () => {
    // Force an insufficient case by checking every scenario's invariant.
    for (const g of GUEST_COUNTS) {
      const s = scenario({ eventTypeSlug: "reception", categoryName: "Weddings", guestCount: g, title: "R" });
      const script = buildNarration({ lang: "en", eventName: "R", ...s });
      if (s.stats.totalCapacity < g) {
        expect(script.full).not.toContain("enough total capacity for all");
      }
    }
  });

  it("reports surplus (and does not over-claim) when seats exceed guests", () => {
    const s = scenario({ eventTypeSlug: "tamil-wedding", categoryName: "Weddings", styles: ["tamil"], guestCount: 50, title: "Small Wedding" });
    const script = buildNarration({ lang: "en", eventName: "Small Wedding", ...s });
    const surplus = Math.max(0, s.stats.seatsArranged - 50);
    if (surplus > 0) {
      expect(script.full).toMatch(/above the guest count/);
    }
  });
});

describe("seating narration — event-specific content", () => {
  it("mentions a mandap for weddings", () => {
    const s = scenario({ eventTypeSlug: "north-indian-wedding", categoryName: "Weddings", styles: ["north-indian"], guestCount: 150, title: "W" });
    const script = buildNarration({ lang: "en", eventName: "W", ...s });
    expect(script.full.toLowerCase()).toContain("mandap");
  });

  it("mentions a cake table for birthdays", () => {
    const s = scenario({ eventTypeSlug: "birthday", categoryName: "Family Celebrations", guestCount: 40, title: "B" });
    const script = buildNarration({ lang: "en", eventName: "B", ...s });
    expect(script.full.toLowerCase()).toContain("cake table");
  });

  it("mentions auditorium seating for community events", () => {
    const s = scenario({ eventTypeSlug: "conference", categoryName: "Corporate", guestCount: 200, title: "C" });
    const script = buildNarration({ lang: "en", eventName: "C", ...s });
    expect(script.full.toLowerCase()).toContain("auditorium");
  });

  it("mentions a photography area for engagement/reception", () => {
    const s = scenario({ eventTypeSlug: "engagement", categoryName: "Weddings", guestCount: 120, title: "E" });
    const script = buildNarration({ lang: "en", eventName: "E", ...s });
    expect(script.full.toLowerCase()).toMatch(/photograph/);
  });
});

describe("seating narration — Tamil", () => {
  it("produces Tamil output containing the real numbers", () => {
    const s = scenario({ eventTypeSlug: "tamil-wedding", categoryName: "Weddings", styles: ["tamil"], guestCount: 150, title: "திருமணம்" });
    const script = buildNarration({ lang: "ta", eventName: "திருமணம்", ...s });
    expect(script.title).toMatch(/வரவேற்கிறோம்/);
    expect(script.full).toContain(`${s.stats.totalCapacity}`);
    expect(script.full).toContain(`${s.stats.guestCount}`);
    // Contains Tamil script characters (not just English passthrough).
    expect(script.full).toMatch(/[\u0B80-\u0BFF]/);
  });
});
