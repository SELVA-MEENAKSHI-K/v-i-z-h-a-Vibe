import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { THEMES, filterThemes, themeBySlug } from "@/data/themes";

describe("theme catalog", () => {
  it("has 30+ themes across all three categories", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(30);
    const cats = new Set(THEMES.map((t) => t.category));
    expect(cats.has("wedding")).toBe(true);
    expect(cats.has("decoration")).toBe(true);
    expect(cats.has("event")).toBe(true);
  });

  it("has unique slugs", () => {
    const slugs = THEMES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every theme has a non-empty local image path and a palette", () => {
    for (const t of THEMES) {
      expect(t.image, `${t.slug} image`).toBeTruthy();
      expect(t.image!.startsWith("/images/themes/")).toBe(true);
      expect(t.palette.length).toBeGreaterThan(0);
      expect(t.decorBudgetMax).toBeGreaterThanOrEqual(t.decorBudgetMin);
    }
  });

  it("every referenced theme image file actually exists on disk", () => {
    for (const t of THEMES) {
      const p = resolve(process.cwd(), "public", t.image!.replace(/^\//, ""));
      expect(existsSync(p), `${t.slug} -> ${t.image}`).toBe(true);
    }
  });

  it("filters by category, region and budget", () => {
    expect(filterThemes({ category: "wedding" }).every((t) => t.category === "wedding")).toBe(true);
    expect(filterThemes({ region: "tamil" }).every((t) => t.region === "tamil")).toBe(true);
    expect(filterThemes({ budget: "luxury" }).every((t) => t.budgetTier === "luxury")).toBe(true);
  });

  it("search matches theme name/decor", () => {
    const r = filterThemes({ search: "jasmine" });
    expect(r.length).toBeGreaterThan(0);
  });

  it("resolves a theme by slug", () => {
    expect(themeBySlug("tamil-traditional-wedding")?.name).toBe("Traditional Tamil Wedding");
    expect(themeBySlug("nope")).toBeUndefined();
  });
});
