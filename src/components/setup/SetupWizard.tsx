"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EventCategoryDef } from "@/data/catalog";
import { apiSend } from "@/lib/client";

type Props = {
  catalog: EventCategoryDef[];
  cities: string[];
  styles: { slug: string; name: string }[];
};

const DIETARY = ["veg", "non-veg", "both", "jain", "vegan"];

export function SetupWizard({ catalog, cities, styles }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const initialCategory = params.get("category") || catalog[0].slug;

  const [step, setStep] = useState(0);
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

  const category = useMemo(() => catalog.find((c) => c.slug === categorySlug)!, [catalog, categorySlug]);
  const eventType = category.eventTypes.find((t) => t.slug === eventTypeSlug);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function next() {
    setError(null);
    if (step === 0 && !eventTypeSlug) {
      setError("Please choose an event type.");
      return;
    }
    if (step === 1 && !title.trim()) {
      setError("Please give your plan a title.");
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  }

  async function submit() {
    setError(null);
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
      setError(e instanceof Error ? e.message : "Could not create the plan.");
      setSubmitting(false);
    }
  }

  return (
    <div className="vv-glass rounded-2xl p-6">
      {/* Step indicator */}
      <ol className="mb-6 flex items-center gap-2 text-sm">
        {["Event", "Details", "Style"].map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i <= step ? "bg-saffron-500 text-ink-900" : "bg-white/10 text-white/60"
              }`}
            >
              {i + 1}
            </span>
            <span className={i <= step ? "text-white" : "text-white/50"}>{label}</span>
            {i < 2 && <span className="mx-1 h-px w-6 bg-white/15" />}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {step === 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">Category</label>
          <div className="flex flex-wrap gap-2">
            {catalog.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => {
                  setCategorySlug(c.slug);
                  setEventTypeSlug("");
                }}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  c.slug === categorySlug ? "bg-saffron-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          <label className="mb-2 mt-6 block text-sm font-medium text-white/80">Event type</label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {category.eventTypes.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => {
                  setEventTypeSlug(t.slug);
                  if (!title) setTitle(t.name);
                  if (t.defaultStyles?.length) setSelectedStyles(t.defaultStyles);
                }}
                className={`rounded-xl border p-3 text-left transition ${
                  t.slug === eventTypeSlug
                    ? "border-saffron-500 bg-saffron-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <div className="font-medium">{t.name}</div>
                <div className="mt-1 text-xs text-white/55">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Plan title" className="sm:col-span-2">
            <input className="vv-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Meena & Arun — Reception" />
          </Field>
          <Field label="City">
            <select className="vv-input" value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Guest count">
            <input type="number" min={1} className="vv-input" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} />
          </Field>
          <Field label="Start date">
            <input type="date" className="vv-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End date (optional)">
            <input type="date" className="vv-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <Field label="Budget (₹)" className="sm:col-span-2">
            <input type="number" min={0} step={10000} className="vv-input" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Cultural style(s)</label>
            <p className="mb-2 text-xs text-white/50">Optional. Combine styles or leave blank — we won&apos;t assume your customs.</p>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggle(selectedStyles, s.slug, setSelectedStyles)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    selectedStyles.includes(s.slug) ? "bg-peacock-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Dietary preference</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(dietary, d, setDietary)}
                  className={`rounded-full px-3 py-1.5 text-sm capitalize transition ${
                    dietary.includes(d) ? "bg-marigold-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <Field label="Notes / preferences (optional)">
            <textarea
              className="vv-input min-h-[90px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Accessibility needs, timing, must-haves…"
            />
          </Field>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            <div className="font-medium text-white">Summary</div>
            <p className="mt-1">
              {eventType?.name || "Event"} in {city} · {guestCount} guests · budget ₹{Number(budget).toLocaleString("en-IN")}
              {selectedStyles.length ? ` · ${selectedStyles.join(", ")}` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-30"
        >
          ← Back
        </button>
        {step < 2 ? (
          <button type="button" onClick={next} className="rounded-lg bg-saffron-500 px-6 py-2 font-semibold text-ink-900 hover:bg-saffron-400">
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-lg bg-saffron-500 px-6 py-2 font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create plan & open 3D planner"}
          </button>
        )}
      </div>

      <style jsx global>{`
        .vv-input {
          width: 100%;
          border-radius: 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.6rem 0.75rem;
          color: #f4f1ea;
          font-size: 0.95rem;
        }
        .vv-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-white/80">{label}</span>
      {children}
    </label>
  );
}
