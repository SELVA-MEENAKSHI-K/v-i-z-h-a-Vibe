import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CategoryArt } from "@/components/ui/CategoryArt";
import { CATALOG } from "@/data/catalog";

// Every event category slug must render a (decorative) SVG illustration, and an
// unknown slug must fall back to the generic art rather than crashing.
describe("CategoryArt", () => {
  const slugs = CATALOG.map((c) => c.slug);

  it("renders an SVG for every catalog category slug", () => {
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const { container, unmount } = render(<CategoryArt slug={slug} />);
      const svg = container.querySelector("svg");
      expect(svg, `expected an <svg> for slug "${slug}"`).toBeTruthy();
      // Decorative art is hidden from assistive tech.
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
      unmount();
    }
  });

  it("falls back to generic art for an unknown slug", () => {
    const { container } = render(<CategoryArt slug="not-a-real-slug" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("applies caller className and style to the wrapper", () => {
    const { container } = render(<CategoryArt slug="weddings" className="h-10 w-10" style={{ opacity: 0.5 }} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("h-10", "w-10");
    expect(wrapper.style.opacity).toBe("0.5");
  });
});
