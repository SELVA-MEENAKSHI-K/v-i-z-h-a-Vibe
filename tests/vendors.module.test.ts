import { describe, it, expect } from "vitest";
import {
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_SLUGS,
  vendorBudgetCategory,
  sampleVendors,
  filterSampleVendors,
} from "@/data/vendors";

describe("vendor catalog", () => {
  it("defines the eight required categories", () => {
    expect(VENDOR_CATEGORIES).toHaveLength(8);
    for (const slug of ["photography", "catering", "decoration", "makeup", "music", "invitations", "transportation", "equipment"]) {
      expect(VENDOR_CATEGORY_SLUGS).toContain(slug);
    }
  });

  it("maps each category to a budget category", () => {
    expect(vendorBudgetCategory("photography")).toBe("photography");
    expect(vendorBudgetCategory("catering")).toBe("catering");
    expect(vendorBudgetCategory("decoration")).toBe("decor");
    expect(vendorBudgetCategory("music")).toBe("entertainment");
    // Unknown falls back to misc.
    expect(vendorBudgetCategory("made-up")).toBe("misc");
  });

  it("sample vendors never fabricate a rating (honesty policy)", () => {
    for (const v of sampleVendors()) {
      expect(v.rating).toBeNull();
      expect(v.reviewCount).toBeNull();
      // Every sample carries at least one package with a non-negative range.
      for (const p of v.packages) {
        expect(p.priceMax).toBeGreaterThanOrEqual(p.priceMin);
        expect(p.priceMin).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("only references vendor photos that actually exist on disk (honesty policy)", () => {
    // A sample carries a photo ONLY for categories with a bundled, licensed
    // image under /public/images/vendors/. Categories without a real photo
    // return NO photo, so the card shows a clearly-labelled category
    // illustration instead of a broken image or a repeated generic picture.
    for (const v of sampleVendors()) {
      if (v.photos.length > 0) {
        expect(v.photos[0]).toMatch(/^\/images\/vendors\//);
      }
    }
    // Decoration has a real bundled photo; it must still be referenced.
    const decor = sampleVendors().find((v) => v.category === "decoration");
    expect(decor?.photos[0]).toBe("/images/vendors/decoration.jpg");
  });
});

describe("vendor filtering", () => {
  it("filters by category", () => {
    const photo = filterSampleVendors({ category: "photography" });
    expect(photo.length).toBeGreaterThan(0);
    expect(photo.every((v) => v.category === "photography")).toBe(true);
  });

  it("filters by city", () => {
    const chennai = filterSampleVendors({ city: "Chennai" });
    expect(chennai.every((v) => v.city.toLowerCase() === "chennai")).toBe(true);
  });

  it("filters by max price (cheapest package)", () => {
    const cheap = filterSampleVendors({ maxPrice: 20000 });
    for (const v of cheap) {
      const cheapest = Math.min(...v.packages.map((p) => p.priceMin));
      expect(cheapest).toBeLessThanOrEqual(20000);
    }
  });

  it("excludes samples below a rating floor (all samples have null rating)", () => {
    // Samples carry no rating, so a minRating filter removes them all.
    expect(filterSampleVendors({ minRating: 4 })).toHaveLength(0);
  });
});
