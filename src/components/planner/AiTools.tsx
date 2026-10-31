"use client";

import { useState } from "react";
import type { Plan } from "./types";
import { apiSend, formatINR } from "@/lib/client";
import { GeneratedBadge } from "@/components/ui/Badges";
import type { AiResult } from "@/lib/ai/types";
import type { EventRoadmap } from "@/lib/ai/roadmap";

type Kind = "theme" | "decor" | "menu" | "budget" | "timeline";

// Narrowing helpers so the template can access kind-specific fields safely.
type ThemeResult = Extract<AiResult, { kind: "theme" }>;
type DecorResult = Extract<AiResult, { kind: "decor" }>;
type MenuResult = Extract<AiResult, { kind: "menu" }>;
type BudgetResult = Extract<AiResult, { kind: "budget" }>;
type TimelineResult = Extract<AiResult, { kind: "timeline" }>;

export function AiTools({ plan }: { plan: Plan }) {
  const [kind, setKind] = useState<Kind>("theme");
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<EventRoadmap | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [aiLive, setAiLive] = useState(false);

  async function generateRoadmap() {
    setRoadmapLoading(true);
    setError(null);
    setRoadmap(null);
    try {
      const data = await apiSend<{ roadmap: EventRoadmap; aiLive: boolean }>(`/api/plans/${plan.shareToken}/roadmap`, "POST", {});
      setRoadmap(data.roadmap);
      setAiLive(data.aiLive);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the roadmap.");
    } finally {
      setRoadmapLoading(false);
    }
  }

  async function generate(k: Kind) {
    setKind(k);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiSend<{ provider: string; result: AiResult }>("/api/ai/recommendations", "POST", {
        kind: k,
        planId: plan.shareToken,
      });
      setProvider(data.provider);
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Full AI roadmap generator — grounded in the plan's actual selections */}
      <div className="rounded-2xl border border-plum-500/40 bg-gradient-to-br from-plum-600/20 to-ink-800 p-5">
        <h3 className="font-display text-lg font-semibold">Complete AI Event Plan</h3>
        <p className="mt-1 text-sm text-white/65">
          Generates a full roadmap — overview, venue prep, decoration, food, day-of timeline, checklist, budget report and
          recommendations — from your actual venue, theme, menu and budget selections.
        </p>
        <button
          onClick={generateRoadmap}
          disabled={roadmapLoading}
          className="mt-3 rounded-xl bg-saffron-500 px-6 py-2.5 font-semibold text-ink-900 shadow-glow transition hover:bg-saffron-400 disabled:opacity-60"
        >
          {roadmapLoading ? "Generating…" : "✦ Generate My Complete AI Event Plan"}
        </button>
        {roadmap && <RoadmapView roadmap={roadmap} aiLive={aiLive} />}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["theme", "decor", "menu", "budget", "timeline"] as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => generate(k)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${kind === k ? "bg-plum-600 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"}`}
          >
            {k}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/50">
        AI suggestions are generated and editable — not confirmed prices, availability, or venue facts. They require a
        configured AI provider; otherwise a setup message is shown.
      </p>

      {loading && <div className="h-24 animate-pulse rounded-xl bg-white/5" />}
      {error && <div className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <GeneratedBadge /> provider: {provider}
          </div>

          {result.kind === "theme" &&
            (result as ThemeResult).themes.map((t, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{t.title}</h4>
                  <div className="flex gap-1">
                    {t.palette.map((c) => <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />)}
                  </div>
                </div>
                <p className="mt-1 text-sm text-white/70">{t.summary}</p>
                <p className="mt-2 text-xs text-white/50">In 3D: {t.representableIn3D.join(", ")}</p>
              </div>
            ))}

          {result.kind === "decor" &&
            (result as DecorResult).concepts.map((c, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h4 className="font-medium">{c.title}</h4>
                <p className="mt-1 text-sm text-white/70">{c.description}</p>
                <p className="mt-2 text-xs text-peacock-400">Representable in 3D: {c.representableIn3D.join(", ")}</p>
                <p className="mt-1 text-xs text-white/40">Not representable: {c.notRepresentable.join(", ")}</p>
              </div>
            ))}

          {result.kind === "menu" &&
            (result as MenuResult).menus.map((m, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h4 className="font-medium">
                  {m.style} · <span className="capitalize text-white/60">{m.dietary}</span>
                </h4>
                {m.courses.map((co) => (
                  <div key={co.course} className="mt-2 text-sm">
                    <span className="text-saffron-400">{co.course}:</span> <span className="text-white/70">{co.items.join(", ")}</span>
                  </div>
                ))}
                <p className="mt-2 text-xs text-white/50">{m.notes}</p>
              </div>
            ))}

          {result.kind === "budget" && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Estimated budget (range)</h4>
                <span className="text-sm text-saffron-400">
                  {formatINR((result as BudgetResult).estimate.totalMin)} – {formatINR((result as BudgetResult).estimate.totalMax)}
                </span>
              </div>
              <table className="mt-3 w-full text-xs">
                <tbody>
                  {(result as BudgetResult).estimate.lines.map((l, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1.5">{l.label}</td>
                      <td className="py-1.5 text-right text-white/70">×{l.quantity}</td>
                      <td className="py-1.5 text-right">
                        {formatINR(l.unitCostMin)}–{formatINR(l.unitCostMax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="mt-3 list-inside list-disc text-[11px] text-white/45">
                {(result as BudgetResult).estimate.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {result.kind === "timeline" &&
            (result as TimelineResult).tasks.map((t, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="mt-0.5 rounded bg-peacock-500/20 px-2 py-0.5 text-[11px] text-peacock-400">T-{t.offsetDays}d</span>
                <div>
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-white/60">{t.detail}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function RoadmapView({ roadmap, aiLive }: { roadmap: EventRoadmap; aiLive: boolean }) {
  const o = roadmap.overview;
  const br = roadmap.budgetReport;
  return (
    <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-ink-900/60 p-4">
      <div className="flex items-center gap-2 text-xs">
        <GeneratedBadge />
        <span className="text-white/50">{aiLive ? `AI provider: ${roadmap.provider}` : "Structured plan computed from your actual selections."}</span>
      </div>

      {/* A. Overview */}
      <section>
        <h4 className="font-semibold text-saffron-400">A · Event Overview</h4>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Event" value={o.title} />
          <Info label="Type" value={`${o.eventType} · ${o.city}`} />
          <Info label="Venue" value={o.venue ?? "Not selected yet"} />
          <Info label="Date" value={o.date ?? "Not set"} />
          <Info label="Guests" value={String(o.guestCount)} />
          <Info label="Theme" value={o.theme ?? "Not selected"} />
          <Info label="Estimated total" value={`${formatINR(o.totalEstimateMin)} – ${formatINR(o.totalEstimateMax)}`} />
          <Info label="Budget" value={o.budget ? formatINR(o.budget) : "Not set"} />
        </div>
        <p className="mt-1 text-[11px] text-amber-300/80">{o.note}</p>
      </section>

      <Block title="B · Venue Preparation" items={roadmap.venuePrep} />

      <section>
        <h4 className="font-semibold text-saffron-400">C · Decoration Roadmap</h4>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {roadmap.decoration.items.map((d: string) => (
            <li key={d} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/75">{d}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-white/55">Setup: {roadmap.decoration.setupSchedule.join(" → ")}</p>
        <p className="mt-1 text-xs text-saffron-400">Est. {formatINR(roadmap.decoration.estMin)}–{formatINR(roadmap.decoration.estMax)}</p>
      </section>

      <section>
        <h4 className="font-semibold text-saffron-400">D · Food Roadmap</h4>
        {roadmap.food.menu.map((c) => (
          <div key={c.course} className="mt-1 text-sm">
            <span className="text-peacock-400">{c.course}:</span> <span className="text-white/70">{c.items.join(", ")}</span>
          </div>
        ))}
        <p className="mt-2 text-xs text-white/55">{roadmap.food.servingNote}</p>
        {roadmap.food.estMax > 0 && <p className="mt-1 text-xs text-saffron-400">Catering est. {formatINR(roadmap.food.estMin)}–{formatINR(roadmap.food.estMax)}</p>}
      </section>

      {/* E. Timeline */}
      <section>
        <h4 className="font-semibold text-saffron-400">E · Event-Day Timeline</h4>
        <ol className="mt-2 space-y-1">
          {roadmap.timeline.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-20 shrink-0 font-medium text-peacock-400">{s.time}</span>
              <span className="text-white/75">{s.activity}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* F. Checklist */}
      <section>
        <h4 className="font-semibold text-saffron-400">F · Task Checklist</h4>
        <div className="mt-2 space-y-1.5">
          {roadmap.checklist.map((t, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm">
              <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.priority === "high" ? "bg-kumkum-500/30 text-red-200" : t.priority === "medium" ? "bg-amber-400/20 text-amber-200" : "bg-white/10 text-white/60"}`}>
                {t.priority}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{t.title} <span className="text-[11px] font-normal text-white/40">· T-{t.offsetDays}d · {t.owner}</span></div>
                <div className="text-xs text-white/55">{t.detail}</div>
              </div>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] capitalize text-white/50">{t.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* G. Budget report */}
      <section>
        <h4 className="font-semibold text-saffron-400">G · Budget Report</h4>
        <table className="mt-2 w-full text-xs">
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
        <p className="mt-1 text-xs text-white/55">
          Per guest {formatINR(br.perGuestMin)}–{formatINR(br.perGuestMax)}
          {br.remainingMin != null && br.remainingMax != null && (
            <>
              {" · "}Remaining of budget:{" "}
              <span className={br.remainingMin < 0 ? "text-red-300" : "text-emerald-300"}>
                {formatINR(br.remainingMin)}–{formatINR(br.remainingMax)}
              </span>
            </>
          )}
        </p>
      </section>

      <Block title="H · AI Recommendations" items={roadmap.recommendations} accent />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="text-white/85">{value}</div>
    </div>
  );
}

function Block({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <section>
      <h4 className="font-semibold text-saffron-400">{title}</h4>
      <ul className="mt-2 space-y-1">
        {items.map((it, i) => (
          <li key={i} className={`flex gap-2 text-sm ${accent ? "text-peacock-300" : "text-white/75"}`}>
            <span className="text-saffron-400">•</span> {it}
          </li>
        ))}
      </ul>
    </section>
  );
}
