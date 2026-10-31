import { describe, it, expect } from "vitest";
import { generateTimeline, dueDateForOffset, effectiveStatus, completionPct } from "@/lib/timeline";
import type { SerializedPlan } from "@/lib/plans";

// Minimal serialized-plan builder for the pure timeline generator.
function plan(overrides: Partial<SerializedPlan> = {}): SerializedPlan {
  const base = {
    id: "p1",
    shareToken: "tok",
    title: "Test Event",
    city: "Chennai",
    eventType: { slug: "reception", name: "Reception", categoryName: "Weddings", defaultStyles: [] },
    startDate: null,
    endDate: null,
    guestCount: 150,
    budget: 500000,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { ...base, ...overrides } as unknown as SerializedPlan;
}

describe("timeline generation", () => {
  it("produces core milestones with priority and assignee", () => {
    const tasks = generateTimeline(plan());
    expect(tasks.length).toBeGreaterThan(5);
    expect(tasks.every((t) => ["high", "medium", "low"].includes(t.priority))).toBe(true);
    expect(tasks.every((t) => t.assignee.length > 0)).toBe(true);
    expect(tasks.some((t) => t.title.toLowerCase().includes("guest list"))).toBe(true);
  });

  it("never schedules a preparation task on or after the event date", () => {
    // Event only 3 days away. The true requirement: every task's DUE DATE is
    // strictly before the event date (offset >= 1 day before it).
    const soon = new Date();
    soon.setHours(0, 0, 0, 0);
    soon.setDate(soon.getDate() + 3);
    const eventIso = soon.toISOString();
    const tasks = generateTimeline(plan({ startDate: eventIso }));
    expect(tasks.every((t) => t.offsetDays >= 1)).toBe(true);
    for (const t of tasks) {
      const due = dueDateForOffset(eventIso, t.offsetDays);
      expect(due).not.toBeNull();
      // Due date must be strictly before the event date.
      expect(new Date(due as string).getTime()).toBeLessThan(new Date(eventIso).getTime());
    }
  });

  it("orders tasks earliest-prep-first (largest offset first)", () => {
    const tasks = generateTimeline(plan({ startDate: new Date(Date.now() + 120 * 86400000).toISOString() }));
    const offsets = tasks.map((t) => t.offsetDays);
    const sorted = [...offsets].sort((a, b) => b - a);
    expect(offsets).toEqual(sorted);
  });

  it("adds vendor-specific tasks from saved vendors", () => {
    const withVendors = plan({
      savedVendors: [
        { id: "sv1", vendorId: "v1", status: "NEGOTIATING", favourite: false, note: null, packageName: "Signature", agreedCost: null, enquiry: null, vendor: { id: "v1", source: "sample", isSample: true, verified: false, name: "Aperture Studio", category: "photography", city: "Chennai", area: null, address: null, phone: null, email: null, website: null, photos: [], rating: null, reviewCount: null, packages: [], sourceName: null, sourceUrl: null } },
      ] as unknown as SerializedPlan["savedVendors"],
    });
    const tasks = generateTimeline(withVendors);
    expect(tasks.some((t) => t.title.includes("Aperture Studio"))).toBe(true);
    expect(tasks.some((t) => t.vendorId === "v1")).toBe(true);
  });

  it("includes a venue-specific task when a venue is selected", () => {
    const withVenue = plan({ selectedVenue: { name: "Grand Hall" } as unknown as SerializedPlan["selectedVenue"] });
    const tasks = generateTimeline(withVenue);
    expect(tasks.some((t) => t.title.toLowerCase().includes("confirm venue"))).toBe(true);
  });
});

describe("dueDateForOffset", () => {
  it("subtracts the offset from the event date", () => {
    const event = "2027-02-14T00:00:00.000Z";
    const due = dueDateForOffset(event, 7);
    expect(due).not.toBeNull();
    const d = new Date(due as string);
    expect(d.getTime()).toBeLessThan(new Date(event).getTime());
    // 7 days earlier.
    expect(Math.round((new Date(event).getTime() - d.getTime()) / 86400000)).toBe(7);
  });

  it("returns null without an event date", () => {
    expect(dueDateForOffset(null, 7)).toBeNull();
  });
});

describe("effectiveStatus", () => {
  it("marks a past-due, not-done task as overdue", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(effectiveStatus("pending", false, past)).toBe("overdue");
  });
  it("keeps a completed task completed regardless of date", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(effectiveStatus("pending", true, past)).toBe("completed");
  });
  it("preserves in-progress for a future due date", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(effectiveStatus("in-progress", false, future)).toBe("in-progress");
  });
});

describe("completionPct", () => {
  it("is 0 for an empty list", () => {
    expect(completionPct([])).toBe(0);
  });
  it("counts done + completed", () => {
    expect(completionPct([{ done: true, status: "completed" }, { done: false, status: "pending" }])).toBe(50);
  });
});
