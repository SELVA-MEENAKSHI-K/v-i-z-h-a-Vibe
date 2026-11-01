import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import axe from "axe-core";

// --- Mocks shared by the page-level components under test ------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@/lib/client", () => ({
  apiSend: vi.fn(),
  apiGet: vi.fn(),
  formatINR: (n: number) => `₹${n}`,
}));
// GoogleCardButton reads Firebase config; render nothing so axe sees a stable DOM.
vi.mock("@/components/auth/GoogleCardButton", () => ({ GoogleCardButton: () => null }));

import LoginPage from "@/app/login/page";
import SignupPage from "@/app/signup/page";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { CATALOG, CITIES, CULTURAL_STYLES } from "@/data/catalog";

// Run axe against a container and return the violations (serious/critical
// filtered out of colour-contrast noise that jsdom can't compute reliably).
async function violationsFor(node: HTMLElement) {
  const results = await axe.run(node, {
    rules: {
      // jsdom has no layout engine, so axe cannot compute real colour contrast;
      // contrast is verified separately (CSS veil darkening + design tokens).
      "color-contrast": { enabled: false },
      // Page fragments under test aren't full documents in jsdom.
      region: { enabled: false },
    },
  });
  return results.violations;
}

afterEach(() => cleanup());

describe("accessibility (axe-core) — zero violations on key surfaces", () => {
  it("Login page has no a11y violations", async () => {
    const { container } = render(<LoginPage />);
    const v = await violationsFor(container);
    expect(v, JSON.stringify(v.map((x) => x.id))).toHaveLength(0);
  });

  it("Signup page has no a11y violations", async () => {
    const { container } = render(<SignupPage />);
    const v = await violationsFor(container);
    expect(v, JSON.stringify(v.map((x) => x.id))).toHaveLength(0);
  });

  it("SetupWizard (/plan/new content) has no a11y violations", async () => {
    const { container } = render(
      <main>
        <h1 className="sr-only">Start planning</h1>
        <SetupWizard
          catalog={CATALOG}
          cities={[...CITIES]}
          styles={CULTURAL_STYLES.map((s) => ({ slug: s.slug, name: s.name }))}
        />
      </main>,
    );
    const v = await violationsFor(container);
    expect(v, JSON.stringify(v.map((x) => x.id))).toHaveLength(0);
  });
});
