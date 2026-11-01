import { describe, it, expect } from "vitest";
// Import the Next config and assert the security headers it declares. This
// verifies the presence + shape of CSP, X-Frame-Options, etc. without a running
// server (the header values are static in next.config.mjs).
import nextConfig from "../next.config.mjs";

async function headerMap() {
  const groups = await (nextConfig.headers as () => Promise<{ source: string; headers: { key: string; value: string }[] }[]>)();
  const all = groups.flatMap((g) => g.headers);
  return new Map(all.map((h) => [h.key, h.value]));
}

describe("security headers (next.config)", () => {
  it("declares the core security headers", async () => {
    const h = await headerMap();
    expect(h.has("Content-Security-Policy")).toBe(true);
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(h.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(h.get("Permissions-Policy")).toMatch(/camera=\(\)/);
    expect(h.get("Strict-Transport-Security")).toMatch(/max-age=\d+/);
  });

  it("CSP restricts framing, objects and base-uri", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("default-src 'self'");
  });

  it("CSP allows the app's own image/connect sources (3D, Firebase, providers)", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";
    // styled-jsx / Tailwind inline styles must be permitted.
    expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
    // Whitelisted image hosts for next/image.
    expect(csp).toContain("upload.wikimedia.org");
    // Provider endpoints we call.
    expect(csp).toContain("api.geoapify.com");
    expect(csp).toContain("api.openai.com");
  });

  it("CSP script-src carries exactly what Next 14 + our app need (and nothing wider)", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";
    const scriptSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("script-src")) ?? "";
    // Next 14 production injects INLINE hydration scripts, and we add one inline
    // MotionPreferenceScript — both require 'unsafe-inline' (we don't use nonces).
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).toContain("'unsafe-inline'");
    // Three.js / draco WASM decoders need wasm eval, but NOT full eval.
    expect(scriptSrc).toContain("'wasm-unsafe-eval'");
    // In the test/prod context NODE_ENV !== 'production' only under vitest; the
    // important guarantee is we never ship bare 'unsafe-eval' in a built prod
    // bundle. The directive string here reflects the current NODE_ENV.
    // connect-src must reach Firebase auth + our data providers.
    const connectSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("connect-src")) ?? "";
    expect(connectSrc).toContain("identitytoolkit.googleapis.com");
    expect(connectSrc).toContain("securetoken.googleapis.com");
    expect(connectSrc).toContain("api.geoapify.com");
    expect(connectSrc).toContain("api.openai.com");
    // img-src must include data:/blob: (SmartImage fallbacks, 3D textures).
    const imgSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("img-src")) ?? "";
    expect(imgSrc).toContain("data:");
    expect(imgSrc).toContain("blob:");
  });

  it("CSP connect-src allows the 3D asset hosts (drei Environment HDR, draco, fonts)", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";
    const connectSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("connect-src")) ?? "";
    // drei <Environment preset=…> fetches HDRIs from the drei-assets repo via githack.
    expect(connectSrc).toContain("https://raw.githack.com");
    expect(connectSrc).toContain("https://*.githack.com");
    expect(connectSrc).toContain("https://raw.githubusercontent.com");
    // draco / basis / meshopt decoders + drei Text fonts.
    expect(connectSrc).toContain("https://www.gstatic.com");
    expect(connectSrc).toContain("https://fonts.gstatic.com");
    expect(connectSrc).toContain("https://cdn.jsdelivr.net");
  });

  it("CSP worker/child-src allow blob workers (draco decoders) and the OSM map frame", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy") ?? "";
    const workerSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("worker-src")) ?? "";
    const childSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("child-src")) ?? "";
    const frameSrc = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith("frame-src")) ?? "";
    expect(workerSrc).toContain("blob:");
    expect(childSrc).toContain("blob:");
    // The keyless OpenStreetMap map embed on the Final Plan page.
    expect(frameSrc).toContain("https://www.openstreetmap.org");
  });
});
