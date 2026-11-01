import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AiContext } from "@/lib/ai/types";

// Mock the server config so the provider has a key/base URL without real env.
vi.mock("@/lib/config", () => ({
  getServerConfig: () => ({
    openaiBaseUrl: "https://api.example.test/v1",
    openaiKey: "test-key",
    openaiModel: "test-model",
  }),
}));

import { OpenAiProvider } from "@/lib/ai/openaiProvider";

const ctx: AiContext = { city: "Madurai", guestCount: 150 };

// Spy on global fetch and return a fake OpenAI-compatible chat response.
function makeFetchSpy(content: string, ok = true, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    status,
    json: async () => ({ choices: [{ message: { content } }] }),
    text: async () => content,
  } as Response);
}

// Hold the active fetch spy so each test can restore it. Typed from the helper's
// return to avoid the fetch-overload mismatch a generic annotation would add.
let fetchSpy: ReturnType<typeof makeFetchSpy>;

afterEach(() => {
  fetchSpy?.mockRestore();
});

describe("OpenAiProvider.recommend (JSON parsing + provenance)", () => {
  beforeEach(() => {
    const payload = JSON.stringify({ themes: [{ title: "Royal Tamil", palette: ["#aa0000"], summary: "x", decorHighlights: [], representableIn3D: [] }] });
    fetchSpy = makeFetchSpy(payload);
  });

  it("parses the model JSON and FORCES correct provenance (kind/provider/generated)", async () => {
    const provider = new OpenAiProvider();
    const result = await provider.recommend("theme", ctx);
    expect(result.kind).toBe("theme");
    expect(result.provider).toBe("openai");
    expect(result.generated).toBe(true);
    // Payload data is preserved.
    expect(result.kind === "theme" && result.themes[0].title).toBe("Royal Tamil");
  });

  it("requests JSON mode and sends the API key as a bearer token", async () => {
    const provider = new OpenAiProvider();
    await provider.recommend("menu", ctx);
    const call = fetchSpy.mock.calls[0];
    const init = call?.[1] as RequestInit;
    expect(String((init.headers as Record<string, string>).Authorization)).toContain("Bearer test-key");
    expect(String(init.body)).toContain("response_format");
  });
});

describe("OpenAiProvider error handling (no fabricated fallback)", () => {
  it("throws on invalid JSON rather than returning fake data", async () => {
    fetchSpy = makeFetchSpy("not json");
    const provider = new OpenAiProvider();
    await expect(provider.recommend("theme", ctx)).rejects.toThrow();
  });

  it("propagates a non-OK provider response as an error", async () => {
    fetchSpy = makeFetchSpy("rate limited", false, 429);
    const provider = new OpenAiProvider();
    await expect(provider.recommend("theme", ctx)).rejects.toThrow(/429/);
  });
});

describe("OpenAiProvider.chat", () => {
  it("returns the model text for a valid response", async () => {
    fetchSpy = makeFetchSpy("Here is a helpful reply.");
    const provider = new OpenAiProvider();
    const reply = await provider.chat("Suggest a theme", ctx, [{ role: "user", content: "hi" }]);
    expect(reply).toBe("Here is a helpful reply.");
  });

  it("throws when the model returns an empty response", async () => {
    fetchSpy = makeFetchSpy("");
    const provider = new OpenAiProvider();
    await expect(provider.chat("hi", ctx)).rejects.toThrow(/empty/i);
  });
});
