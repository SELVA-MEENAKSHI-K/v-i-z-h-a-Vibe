import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Zero-empty-images policy: every category fallback asset referenced by
// SmartImage MUST exist on disk, so an image area can always resolve to a
// real local file (before the final CSS placeholder).
const FALLBACKS = [
  "food-fallback.svg",
  "venue-fallback.svg",
  "shop-fallback.svg",
  "decoration-fallback.svg",
  "event-fallback.svg",
  "three-d-preview-fallback.svg",
  "generic-fallback.svg",
];

describe("fallback image assets", () => {
  for (const file of FALLBACKS) {
    it(`exists: public/images/fallbacks/${file}`, () => {
      const p = resolve(process.cwd(), "public/images/fallbacks", file);
      expect(existsSync(p)).toBe(true);
    });
  }
});
