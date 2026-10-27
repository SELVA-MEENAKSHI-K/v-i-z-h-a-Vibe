// Minimal in-memory per-IP rate limiter for AI and search endpoints.
// Sufficient for a single-instance demo. For multi-instance production use a
// shared store (Redis / Upstash) instead.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limitPerMinute: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 60_000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limitPerMinute - 1), resetAt };
  }

  if (existing.count >= limitPerMinute) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limitPerMinute - existing.count), resetAt: existing.resetAt };
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "local";
}
