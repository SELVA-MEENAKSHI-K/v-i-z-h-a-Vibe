import { describe, it, expect, afterEach, vi } from "vitest";

// The demo AI provider has been removed. AI now requires a configured live
// provider; otherwise callers must surface a clear setup message. These tests
// verify that gating by manipulating the environment the config reads.

async function freshGetAiProvider() {
  // Re-import with a clean module registry so getServerConfig() re-reads env.
  vi.resetModules();
  const mod = await import("@/lib/ai");
  return mod;
}

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.resetModules();
});

describe("AI provider gating (no demo fallback)", () => {
  it("returns null when AI is not configured", async () => {
    process.env.AI_PROVIDER = "demo";
    process.env.OPENAI_API_KEY = "";
    const { getAiProvider } = await freshGetAiProvider();
    expect(getAiProvider()).toBeNull();
  });

  it("returns null when provider is openai but no key is set", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "";
    const { getAiProvider } = await freshGetAiProvider();
    expect(getAiProvider()).toBeNull();
  });

  it("returns a live provider when openai + key are configured", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test-key-1234567890";
    const { getAiProvider } = await freshGetAiProvider();
    const provider = getAiProvider();
    expect(provider).not.toBeNull();
    expect(provider?.name).toBe("openai");
  });

  it("exposes a clear not-configured message for the UI/API to show", async () => {
    const { AI_NOT_CONFIGURED_MESSAGE } = await freshGetAiProvider();
    expect(AI_NOT_CONFIGURED_MESSAGE).toMatch(/not configured/i);
    expect(AI_NOT_CONFIGURED_MESSAGE).toMatch(/OPENAI_API_KEY/);
  });
});
