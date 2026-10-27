import { describe, it, expect } from "vitest";
import { createPlanSchema, layoutSchema, budgetSchema, aiChatSchema } from "@/lib/schemas";

describe("validation schemas", () => {
  it("accepts a valid plan", () => {
    const parsed = createPlanSchema.parse({
      title: "Test Plan",
      city: "Chennai",
      eventTypeSlug: "reception",
      guestCount: 120,
      budget: 500000,
      styles: ["tamil"],
    });
    expect(parsed.guestCount).toBe(120);
  });

  it("rejects an empty title", () => {
    expect(() => createPlanSchema.parse({ title: "", city: "Chennai", eventTypeSlug: "reception" })).toThrow();
  });

  it("rejects a guest count below 1", () => {
    expect(() =>
      createPlanSchema.parse({ title: "X", city: "Chennai", eventTypeSlug: "reception", guestCount: 0 }),
    ).toThrow();
  });

  it("validates layout objects and bounds", () => {
    const parsed = layoutSchema.parse({
      roomWidth: 24,
      roomDepth: 18,
      objects: [{ kind: "round-table", posX: 0, posY: 0, posZ: 0, rotY: 0, scale: 1, seats: 8 }],
    });
    expect(parsed.objects.length).toBe(1);
  });

  it("rejects an out-of-range room size", () => {
    expect(() => layoutSchema.parse({ roomWidth: 1, roomDepth: 18, objects: [] })).toThrow();
  });

  it("validates budget items", () => {
    const parsed = budgetSchema.parse({
      items: [{ category: "venue", label: "Hall", quantity: 1, unitCostMin: 1000, unitCostMax: 2000, estimated: true }],
    });
    expect(parsed.items[0].label).toBe("Hall");
  });

  it("rejects an empty chat message", () => {
    expect(() => aiChatSchema.parse({ message: "" })).toThrow();
  });
});
