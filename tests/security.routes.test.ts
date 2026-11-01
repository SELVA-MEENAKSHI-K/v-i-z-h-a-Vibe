import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthError } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Route-level security: ownership (403), not-found (404), validation (422),
// and rate limiting (429). We mock the data/auth layers so these assert the
// HANDLER's control flow, not the database.
// ---------------------------------------------------------------------------

// Shared mock state.
const state = {
  plan: null as null | { id: string; ownerId: string | null },
  accessError: null as null | AuthError,
  rateAllowed: true,
};

vi.mock("@/lib/plans", () => ({
  getPlanByIdOrToken: vi.fn(async () => state.plan),
  serializePlan: vi.fn(async () => (state.plan ? { id: state.plan.id, title: "T" } : null)),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    assertCanAccessPlan: vi.fn(async () => {
      if (state.accessError) throw state.accessError;
    }),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(() => ({ allowed: state.rateAllowed, remaining: 0, resetAt: Date.now() + 60000 })),
  clientIp: vi.fn(() => "test-ip"),
}));

// AI chat also needs config + provider; keep the provider unconfigured so we
// exercise the 429 branch BEFORE provider logic.
vi.mock("@/lib/config", () => ({
  getServerConfig: () => ({ rateLimitPerMinute: 30, openaiBaseUrl: "x", openaiKey: "", openaiModel: "m", aiLive: false, aiProvider: "none" }),
}));

import { GET as getPlan, PATCH as patchPlan } from "@/app/api/plans/[id]/route";
import { POST as aiChat } from "@/app/api/ai/chat/route";

function req(body?: unknown) {
  return new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  state.plan = null;
  state.accessError = null;
  state.rateAllowed = true;
  vi.clearAllMocks();
});

describe("plan route — ownership & not-found", () => {
  it("returns 404 when the plan does not exist", async () => {
    state.plan = null;
    const res = await getPlan(req(), { params: { id: "missing" } });
    expect(res.status).toBe(404);
  });

  it("returns 403 when the plan belongs to someone else (IDOR guard)", async () => {
    state.plan = { id: "p1", ownerId: "someone-else" };
    state.accessError = new AuthError("You don't have access to this plan.", 403);
    const res = await getPlan(req(), { params: { id: "p1" } });
    expect(res.status).toBe(403);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(false);
  });

  it("returns 401 when authentication is required", async () => {
    state.plan = { id: "p1", ownerId: "owner" };
    state.accessError = new AuthError("Authentication required.", 401);
    const res = await getPlan(req(), { params: { id: "p1" } });
    expect(res.status).toBe(401);
  });

  it("returns the plan (200) when access is allowed", async () => {
    state.plan = { id: "p1", ownerId: "owner" };
    const res = await getPlan(req(), { params: { id: "p1" } });
    expect(res.status).toBe(200);
  });

  it("returns 422 on invalid PATCH input", async () => {
    state.plan = { id: "p1", ownerId: "owner" };
    // guestCount must be an int >= 1; -5 fails the schema.
    const res = await patchPlan(req({ guestCount: -5 }), { params: { id: "p1" } });
    expect(res.status).toBe(422);
  });
});

describe("AI chat route — rate limiting", () => {
  it("returns 429 when the per-IP limit is exceeded", async () => {
    state.rateAllowed = false;
    const res = await aiChat(req({ message: "hi" }));
    expect(res.status).toBe(429);
  });
});
