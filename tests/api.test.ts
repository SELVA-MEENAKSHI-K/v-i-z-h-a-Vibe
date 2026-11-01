import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";

// Silence the intentional server-side error logging during these tests.
let errSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  errSpy.mockRestore();
});

async function body(res: Response) {
  return (await res.json()) as { ok: boolean; data?: unknown; error?: { message: string; details?: unknown } };
}

describe("api response helpers", () => {
  it("ok() wraps data with ok:true and default 200", async () => {
    const res = ok({ hello: "world" });
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ ok: true, data: { hello: "world" } });
  });

  it("ok() honours a custom status via init", async () => {
    const res = ok({ id: "1" }, { status: 201 });
    expect(res.status).toBe(201);
  });

  it("fail() uses the given status and message", async () => {
    const res = fail("Nope", 403);
    expect(res.status).toBe(403);
    const b = await body(res);
    expect(b.ok).toBe(false);
    expect(b.error?.message).toBe("Nope");
  });

  it("fail() defaults to 400", async () => {
    const res = fail("Bad");
    expect(res.status).toBe(400);
  });

  describe("handleError", () => {
    it("maps a ZodError to 422 with flattened details", async () => {
      const schema = z.object({ name: z.string().min(1) });
      let caught: unknown;
      try {
        schema.parse({ name: "" });
      } catch (e) {
        caught = e;
      }
      const res = handleError(caught);
      expect(res.status).toBe(422);
      const b = await body(res);
      expect(b.error?.message).toBe("Invalid request.");
      expect(b.error?.details).toBeTruthy();
    });

    it.each([["P1001"], ["P1002"], ["P1017"], ["P1000"]])(
      "maps Prisma connectivity error %s to 503",
      async (code) => {
        const res = handleError({ code });
        expect(res.status).toBe(503);
        const b = await body(res);
        expect(b.error?.message).toMatch(/unable to reach its database/i);
      },
    );

    it("maps PrismaClientInitializationError (by name) to 503", async () => {
      const res = handleError({ name: "PrismaClientInitializationError" });
      expect(res.status).toBe(503);
    });

    it.each([["P2021"], ["P2022"]])("maps missing-table error %s to 503 (not set up)", async (code) => {
      const res = handleError({ code });
      expect(res.status).toBe(503);
      const b = await body(res);
      expect(b.error?.message).toMatch(/not fully set up/i);
    });

    it("maps a unique-constraint violation (P2002) to 409", async () => {
      const res = handleError({ code: "P2002" });
      expect(res.status).toBe(409);
      const b = await body(res);
      expect(b.error?.message).toMatch(/already exists/i);
    });

    it("maps an unknown error to a generic 500 without leaking detail", async () => {
      const res = handleError(new Error("secret db dsn here"));
      expect(res.status).toBe(500);
      const b = await body(res);
      expect(b.error?.message).toBe("Something went wrong. Please try again.");
      expect(JSON.stringify(b)).not.toContain("secret db dsn");
    });

    it("treats a non-object throw as a generic 500", async () => {
      const res = handleError("just a string");
      expect(res.status).toBe(500);
    });
  });
});
