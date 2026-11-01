// Pure helpers and constants for the event-setup wizard. Extracted from
// SetupWizard.tsx so the number-formatting, budget-slider mapping and date
// description logic can be unit-tested in isolation. These are pure functions
// (no React, no side effects); behaviour is unchanged from the original inline
// versions.

/** Dietary toggle options shown on the Style step (key + emoji icon). */
export const DIETARY: { key: string; icon: string }[] = [
  { key: "veg", icon: "🥬" },
  { key: "non-veg", icon: "🍗" },
  { key: "both", icon: "🍽️" },
  { key: "jain", icon: "🌿" },
  { key: "vegan", icon: "🌱" },
];

/** The three wizard steps (label + hint shown under the stepper). */
export const STEPS = [
  { label: "Event", hint: "What are we celebrating?" },
  { label: "Details", hint: "When, where, how big?" },
  { label: "Style", hint: "Make it yours" },
];

/** Quick-pick chips for guest count and budget. */
export const GUEST_PRESETS = [50, 100, 200, 500, 1000];
export const BUDGET_PRESETS = [100000, 300000, 500000, 1000000, 2500000];

/** Budget slider bounds (INR). The slider is logarithmic between these. */
export const BUDGET_MIN = 50000;
export const BUDGET_MAX = 10000000;

const ONE_CRORE = 10000000;
const ONE_LAKH = 100000;

/** Format a rupee amount compactly (₹X, ₹X.Y L, ₹X.Y Cr). */
export function inr(n: number): string {
  if (!Number.isFinite(n)) return "₹0";
  if (n >= ONE_CRORE) return `₹${(n / ONE_CRORE).toFixed(n % ONE_CRORE === 0 ? 0 : 1)} Cr`;
  if (n >= ONE_LAKH) return `₹${(n / ONE_LAKH).toFixed(n % ONE_LAKH === 0 ? 0 : 1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Map an INR budget to the 0..1000 logarithmic slider position. */
export function budgetToPos(v: number): number {
  const c = Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, v || BUDGET_MIN));
  return Math.round((Math.log(c / BUDGET_MIN) / Math.log(BUDGET_MAX / BUDGET_MIN)) * 1000);
}

/** Map a 0..1000 slider position back to a rounded INR budget. */
export function posToBudget(p: number): number {
  const raw = BUDGET_MIN * Math.pow(BUDGET_MAX / BUDGET_MIN, p / 1000);
  const step = raw >= 1000000 ? 50000 : raw >= 200000 ? 10000 : 5000;
  return Math.round(raw / step) * step;
}

/** Local (not UTC) ISO date string (YYYY-MM-DD) for a `<input type="date">`. */
export function isoLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export type DateInfo = { text: string; rel: string; past: boolean };

/** Describe a date input: a friendly label, a relative phrase, and past flag. */
export function describeDate(iso: string): DateInfo | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  const text = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const rel = days === 0 ? "today" : days > 0 ? `in ${days} day${days === 1 ? "" : "s"}` : `${-days} day${days === -1 ? "" : "s"} ago`;
  return { text, rel, past: days < 0 };
}

export type BudgetFeel = { label: string; tone: string; pct: number };

/** Qualitative "feel" of a per-guest budget (drives the little meter). */
export function feel(perGuest: number): BudgetFeel {
  if (perGuest < 600) return { label: "Tight", tone: "text-red-300", pct: 18 };
  if (perGuest < 1500) return { label: "Balanced", tone: "text-marigold-400", pct: 45 };
  if (perGuest < 3000) return { label: "Comfortable", tone: "text-peacock-400", pct: 72 };
  return { label: "Premium", tone: "text-saffron-400", pct: 100 };
}
