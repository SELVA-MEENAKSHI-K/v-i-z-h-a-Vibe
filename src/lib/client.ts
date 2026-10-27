// Tiny typed fetch wrapper for the client. Unwraps the { ok, data } envelope.

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json?.error?.message || `Request failed (${res.status})`);
  return json.data as T;
}

export async function apiSend<T>(url: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json?.error?.message || `Request failed (${res.status})`);
  return json.data as T;
}

export function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
