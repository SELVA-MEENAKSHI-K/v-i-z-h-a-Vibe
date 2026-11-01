import { describe, it, expect } from "vitest";
import { resolveEventEnvironment } from "@/lib/eventEnvironment";

// Exercises each resolution branch: direct slug match, wedding-by-style,
// category heuristics, the celebration fallback, and theme-colour overrides.
describe("resolveEventEnvironment", () => {
  it("resolves a known event-type slug directly", () => {
    const env = resolveEventEnvironment({ eventTypeSlug: "tamil-wedding" });
    expect(env.palette.length).toBeGreaterThan(0);
    expect(env.arrangement).toBeTruthy();
    expect(env.displayName).toBeTruthy();
  });

  it("maps an unlisted wedding slug via the first cultural style", () => {
    const kerala = resolveEventEnvironment({ eventTypeSlug: "grand-wedding", styles: ["kerala"] });
    const northern = resolveEventEnvironment({ eventTypeSlug: "grand-wedding", styles: ["north-indian"] });
    // Different styles must not resolve to an identical environment.
    expect(kerala.displayName).not.toBe(northern.displayName);
  });

  it("defaults an unlisted wedding slug with no style to a Tamil wedding look", () => {
    const env = resolveEventEnvironment({ eventTypeSlug: "mystery-wedding" });
    expect(env.displayName.toLowerCase()).toContain("wedding");
  });

  it("uses the community environment for corporate/education/social/entertainment categories", () => {
    for (const cat of ["corporate", "education", "social-community", "entertainment"]) {
      const env = resolveEventEnvironment({ eventTypeSlug: "x-unknown", categorySlug: cat });
      expect(env.arrangement).toBe("theatre");
    }
  });

  it("resolves a weddings category (no matching slug) via style", () => {
    const env = resolveEventEnvironment({ eventTypeSlug: "x-unknown", categorySlug: "weddings", styles: ["kerala"] });
    expect(env.displayName.toLowerCase()).toContain("wedding");
  });

  it("falls back to a celebration environment for anything else", () => {
    const env = resolveEventEnvironment({ eventTypeSlug: "totally-unknown", categorySlug: "misc" });
    expect(env.palette.length).toBeGreaterThan(0);
  });

  it("applies theme stage/accent colour overrides when provided", () => {
    const base = resolveEventEnvironment({ eventTypeSlug: "reception" });
    const themed = resolveEventEnvironment({ eventTypeSlug: "reception", themeStageColor: "#123456", themeAccentColor: "#abcdef" });
    // The override colour should appear somewhere in the resolved environment.
    expect(JSON.stringify(themed)).toContain("#123456");
    expect(base).toBeTruthy();
  });

  it("is deterministic for the same input", () => {
    const a = resolveEventEnvironment({ eventTypeSlug: "tamil-wedding", styles: ["tamil"] });
    const b = resolveEventEnvironment({ eventTypeSlug: "tamil-wedding", styles: ["tamil"] });
    expect(a).toEqual(b);
  });
});
