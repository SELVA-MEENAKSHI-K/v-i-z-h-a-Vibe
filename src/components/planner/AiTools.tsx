"use client";

import { useState } from "react";
import type { Plan } from "./types";
import { apiSend, formatINR } from "@/lib/client";
import { GeneratedBadge } from "@/components/ui/Badges";

type Kind = "theme" | "decor" | "menu" | "budget" | "timeline";

export function AiTools({ plan }: { plan: Plan }) {
  const [kind, setKind] = useState<Kind>("theme");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function generate(k: Kind) {
    setKind(k);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiSend<{ provider: string; result: any }>("/api/ai/recommendations", "POST", {
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
        Suggestions are generated and editable — not confirmed prices, availability, or venue facts.
      </p>

      {loading && <div className="h-24 animate-pulse rounded-xl bg-white/5" />}
      {error && <div className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <GeneratedBadge /> provider: {provider}
          </div>

          {kind === "theme" &&
            result.themes?.map((t: any, i: number) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{t.title}</h4>
                  <div className="flex gap-1">
                    {t.palette?.map((c: string) => <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />)}
                  </div>
                </div>
                <p className="mt-1 text-sm text-white/70">{t.summary}</p>
                <p className="mt-2 text-xs text-white/50">In 3D: {t.representableIn3D?.join(", ")}</p>
              </div>
            ))}

          {kind === "decor" &&
            result.concepts?.map((c: any, i: number) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h4 className="font-medium">{c.title}</h4>
                <p className="mt-1 text-sm text-white/70">{c.description}</p>
                <p className="mt-2 text-xs text-peacock-400">Representable in 3D: {c.representableIn3D?.join(", ")}</p>
                <p className="mt-1 text-xs text-white/40">Not representable: {c.notRepresentable?.join(", ")}</p>
              </div>
            ))}

          {kind === "menu" &&
            result.menus?.map((m: any, i: number) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h4 className="font-medium">
                  {m.style} · <span className="capitalize text-white/60">{m.dietary}</span>
                </h4>
                {m.courses?.map((co: any) => (
                  <div key={co.course} className="mt-2 text-sm">
                    <span className="text-saffron-400">{co.course}:</span> <span className="text-white/70">{co.items?.join(", ")}</span>
                  </div>
                ))}
                <p className="mt-2 text-xs text-white/50">{m.notes}</p>
              </div>
            ))}

          {kind === "budget" && result.estimate && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Estimated budget (range)</h4>
                <span className="text-sm text-saffron-400">
                  {formatINR(result.estimate.totalMin)} – {formatINR(result.estimate.totalMax)}
                </span>
              </div>
              <table className="mt-3 w-full text-xs">
                <tbody>
                  {result.estimate.lines?.map((l: any, i: number) => (
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
                {result.estimate.assumptions?.map((a: string, i: number) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {kind === "timeline" &&
            result.tasks?.map((t: any, i: number) => (
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
