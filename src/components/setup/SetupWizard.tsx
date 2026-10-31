"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EventCategoryDef } from "@/data/catalog";
import { apiSend } from "@/lib/client";
import { CategoryArt } from "@/components/ui/CategoryArt";

type Props = {
  catalog: EventCategoryDef[];
  cities: string[];
  styles: { slug: string; name: string }[];
};

const DIETARY: { key: string; icon: string }[] = [
  { key: "veg", icon: "🥬" },
  { key: "non-veg", icon: "🍗" },
  { key: "both", icon: "🍽️" },
  { key: "jain", icon: "🌿" },
  { key: "vegan", icon: "🌱" },
];

const STEPS = [
  { label: "Event", hint: "What are we celebrating?" },
  { label: "Details", hint: "When, where, how big?" },
  { label: "Style", hint: "Make it yours" },
];

const GUEST_PRESETS = [50, 100, 200, 500, 1000];
const BUDGET_PRESETS = [100000, 300000, 500000, 1000000, 2500000];
const BUDGET_MIN = 50000;
const BUDGET_MAX = 10000000;

/* ---------- helpers ---------- */
function inr(n: number) {
  if (!Number.isFinite(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function budgetToPos(v: number) {
  const c = Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, v || BUDGET_MIN));
  return Math.round((Math.log(c / BUDGET_MIN) / Math.log(BUDGET_MAX / BUDGET_MIN)) * 1000);
}

function posToBudget(p: number) {
  const raw = BUDGET_MIN * Math.pow(BUDGET_MAX / BUDGET_MIN, p / 1000);
  const step = raw >= 1000000 ? 50000 : raw >= 200000 ? 10000 : 5000;
  return Math.round(raw / step) * step;
}

function isoLocal(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function describeDate(iso: string) {
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

function feel(perGuest: number) {
  if (perGuest < 600) return { label: "Tight", tone: "text-red-300", pct: 18 };
  if (perGuest < 1500) return { label: "Balanced", tone: "text-marigold-400", pct: 45 };
  if (perGuest < 3000) return { label: "Comfortable", tone: "text-peacock-400", pct: 72 };
  return { label: "Premium", tone: "text-saffron-400", pct: 100 };
}

/* ---------- component ---------- */
export function SetupWizard({ catalog, cities, styles }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const initialCategory = params.get("category") || catalog[0].slug;

  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [eventTypeSlug, setEventTypeSlug] = useState("");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState(cities[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestCount, setGuestCount] = useState(150);
  const [budget, setBudget] = useState(500000);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>(["veg"]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTick, setErrorTick] = useState(0);
  // Per-field validation messages (shown below each field). KEPT from original.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const category = useMemo(() => catalog.find((c) => c.slug === categorySlug) ?? catalog[0], [catalog, categorySlug]);
  const eventType = category.eventTypes.find((t) => t.slug === eventTypeSlug);

  const guests = Math.max(0, Number(guestCount) || 0);
  const perGuest = guests > 0 ? Math.round(Number(budget) / guests) : 0;
  const money = feel(perGuest);
  const dateInfo = describeDate(startDate);
  const styleNames = selectedStyles.map((s) => styles.find((x) => x.slug === s)?.name ?? s);
  const readiness = [eventTypeSlug, title.trim(), startDate, selectedStyles.length ? "y" : "", dietary.length ? "y" : ""].filter(Boolean).length;

  // Validate the Details step. Required: title, city, guestCount(>0),
  // startDate(not past), budget(>0). End date / notes / styles are optional.
  // KEPT exactly from the original logic (messages unchanged).
  function validateDetails(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Event title is required.";
    if (!city.trim()) errs.city = "Please select a city.";
    if (!Number.isFinite(guestCount) || guestCount <= 0) errs.guestCount = "Guest count must be a positive number.";
    if (!startDate) {
      errs.startDate = "Event date is required.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(startDate);
      if (d < today) errs.startDate = "Event date cannot be in the past.";
    }
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = "End date can't be before the start date.";
    }
    if (!Number.isFinite(budget) || budget <= 0) errs.budget = "Budget must be greater than zero.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function fail(msg: string) {
    setError(msg);
    setErrorTick((t) => t + 1);
  }

  function go(to: number) {
    setStep(to);
    setMaxStep((m) => Math.max(m, to));
  }

  function next() {
    setError(null);
    if (step === 0 && !eventTypeSlug) {
      fail("Please choose an event type to continue.");
      return;
    }
    if (step === 1 && !validateDetails()) {
      fail("Please fix the highlighted required fields.");
      return;
    }
    go(Math.min(2, step + 1));
  }

  function jump(i: number) {
    if (i === step) return;
    if (i > step) {
      // forward only through the same checks as "Continue"
      if (i > maxStep) return;
      if (step === 0 && !eventTypeSlug) {
        fail("Please choose an event type to continue.");
        return;
      }
      if (step <= 1 && i === 2 && !validateDetails()) {
        fail("Please fix the highlighted required fields.");
        return;
      }
    }
    setError(null);
    setStep(i);
  }

  function pickEventType(t: (typeof category.eventTypes)[number]) {
    setEventTypeSlug(t.slug);
    if (!title) setTitle(t.name);
    if (t.defaultStyles?.length) setSelectedStyles(t.defaultStyles);
    setError(null);
  }

  function quickDate(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setStartDate(isoLocal(d));
  }

  async function submit() {
    setError(null);
    // Re-validate required details before creating the plan. KEPT from original.
    if (!validateDetails()) {
      setStep(1);
      fail("Please complete the required event details.");
      return;
    }
    setSubmitting(true);
    try {
      const plan = await apiSend<{ shareToken: string }>("/api/plans", "POST", {
        title: title.trim(),
        city,
        eventTypeSlug,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : startDate ? new Date(startDate).toISOString() : null,
        guestCount: Number(guestCount),
        budget: Number(budget),
        styles: selectedStyles,
        preferences: { dietary, notes },
      });
      router.push(`/plan/${plan.shareToken}`);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Could not create the plan.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ================= wizard ================= */}
      <div className="vv-wiz-card rounded-3xl p-5 sm:p-7">
        {/* progress */}
        <div className="mb-7">
          <ol className="relative flex items-start justify-between">
            <span className="absolute left-[16%] right-[16%] top-4 h-0.5 rounded bg-white/10" aria-hidden="true" />
            <span
              className="absolute left-[16%] top-4 h-0.5 rounded bg-gradient-to-r from-saffron-500 to-marigold-400 transition-all duration-500"
              style={{ width: `${(step / 2) * 68}%` }}
              aria-hidden="true"
            />
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const reachable = i <= maxStep;
              return (
                <li key={s.label} className="relative z-10 flex w-1/3 flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    disabled={!reachable}
                    aria-current={active ? "step" : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      active
                        ? "scale-110 bg-saffron-500 text-ink-900 shadow-[0_0_0_6px_rgba(255,158,44,0.22)]"
                        : done
                          ? "bg-marigold-400 text-ink-900"
                          : "bg-ink-700 text-white/50 ring-1 ring-white/10"
                    } ${reachable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </button>
                  <span className={`mt-2 text-sm font-semibold ${active ? "text-white" : "text-white/55"}`}>{s.label}</span>
                  <span className="hidden text-[11px] text-white/40 sm:block">{s.hint}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* mobile summary strip */}
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70 lg:hidden">
          <span className="font-semibold text-white">{title.trim() || eventType?.name || "Your event"}</span>
          <span>{city}</span>
          <span>{guests} guests</span>
          <span>{inr(Number(budget))}</span>
        </div>

        {error && (
          <div key={errorTick} role="alert" className="vv-shake mb-4 flex items-center gap-2 rounded-xl border border-kumkum-500/40 bg-kumkum-500/10 px-4 py-2.5 text-sm text-red-200">
            <span aria-hidden="true">⚠️</span>
            {error}
          </div>
        )}

        <div key={step} className="vv-step">
          {/* ---------- step 1: event ---------- */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold">Pick a category</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {catalog.map((c) => {
                  const on = c.slug === categorySlug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        setCategorySlug(c.slug);
                        setEventTypeSlug("");
                        setError(null);
                      }}
                      aria-pressed={on}
                      className={`group relative overflow-hidden rounded-2xl border text-left transition duration-300 ${
                        on ? "border-saffron-500 shadow-glow" : "border-white/10 hover:-translate-y-0.5 hover:border-white/30"
                      }`}
                    >
                      <div className="aspect-[5/3] w-full overflow-hidden">
                        <CategoryArt slug={c.slug} className={`h-full w-full transition duration-500 ${on ? "scale-105" : "group-hover:scale-105"}`} />
                      </div>
                      <div className={`flex items-center justify-between gap-1 px-2.5 py-2 text-xs font-semibold ${on ? "bg-saffron-500 text-ink-900" : "bg-ink-700/80 text-white/85"}`}>
                        <span className="truncate">
                          {c.icon} {c.name}
                        </span>
                        {on && <span aria-hidden="true">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <h2 className="mt-7 flex items-baseline gap-2 text-lg font-semibold">
                What kind of {category.name.toLowerCase()} event?
                <span className="text-xs font-normal text-white/45">{category.eventTypes.length} options</span>
              </h2>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {category.eventTypes.map((t, i) => {
                  const on = t.slug === eventTypeSlug;
                  return (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => pickEventType(t)}
                      onDoubleClick={() => {
                        pickEventType(t);
                        go(1);
                      }}
                      aria-pressed={on}
                      style={{ animationDelay: `${i * 35}ms` }}
                      className={`vv-rise relative rounded-xl border p-3.5 text-left transition duration-200 ${
                        on ? "vv-pop border-saffron-500 bg-saffron-500/15" : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.07]"
                      }`}
                    >
                      <span
                        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold transition ${
                          on ? "bg-saffron-500 text-ink-900" : "bg-white/10 text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <div className="pr-7 font-semibold">{t.name}</div>
                      <div className="mt-1 text-xs leading-relaxed text-white/55">{t.description}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-white/40">Tip: double-click an event type to jump straight to the next step.</p>
            </div>
          )}

          {/* ---------- step 2: details ---------- */}
          {step === 1 && (
            <div className="grid gap-6">
              <Field label="Plan title" required error={fieldErrors.title}>
                <input
                  className={`vv-input vv-input-lg ${fieldErrors.title ? "border-kumkum-500" : ""}`}
                  value={title}
                  autoFocus
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  placeholder="e.g. Meena & Arun — Reception"
                  maxLength={80}
                  aria-invalid={!!fieldErrors.title}
                />
              </Field>

              <div>
                <span className="mb-2 block text-sm font-medium text-white/80">City</span>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      aria-pressed={c === city}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        c === city ? "vv-pop bg-saffron-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      📍 {c}
                    </button>
                  ))}
                </div>
                {fieldErrors.city && (
                  <span role="alert" className="mt-1 block text-xs text-red-300">
                    {fieldErrors.city}
                  </span>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-sm font-medium text-white/80">Guests</span>
                  <input
                    type="number"
                    min={1}
                    aria-label="Guest count"
                    className={`vv-input text-right ${fieldErrors.guestCount ? "border-kumkum-500" : ""}`}
                    style={{ width: "7rem" }}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    aria-invalid={!!fieldErrors.guestCount}
                  />
                </div>
                <input
                  type="range"
                  min={10}
                  max={1500}
                  step={10}
                  aria-label="Guest count slider"
                  value={Math.min(1500, Math.max(10, guests))}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="vv-range"
                  style={{ ["--p" as string]: `${((Math.min(1500, Math.max(10, guests)) - 10) / 1490) * 100}%` }}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {GUEST_PRESETS.map((g) => (
                    <button key={g} type="button" onClick={() => setGuestCount(g)} className={`vv-mini ${guests === g ? "vv-mini-on" : ""}`}>
                      {g}
                    </button>
                  ))}
                </div>
                {fieldErrors.guestCount && (
                  <span role="alert" className="mt-1 block text-xs text-red-300">
                    {fieldErrors.guestCount}
                  </span>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-sm font-medium text-white/80">Budget</span>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-lg font-semibold text-saffron-400">{inr(Number(budget))}</span>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      aria-label="Budget in rupees"
                      className={`vv-input text-right ${fieldErrors.budget ? "border-kumkum-500" : ""}`}
                      style={{ width: "8.5rem" }}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      aria-invalid={!!fieldErrors.budget}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  aria-label="Budget slider"
                  value={budgetToPos(Number(budget))}
                  onChange={(e) => setBudget(posToBudget(Number(e.target.value)))}
                  className="vv-range"
                  style={{ ["--p" as string]: `${budgetToPos(Number(budget)) / 10}%` }}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BUDGET_PRESETS.map((b) => (
                    <button key={b} type="button" onClick={() => setBudget(b)} className={`vv-mini ${Number(budget) === b ? "vv-mini-on" : ""}`}>
                      {inr(b)}
                    </button>
                  ))}
                </div>
                {guests > 0 && (
                  <div className="mt-3 rounded-xl bg-white/[0.05] p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">
                        About <b className="text-white">₹{perGuest.toLocaleString("en-IN")}</b> per guest
                      </span>
                      <span className={`font-semibold ${money.tone}`}>{money.label}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-kumkum-500 via-marigold-400 to-peacock-400 transition-all duration-500" style={{ width: `${money.pct}%` }} />
                    </div>
                  </div>
                )}
                {fieldErrors.budget && (
                  <span role="alert" className="mt-1 block text-xs text-red-300">
                    {fieldErrors.budget}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date" required error={fieldErrors.startDate}>
                  <input
                    type="date"
                    className={`vv-input ${fieldErrors.startDate ? "border-kumkum-500" : ""}`}
                    value={startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-invalid={!!fieldErrors.startDate}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {([
                      ["1 month", 1],
                      ["3 months", 3],
                      ["6 months", 6],
                      ["1 year", 12],
                    ] as [string, number][]).map(([l, m]) => (
                      <button key={l} type="button" onClick={() => quickDate(m)} className="vv-mini">
                        {l}
                      </button>
                    ))}
                  </div>
                  {dateInfo && (
                    <p className={`mt-2 text-xs ${dateInfo.past ? "text-red-300" : "text-white/60"}`}>
                      📅 {dateInfo.text} · <b>{dateInfo.rel}</b>
                    </p>
                  )}
                </Field>
                <Field label="End date" error={fieldErrors.endDate}>
                  <input
                    type="date"
                    className={`vv-input ${fieldErrors.endDate ? "border-kumkum-500" : ""}`}
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ---------- step 3: style ---------- */}
          {step === 2 && (
            <div className="grid gap-6">
              <div>
                <h2 className="text-lg font-semibold">Cultural style(s)</h2>
                <p className="mb-3 mt-1 text-xs text-white/50">Optional. Combine styles or leave blank — we won&apos;t assume your customs.</p>
                <div className="flex flex-wrap gap-2">
                  {styles.map((s) => {
                    const on = selectedStyles.includes(s.slug);
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        onClick={() => toggle(selectedStyles, s.slug, setSelectedStyles)}
                        aria-pressed={on}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                          on ? "vv-pop bg-peacock-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {on && <span aria-hidden="true">✓</span>}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-lg font-semibold">Dietary preference</h2>
                <div className="flex flex-wrap gap-2">
                  {DIETARY.map((d) => {
                    const on = dietary.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggle(dietary, d.key, setDietary)}
                        aria-pressed={on}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                          on ? "vv-pop bg-marigold-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <span aria-hidden="true">{d.icon}</span>
                        {d.key}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="Notes / preferences (optional)">
                <textarea
                  className="vv-input min-h-[100px]"
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Accessibility needs, timing, must-haves…"
                />
                <span className="mt-1 block text-right text-[11px] text-white/35">{notes.length}/500</span>
              </Field>

              <div className="rounded-2xl border border-saffron-500/25 bg-saffron-500/[0.07] p-4 text-sm">
                <div className="font-semibold text-saffron-400">Ready to go</div>
                <p className="mt-1 text-white/75">
                  {eventType?.name || "Event"} in {city} · {guestCount} guests · budget ₹{Number(budget).toLocaleString("en-IN")}
                  {selectedStyles.length ? ` · ${styleNames.join(", ")}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* footer buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0}
            className="rounded-xl px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-30"
          >
            ← Back
          </button>
          {step < 2 ? (
            <button type="button" onClick={next} className="vv-shine rounded-xl bg-saffron-500 px-7 py-2.5 font-semibold text-ink-900 shadow-glow transition hover:-translate-y-0.5 hover:bg-saffron-400">
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="vv-shine inline-flex items-center gap-2 rounded-xl bg-saffron-500 px-7 py-2.5 font-semibold text-ink-900 shadow-glow transition hover:-translate-y-0.5 hover:bg-saffron-400 disabled:opacity-70"
            >
              {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900" aria-hidden="true" />}
              {submitting ? "Creating…" : "Create plan & open 3D planner"}
            </button>
          )}
        </div>
      </div>

      {/* ================= live preview ================= */}
      <aside className="hidden lg:block" aria-label="Live preview of your event">
        <div className="vv-wiz-card sticky top-24 overflow-hidden rounded-3xl">
          <div className="relative aspect-[5/3] w-full overflow-hidden">
            <div key={categorySlug} className="vv-fade h-full w-full">
              <CategoryArt slug={categorySlug} className="h-full w-full" />
            </div>
            <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
              Live preview
            </span>
          </div>
          <div className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-saffron-400">{eventType?.name || category.name}</p>
            <h3 key={title} className="vv-pop mt-1 font-display text-2xl font-semibold leading-tight">
              {title.trim() || <span className="text-white/30">Your event title</span>}
            </h3>
            <dl className="mt-4 grid gap-2.5 text-sm">
              <Row icon="📍" label="City" value={city} />
              <Row icon="📅" label="Date" value={dateInfo ? `${dateInfo.text}` : "Not set"} muted={!dateInfo} extra={dateInfo?.rel} />
              <Row icon="👥" label="Guests" value={guests ? String(guests) : "—"} />
              <Row icon="💰" label="Budget" value={inr(Number(budget))} extra={guests ? `₹${perGuest.toLocaleString("en-IN")}/guest` : undefined} />
              <Row icon="🎨" label="Style" value={styleNames.length ? styleNames.join(", ") : "Open"} muted={!styleNames.length} />
              <Row icon="🍽️" label="Food" value={dietary.length ? dietary.join(", ") : "Not set"} muted={!dietary.length} />
            </dl>
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/55">
                <span>Plan details</span>
                <span className="font-semibold text-white/80">{readiness}/5</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-marigold-400 transition-all duration-500" style={{ width: `${(readiness / 5) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style jsx global>{`
        .vv-input {
          width: 100%;
          border-radius: 0.7rem;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.6rem 0.8rem;
          color: #f4f1ea;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .vv-input:focus {
          outline: none;
          border-color: #ff9e2c;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 4px rgba(255, 158, 44, 0.18);
        }
        .vv-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .vv-input-lg {
          font-size: 1.15rem;
          padding: 0.8rem 1rem;
        }
        .vv-wiz-card {
          background: rgba(20, 14, 34, 0.68);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.7);
        }
        .vv-mini {
          border-radius: 9999px;
          padding: 0.2rem 0.7rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.75);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s;
        }
        .vv-mini:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .vv-mini-on {
          background: rgba(255, 158, 44, 0.9);
          color: #0b0a14;
          border-color: transparent;
          font-weight: 600;
        }
        .vv-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(to right, #ff9e2c 0%, #ffd24c var(--p, 50%), rgba(255, 255, 255, 0.12) var(--p, 50%));
        }
        .vv-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #fff;
          border: 4px solid #ff9e2c;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
          transition: transform 0.15s;
        }
        .vv-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .vv-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #fff;
          border: 4px solid #ff9e2c;
        }
        .vv-range:focus-visible {
          box-shadow: 0 0 0 4px rgba(255, 158, 44, 0.25);
        }
        .vv-step {
          animation: vv-step-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes vv-step-in {
          from {
            opacity: 0;
            transform: translateX(22px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .vv-rise {
          animation: vv-rise-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes vv-rise-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .vv-pop {
          animation: vv-pop-in 0.35s cubic-bezier(0.3, 1.5, 0.5, 1) both;
        }
        @keyframes vv-pop-in {
          from {
            transform: scale(0.94);
            opacity: 0.6;
          }
          to {
            transform: none;
            opacity: 1;
          }
        }
        .vv-fade {
          animation: vv-fade-in 0.5s ease both;
        }
        @keyframes vv-fade-in {
          from {
            opacity: 0;
            transform: scale(1.04);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .vv-shake {
          animation: vv-shake-x 0.4s ease both;
        }
        @keyframes vv-shake-x {
          20%,
          60% {
            transform: translateX(-6px);
          }
          40%,
          80% {
            transform: translateX(6px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vv-step,
          .vv-rise,
          .vv-pop,
          .vv-fade,
          .vv-shake {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, className = "", required = false, error }: { label: string; children: React.ReactNode; className?: string; required?: boolean; error?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-white/80">
        {label}
        {required ? <span className="ml-0.5 text-kumkum-500" aria-hidden>*</span> : <span className="ml-1 text-xs font-normal text-white/40">(optional)</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-300">
          {error}
        </span>
      )}
    </label>
  );
}

function Row({ icon, label, value, extra, muted }: { icon: string; label: string; value: string; extra?: string; muted?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="flex w-24 shrink-0 items-center gap-2 text-white/50">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right">
        <span key={value} className={`vv-pop inline-block break-words font-medium capitalize ${muted ? "text-white/30" : "text-white"}`}>
          {value}
        </span>
        {extra && <div className="text-[11px] text-white/45">{extra}</div>}
      </dd>
    </div>
  );
}
