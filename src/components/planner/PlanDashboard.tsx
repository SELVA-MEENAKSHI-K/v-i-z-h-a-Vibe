"use client";

// Final Plan dashboard — the two-column "Generate My Complete AI Event Plan"
// experience. LEFT: the user's ACTUAL selections (venue, theme photo, food
// photos, budget). RIGHT: the AI-generated roadmap (grounded in those
// selections). Independently scrollable on desktop; tabbed on mobile.

import { useMemo, useState } from "react";
import type { Plan } from "./types";
import { apiSend, formatINR } from "@/lib/client";
import { SmartImage } from "../ui/SmartImage";
import { GeneratedBadge } from "@/components/ui/Badges";
import { THEMES } from "@/data/themes";
import { MENU_ITEMS } from "@/data/menuItems";
import type { EventRoadmap } from "@/lib/ai/roadmap";

type BudgetLine = EventRoadmap["budgetReport"]["lines"][number];

const GEN_STEPS = [
  "Analysing your selections…",
  "Planning the venue & layout…",
  "Building the decoration roadmap…",
  "Calculating catering & budget…",
  "Creating the event-day timeline…",
  "Finalising your roadmap…",
];

type MobileTab = "selections" | "roadmap";

export function PlanDashboard({ plan, onSaved }: { plan: Plan; onSaved?: (p: Plan) => void }) {
  const [roadmap, setRoadmap] = useState<EventRoadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aiLive, setAiLive] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("selections");

  const theme = useMemo(() => {
    const slug = plan.preferences?.["selectedThemeSlug"] as string | undefined;
    return slug ? THEMES.find((t) => t.slug === slug) ?? null : null;
  }, [plan.preferences]);

  // Dishes referenced by the plan's saved menus (match by name for photos).
  const dishes = useMemo(() => {
    const names = new Set<string>();
    plan.menus.forEach((m) => m.courses.forEach((c) => c.items.forEach((i) => names.add(i.toLowerCase()))));
    return MENU_ITEMS.filter((mi) => [...names].some((n) => n.includes(mi.name.toLowerCase()) || mi.name.toLowerCase().includes(n))).slice(0, 6);
  }, [plan.menus]);

  async function generate() {
    setLoading(true);
    setError(null);
    setStepIdx(0);
    // Honest stepped animation: advances on a timer but NEVER claims completion
    // before the backend responds (we only reveal the roadmap on success).
    const timer = setInterval(() => setStepIdx((i) => Math.min(i + 1, GEN_STEPS.length - 1)), 650);
    try {
      const data = await apiSend<{ roadmap: EventRoadmap; aiLive: boolean; plan?: Plan }>(`/api/plans/${plan.shareToken}/roadmap`, "POST", {});
      clearInterval(timer);
      setStepIdx(GEN_STEPS.length - 1);
      setRoadmap(data.roadmap);
      setAiLive(data.aiLive);
      // Generate Final Plan also persisted the preparation timeline — push the
      // refreshed plan up so the Timeline/Vendor tabs reflect it immediately.
      if (data.plan && onSaved) onSaved(data.plan);
    } catch (e) {
      clearInterval(timer);
      setError(e instanceof Error ? e.message : "Could not generate the plan.");
    } finally {
      setLoading(false);
    }
  }

  // Pre-generation CTA / generation animation.
  if (!roadmap) {
    return (
      <div className="rounded-2xl border border-white/10 vv-glass p-6">
        <h3 className="font-display text-xl font-semibold">Review &amp; generate your complete plan</h3>
        <p className="mt-1 text-sm text-white/60">
          You&apos;ve set up your event{plan.selectedVenue ? ", venue" : ""}
          {theme ? ", theme" : ""}
          {plan.menus.length ? ", menu" : ""}. Generate a full AI roadmap grounded in these selections.
        </p>

        {/* Quick review strip */}
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <ReviewChip label="Event" value={`${plan.eventType.name} · ${plan.guestCount} guests`} />
          <ReviewChip label="Venue" value={plan.selectedVenue?.name ?? "Not selected"} ok={!!plan.selectedVenue} />
          <ReviewChip label="Theme" value={theme?.name ?? (plan.preferences?.["selectedThemeName"] as string) ?? "Not selected"} ok={!!theme || !!plan.preferences?.["selectedThemeName"]} />
          <ReviewChip label="Menu" value={plan.menus.length ? `${plan.menus.length} menu(s)` : "Not set"} ok={plan.menus.length > 0} />
          <ReviewChip label="Budget" value={plan.budget ? formatINR(plan.budget) : "Not set"} ok={plan.budget > 0} />
          <ReviewChip label="Layout" value={`${plan.layout?.objects.length ?? 0} objects`} ok={(plan.layout?.objects.length ?? 0) > 0} />
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">
            {error}{" "}
            <button onClick={generate} className="ml-2 underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 rounded-xl border border-plum-500/40 bg-plum-600/10 p-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-saffron-500" />
              <span className="font-medium">{GEN_STEPS[stepIdx]}</span>
            </div>
            <ol className="mt-4 space-y-1.5 text-sm">
              {GEN_STEPS.map((s, i) => (
                <li key={s} className={`flex items-center gap-2 ${i < stepIdx ? "text-emerald-300" : i === stepIdx ? "text-white" : "text-white/35"}`}>
                  <span>{i < stepIdx ? "✓" : i === stepIdx ? "●" : "○"}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <button
            onClick={generate}
            className="mt-6 w-full rounded-xl bg-saffron-500 px-6 py-3.5 text-base font-semibold text-ink-900 shadow-glow transition hover:bg-saffron-400 sm:w-auto"
          >
            ✦ Generate My Complete AI Event Plan
          </button>
        )}
      </div>
    );
  }

  // Two-column dashboard.
  return (
    <div>
      {/* Mobile tab switch */}
      <div className="mb-3 flex gap-1 lg:hidden">
        {(["selections", "roadmap"] as MobileTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm capitalize ${mobileTab === t ? "bg-saffron-500 text-ink-900" : "bg-white/5 text-white/70"}`}
          >
            {t === "selections" ? "Your selections" : "AI roadmap"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT — user selections */}
        <aside className={`${mobileTab === "selections" ? "block" : "hidden"} lg:block`}>
          <div className="vv-scroll space-y-4 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">
            <h3 className="font-display text-lg font-semibold">Your selections</h3>

            {/* Venue — with an embedded location map (OpenStreetMap, no API key) */}
            <Card title="Selected venue & map">
              {plan.selectedVenue ? (
                <>
                  {plan.selectedVenue.lat != null && plan.selectedVenue.lng != null ? (
                    <div className="relative mb-2 aspect-[16/9] overflow-hidden rounded-lg border border-white/10">
                      <iframe
                        title={`Map showing ${plan.selectedVenue.name}`}
                        className="h-full w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={osmEmbedUrl(plan.selectedVenue.lat, plan.selectedVenue.lng)}
                      />
                    </div>
                  ) : plan.selectedVenue.photos?.[0] ? (
                    <div className="relative mb-2 aspect-[16/9] overflow-hidden rounded-lg">
                      <SmartImage src={plan.selectedVenue.photos[0]} alt={plan.selectedVenue.name} category="venue" sizes="50vw" />
                    </div>
                  ) : null}
                  <div className="font-medium">{plan.selectedVenue.name}</div>
                  {plan.selectedVenue.address && <div className="text-xs text-white/55">{plan.selectedVenue.address}</div>}
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {plan.selectedVenue.distanceKm != null && <span className="text-peacock-400">📍 {plan.selectedVenue.distanceKm} km</span>}
                    {plan.selectedVenue.mapsUrl && (
                      <a href={plan.selectedVenue.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-peacock-400 underline">
                        Directions ↗
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-white/40">Capacity, pricing & availability unverified — contact venue.</p>
                </>
              ) : (
                <p className="text-sm text-white/50">No venue selected. Use Venue discovery.</p>
              )}
            </Card>

            {/* Theme */}
            <Card title="Selected theme">
              {theme ? (
                <>
                  <div className="relative mb-2 aspect-[16/9] overflow-hidden rounded-lg">
                    <SmartImage src={theme.image} alt={theme.name} category="decoration" credit={theme.imageSource} sizes="50vw" />
                  </div>
                  <div className="font-medium">{theme.name}</div>
                  <div className="mt-1 flex gap-1.5">
                    {theme.palette.map((c) => (
                      <span key={c} className="h-4 w-4 rounded-full ring-1 ring-white/20" style={{ background: c }} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/50">No theme applied. Use the Themes tab.</p>
              )}
            </Card>

            {/* Food photos */}
            <Card title="Selected menu">
              {dishes.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {dishes.map((d) => (
                    <div key={d.slug}>
                      <div className="relative aspect-square overflow-hidden rounded-lg">
                        <SmartImage src={d.imageUrl} alt={d.name} category="food" sizes="20vw" noIllustrativeFallback placeholderText="No photo" />
                      </div>
                      <div className="mt-1 truncate text-[10px] text-white/60">{d.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">No menu dishes matched to photos yet.</p>
              )}
            </Card>

            {/* Budget snapshot */}
            <Card title="Budget">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Your budget</span>
                <span className="font-medium">{plan.budget ? formatINR(plan.budget) : "Not set"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-white/60">AI estimate</span>
                <span className="text-saffron-400">
                  {formatINR(roadmap.budgetReport.totalMin)}–{formatINR(roadmap.budgetReport.totalMax)}
                </span>
              </div>
            </Card>
          </div>
        </aside>

        {/* RIGHT — AI roadmap */}
        <div className={`${mobileTab === "roadmap" ? "block" : "hidden"} lg:block`}>
          <div className="vv-scroll space-y-4 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">AI event roadmap</h3>
              <button onClick={generate} disabled={loading} className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white/70 hover:bg-white/5">
                {loading ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <GeneratedBadge />
              <span className="text-white/50">{aiLive ? `AI provider: ${roadmap.provider}` : "Structured plan computed from your actual selections."}</span>
            </div>

            <RoadmapSections roadmap={roadmap} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewChip({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full ${ok === false ? "bg-amber-400" : "bg-peacock-400"}`} />
      <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
      <span className="ml-auto truncate text-white/80">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h4 className="mb-2 text-sm font-semibold text-white/80">{title}</h4>
      {children}
    </div>
  );
}

function RoadmapSections({ roadmap }: { roadmap: EventRoadmap }) {
  const o = roadmap.overview;
  const br = roadmap.budgetReport;
  const overBudget = br.remainingMin != null && br.remainingMin < 0;
  return (
    <div className="space-y-4 text-sm">
      {overBudget && (
        <div className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-red-200">
          ⚠ Estimated cost may exceed your budget at the high end — see recommendations to trim.
        </div>
      )}

      <Section title="A · Overview">
        <div className="grid gap-1.5 sm:grid-cols-2">
          <KV k="Venue" v={o.venue ?? "Not selected"} />
          <KV k="Date" v={o.date ?? "Not set"} />
          <KV k="Guests" v={String(o.guestCount)} />
          <KV k="Theme" v={o.theme ?? "Not selected"} />
          <KV k="Estimate" v={`${formatINR(o.totalEstimateMin)}–${formatINR(o.totalEstimateMax)}`} />
          <KV k="Budget" v={o.budget ? formatINR(o.budget) : "Not set"} />
        </div>
        <p className="mt-1 text-[11px] text-amber-300/80">{o.note}</p>
      </Section>

      <Bullets title="B · Venue Planning" items={roadmap.venuePrep} />

      <Section title="C · Decoration Roadmap">
        <div className="flex flex-wrap gap-1.5">
          {roadmap.decoration.items.map((d: string) => (
            <span key={d} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/75">{d}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-saffron-400">Est. {formatINR(roadmap.decoration.estMin)}–{formatINR(roadmap.decoration.estMax)}</p>
      </Section>

      <Section title="D · Food & Catering">
        {roadmap.food.menu.map((c) => (
          <div key={c.course} className="text-sm">
            <span className="text-peacock-400">{c.course}:</span> <span className="text-white/70">{c.items.join(", ")}</span>
          </div>
        ))}
        {roadmap.food.estMax > 0 && <p className="mt-1 text-xs text-saffron-400">Catering est. {formatINR(roadmap.food.estMin)}–{formatINR(roadmap.food.estMax)}</p>}
      </Section>

      <Section title="E · Budget Breakdown">
        <table className="w-full text-xs">
          <tbody>
            {br.lines.map((l, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-1">{l.label}</td>
                <td className="py-1 text-right text-white/70">{formatINR(l.min)}–{formatINR(l.max)}</td>
              </tr>
            ))}
            <tr className="border-t border-white/15 font-semibold text-saffron-400">
              <td className="py-1.5">Total</td>
              <td className="py-1.5 text-right">{formatINR(br.totalMin)}–{formatINR(br.totalMax)}</td>
            </tr>
          </tbody>
        </table>
        {/* Simple category bar chart */}
        <BudgetBars lines={br.lines} totalMax={br.totalMax} />
        <p className="mt-1 text-xs text-white/55">
          Per guest {formatINR(br.perGuestMin)}–{formatINR(br.perGuestMax)}
          {br.remainingMin != null && br.remainingMax != null && (
            <> · Remaining <span className={br.remainingMin < 0 ? "text-red-300" : "text-emerald-300"}>{formatINR(br.remainingMin)}–{formatINR(br.remainingMax)}</span></>
          )}
        </p>
      </Section>

      <Section title="F · Vendors">
        <div className="grid gap-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Confirmed expense (in budget)</span>
            <span className="font-medium text-emerald-300">{formatINR(roadmap.vendors.confirmedExpense)}</span>
          </div>
          {(roadmap.vendors.estimatedExpense.max > 0) && (
            <div className="flex items-center justify-between">
              <span className="text-white/60">Estimated (not yet confirmed)</span>
              <span className="font-medium text-saffron-400">
                {formatINR(roadmap.vendors.estimatedExpense.min)}–{formatINR(roadmap.vendors.estimatedExpense.max)}
              </span>
            </div>
          )}
        </div>
        {roadmap.vendors.confirmed.length > 0 && (
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wide text-white/40">Confirmed</div>
            <ul className="mt-1 space-y-0.5 text-sm">
              {roadmap.vendors.confirmed.map((v, i) => (
                <li key={i} className="flex justify-between">
                  <span className="capitalize text-white/75">{v.name} · {v.category.replace("-", " ")}</span>
                  <span className="text-emerald-300">{v.cost != null ? formatINR(v.cost) : "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {roadmap.vendors.pending.length > 0 && (
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wide text-white/40">In progress</div>
            <ul className="mt-1 space-y-0.5 text-sm">
              {roadmap.vendors.pending.map((v, i) => (
                <li key={i} className="flex justify-between">
                  <span className="capitalize text-white/75">{v.name} · {v.category.replace("-", " ")}</span>
                  <span className="text-amber-200">{v.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {roadmap.vendors.needed.length > 0 && (
          <p className="mt-2 text-xs text-amber-300/80">Still to book: {roadmap.vendors.needed.map((c) => c.replace("-", " ")).join(", ")}.</p>
        )}
        {roadmap.vendors.confirmed.length === 0 && roadmap.vendors.pending.length === 0 && (
          <p className="mt-1 text-xs text-white/50">No vendors saved yet — add them in the Vendors tab to track costs and tasks.</p>
        )}
      </Section>

      <Section title="G · Event-Day Schedule">
        <ol className="space-y-1">
          {roadmap.timeline.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-20 shrink-0 font-medium text-peacock-400">{s.time}</span>
              <span className="text-white/75">{s.activity}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="H · Task Checklist">
        <div className="space-y-1.5">
          {roadmap.checklist.map((t, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.priority === "high" ? "bg-kumkum-500/30 text-red-200" : t.priority === "medium" ? "bg-amber-400/20 text-amber-200" : "bg-white/10 text-white/60"}`}>
                {t.priority}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.title} <span className="text-[11px] font-normal text-white/40">· T-{t.offsetDays}d · {t.owner}</span></div>
                <div className="text-xs text-white/55">{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Bullets title="I · AI Recommendations" items={roadmap.recommendations} accent />
    </div>
  );
}

function BudgetBars({ lines, totalMax }: { lines: BudgetLine[]; totalMax: number }) {
  const cols = ["#ff9e2c", "#2dd4bf", "#c81d4e", "#7c3aed", "#ffd24c", "#38bdf8"];
  return (
    <div className="mt-3 space-y-1">
      {lines.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-[10px] text-white/55">{l.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded bg-white/5">
            <div className="h-full rounded" style={{ width: `${totalMax > 0 ? Math.max(3, (l.max / totalMax) * 100) : 0}%`, background: cols[i % cols.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h4 className="mb-2 font-semibold text-saffron-400">{title}</h4>
      {children}
    </section>
  );
}

function Bullets({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <Section title={title}>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className={`flex gap-2 ${accent ? "text-peacock-300" : "text-white/75"}`}>
            <span className="text-saffron-400">•</span> {it}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{k}</div>
      <div className="text-white/85">{v}</div>
    </div>
  );
}

// Keyless OpenStreetMap embed (matches our Geoapify/OSM venue data source).
function osmEmbedUrl(lat: number, lng: number): string {
  const d = 0.01; // bounding box padding (~1 km)
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
