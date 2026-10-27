import { describe, it, expect } from "vitest";
import { CATALOG, totalEventTypeCount, findEventType, CITIES } from "@/data/catalog";

describe("event catalog", () => {
  it("has at least 8 categories", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(8);
  });

  it("has at least 30 event types", () => {
    expect(totalEventTypeCount()).toBeGreaterThanOrEqual(30);
  });

  it("has unique category slugs", () => {
    const slugs = CATALOG.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique event-type slugs across all categories", () => {
    const slugs = CATALOG.flatMap((c) => c.eventTypes.map((t) => t.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves an event type back to its category", () => {
    const found = findEventType("tamil-wedding");
    expect(found).not.toBeNull();
    expect(found?.category.slug).toBe("weddings");
    expect(found?.type.name).toBe("Tamil Wedding");
  });

  it("returns null for an unknown event type", () => {
    expect(findEventType("not-a-real-type")).toBeNull();
  });

  it("supports the three target cities", () => {
    expect(CITIES).toContain("Madurai");
    expect(CITIES).toContain("Chennai");
    expect(CITIES).toContain("Bangalore");
  });
});
