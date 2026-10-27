import { describe, it, expect } from "vitest";
import { DemoAiProvider } from "@/lib/ai/demoProvider";

const provider = new DemoAiProvider();
const ctx = {
  eventTypeSlug: "tamil-wedding",
  eventTypeName: "Tamil Wedding",
  city: "Madurai",
  guestCount: 200,
  budget: 1500000,
  styles: ["tamil"],
  dietary: "veg",
  startDate: new Date().toISOString(),
};

describe("demo AI provider", () => {
  it("is deterministic for the same input", async () => {
    const a = await provider.recommend("theme", ctx);
    const b = await provider.recommend("theme", ctx);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it("marks all output as generated and labels provider as demo", async () => {
    const r = await provider.recommend("budget", ctx);
    expect(r.generated).toBe(true);
    expect(r.provider).toBe("demo");
  });

  it("produces budget ranges with assumptions (never confirmed quotes)", async () => {
    const r = await provider.recommend("budget", ctx);
    if (r.kind !== "budget") throw new Error("wrong kind");
    expect(r.estimate.currency).toBe("INR");
    expect(r.estimate.lines.length).toBeGreaterThan(0);
    expect(r.estimate.totalMax).toBeGreaterThanOrEqual(r.estimate.totalMin);
    expect(r.estimate.assumptions.join(" ")).toMatch(/not quotes/i);
    for (const line of r.estimate.lines) {
      expect(line.unitCostMax).toBeGreaterThanOrEqual(line.unitCostMin);
      expect(line.assumption.length).toBeGreaterThan(0);
    }
  });

  it("tailors menus to the selected style and dietary preference", async () => {
    const r = await provider.recommend("menu", ctx);
    if (r.kind !== "menu") throw new Error("wrong kind");
    expect(r.menus[0].style).toBe("Tamil");
    expect(r.menus[0].dietary).toBe("veg");
    expect(r.menus[0].courses.length).toBeGreaterThan(0);
  });

  it("generates a descending-deadline timeline", async () => {
    const r = await provider.recommend("timeline", ctx);
    if (r.kind !== "timeline") throw new Error("wrong kind");
    const offsets = r.tasks.map((t) => t.offsetDays);
    const sorted = [...offsets].sort((a, b) => b - a);
    expect(offsets).toEqual(sorted);
  });

  it("chat replies carry a demo disclaimer and never claim confirmed facts", async () => {
    const reply = await provider.chat("What's the budget?", ctx);
    expect(reply).toMatch(/Demo assistant/i);
    expect(reply).toMatch(/indicative|not confirmed|ranges/i);
  });
});
