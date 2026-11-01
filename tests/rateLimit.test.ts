import { describe, it, expect } from "vitest";
import { rateLimit, clientIp } from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("allows requests up to the limit then blocks", () => {
    const key = `test-${Math.random()}`;
    const limit = 3;
    const r1 = rateLimit(key, limit);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit(key, limit);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit(key, limit);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    const r4 = rateLimit(key, limit);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetAt).toBe(r1.resetAt);
  });

  it("keeps separate buckets per key", () => {
    const a = rateLimit(`a-${Math.random()}`, 1);
    const b = rateLimit(`b-${Math.random()}`, 1);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(clientIp(h)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(clientIp(h)).toBe("198.51.100.7");
  });

  it("defaults to 'local' when no IP headers are present", () => {
    expect(clientIp(new Headers())).toBe("local");
  });
});
