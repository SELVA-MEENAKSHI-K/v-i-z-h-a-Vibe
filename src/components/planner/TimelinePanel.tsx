"use client";

import type { Plan } from "./types";

export function TimelinePanel({ plan }: { plan: Plan }) {
  const base = plan.startDate ? new Date(plan.startDate) : null;

  function dateFor(offsetDays: number): string {
    if (!base) return `T-${offsetDays} days`;
    const d = new Date(base);
    d.setDate(d.getDate() - offsetDays);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  const tasks = [...plan.tasks].sort((a, b) => b.offsetDays - a.offsetDays);

  return (
    <div>
      <h3 className="font-semibold">Planning timeline</h3>
      <p className="mt-1 text-xs text-white/50">
        {base ? "Deadlines calculated from your event date." : "Set an event date to see calendar deadlines."} Generate a full
        timeline from the AI tools.
      </p>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">No timeline tasks yet. Open AI tools → Timeline to generate one.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="mt-0.5 whitespace-nowrap rounded bg-peacock-500/20 px-2 py-0.5 text-[11px] text-peacock-400">{dateFor(t.offsetDays)}</span>
              <div>
                <div className={`text-sm font-medium ${t.done ? "text-white/40 line-through" : ""}`}>{t.title}</div>
                {t.detail && <div className="text-xs text-white/55">{t.detail}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
