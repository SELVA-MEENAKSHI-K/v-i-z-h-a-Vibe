// Small, safe JSON-parsing helpers shared by the plan/venue/vendor services,
// which persist some structured fields as JSON strings (SQLite/Postgres-
// portable). Previously these were duplicated in plans.ts, vendors.ts and
// venues.ts; extracted here so there is one implementation. Pure + testable.

/** Parse a JSON string, returning `fallback` on null/empty/invalid input. */
export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Parse a JSON string expected to be a string array; returns [] otherwise. */
export function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
