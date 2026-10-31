"use client";

import { useMemo, useState } from "react";
import type { Plan, PlanTask, TaskStatus } from "./types";
import { apiSend } from "@/lib/client";
import { effectiveStatus, completionPct } from "@/lib/timeline";

type View = "list" | "calendar";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-kumkum-500/30 text-red-200",
  medium: "bg-amber-400/20 text-amber-200",
  low: "bg-white/10 text-white/60",
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  pending: "bg-white/10 text-white/60",
  "in-progress": "bg-peacock-500/20 text-peacock-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  overdue: "bg-kumkum-500/30 text-red-200",
};

export function TimelinePanel({ plan, onSaved }: { plan: Plan; onSaved?: (p: Plan) => void }) {
  const [view, setView] = useState<View>("list");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Compute each task's live status (pending tasks past due become overdue).
  const tasks = useMemo(() => {
    return [...plan.tasks]
      .map((t) => ({ ...t, liveStatus: effectiveStatus(t.status, t.done, t.dueDate) as TaskStatus }))
      .sort((a, b) => b.offsetDays - a.offsetDays);
  }, [plan.tasks]);

  const pct = completionPct(plan.tasks);
  const overdue = tasks.filter((t) => t.liveStatus === "overdue");
  const upcoming = tasks
    .filter((t) => t.liveStatus !== "completed" && t.liveStatus !== "overdue" && t.dueDate)
    .slice(0, 3);

  const base = plan.startDate ? new Date(plan.startDate) : null;

  function dueLabel(t: PlanTask): string {
    if (t.dueDate) return new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (!base) return `T-${t.offsetDays} days`;
    const d = new Date(base);
    d.setDate(d.getDate() - t.offsetDays);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/timeline`, "POST", {});
      onSaved?.(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the timeline.");
    } finally {
      setBusy(false);
    }
  }

  async function patchTask(taskId: string, patch: Record<string, unknown>) {
    setError(null);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/timeline/${taskId}`, "PATCH", patch);
      onSaved?.(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the task.");
    }
  }

  async function deleteTask(taskId: string) {
    setError(null);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/timeline/${taskId}`, "DELETE");
      onSaved?.(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the task.");
    }
  }

  async function addTask(title: string, priority: string, offsetDays: number) {
    setError(null);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/timeline`, "PUT", { title, priority, offsetDays });
      onSaved?.(data.plan);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the task.");
    }
  }

  const titleById = new Map(plan.tasks.map((t) => [t.id, t.title]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold">Preparation timeline</h3>
          <p className="text-sm text-white/60">
            {base ? "Deadlines are calculated from your event date and never fall after it." : "Set an event date to anchor the schedule to real deadlines."}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/10 text-xs">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 ${view === "list" ? "bg-saffron-500 text-ink-900" : "text-white/80"}`}>
              List
            </button>
            <button onClick={() => setView("calendar")} className={`px-3 py-1.5 ${view === "calendar" ? "bg-saffron-500 text-ink-900" : "text-white/80"}`}>
              Calendar
            </button>
          </div>
          <button onClick={generate} disabled={busy} className="rounded-lg bg-saffron-500 px-4 py-1.5 text-sm font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60">
            {busy ? "Generating…" : plan.tasks.length ? "↻ Regenerate" : "✦ Generate timeline"}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

      {/* Progress + reminders */}
      {plan.tasks.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-white/60">
              <span>Completion</span>
              <span className="font-semibold text-white/80">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-marigold-400 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-2 text-[11px]">
            {overdue.length > 0 && <span className="rounded-full bg-kumkum-500/30 px-2.5 py-1 text-red-200">{overdue.length} overdue</span>}
            {upcoming.length > 0 && <span className="rounded-full bg-peacock-500/20 px-2.5 py-1 text-peacock-300">{upcoming.length} upcoming</span>}
          </div>
        </div>
      )}

      {/* Reminders */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border border-peacock-400/25 bg-peacock-500/[0.06] p-3 text-sm">
          <div className="mb-1 font-semibold text-peacock-200">⏰ Upcoming deadlines</div>
          <ul className="space-y-0.5 text-white/75">
            {upcoming.map((t) => (
              <li key={t.id}>
                {dueLabel(t)} — {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.tasks.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-sm text-white/60">No timeline yet. Generate a full preparation schedule from your event, venue, vendors and selections.</p>
          <button onClick={generate} disabled={busy} className="mt-4 rounded-xl bg-saffron-500 px-6 py-2.5 font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60">
            {busy ? "Generating…" : "✦ Generate timeline"}
          </button>
        </div>
      ) : view === "list" ? (
        <ol className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={t.liveStatus === "completed"}
                  onChange={(e) => patchTask(t.id, { done: e.target.checked })}
                  aria-label={`Mark "${t.title}" complete`}
                  className="mt-1 accent-saffron-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-medium ${t.liveStatus === "completed" ? "text-white/40 line-through" : ""}`}>{t.title}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[t.liveStatus]}`}>{t.liveStatus}</span>
                  </div>
                  {t.detail && <div className="mt-0.5 text-xs text-white/55">{t.detail}</div>}
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/45">
                    <span>📅 {dueLabel(t)}</span>
                    {t.assignee && <span>👤 {t.assignee}</span>}
                    {t.dependsOnId && titleById.get(t.dependsOnId) && <span>⛓ after: {titleById.get(t.dependsOnId)}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <select
                    value={t.liveStatus === "overdue" ? t.status : t.liveStatus}
                    onChange={(e) => patchTask(t.id, { status: e.target.value })}
                    aria-label="Task status"
                    className="vv-select rounded border border-white/15 px-2 py-1 text-[11px]"
                  >
                    <option value="pending" className="bg-ink-800">Pending</option>
                    <option value="in-progress" className="bg-ink-800">In progress</option>
                    <option value="completed" className="bg-ink-800">Completed</option>
                  </select>
                  <button onClick={() => deleteTask(t.id)} className="text-[11px] text-red-300 hover:text-red-200">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <CalendarView tasks={tasks} dueLabel={dueLabel} />
      )}

      {/* Add custom task */}
      {plan.tasks.length > 0 &&
        (adding ? (
          <AddTaskForm onAdd={addTask} onCancel={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
            + Add custom task
          </button>
        ))}
    </div>
  );
}

function CalendarView({ tasks, dueLabel }: { tasks: (PlanTask & { liveStatus: TaskStatus })[]; dueLabel: (t: PlanTask) => string }) {
  // Group by month-year of the due date for a lightweight visual calendar.
  const groups = new Map<string, (PlanTask & { liveStatus: TaskStatus })[]>();
  for (const t of [...tasks].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))) {
    const key = t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Unscheduled";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([month, items]) => (
        <div key={month}>
          <h4 className="mb-2 text-sm font-semibold text-saffron-400">{month}</h4>
          <div className="space-y-1.5">
            {items.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-sm">
                <span className="w-24 shrink-0 text-xs text-peacock-400">{dueLabel(t)}</span>
                <span className={`flex-1 ${t.liveStatus === "completed" ? "text-white/40 line-through" : ""}`}>{t.title}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[t.liveStatus]}`}>{t.liveStatus}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AddTaskForm({ onAdd, onCancel }: { onAdd: (title: string, priority: string, offsetDays: number) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [offsetDays, setOffsetDays] = useState(14);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" aria-label="Task title" className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm" />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority" className="vv-select rounded-lg border border-white/15 px-2 py-2 text-sm">
          <option value="high" className="bg-ink-800">High</option>
          <option value="medium" className="bg-ink-800">Medium</option>
          <option value="low" className="bg-ink-800">Low</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-white/60">
          T-
          <input type="number" min={1} max={3650} value={offsetDays} onChange={(e) => setOffsetDays(Number(e.target.value))} aria-label="Days before event" className="w-16 rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-sm" />d
        </label>
        <div className="flex gap-2">
          <button onClick={() => title.trim() && onAdd(title.trim(), priority, offsetDays)} className="rounded-lg bg-saffron-500 px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-saffron-400">
            Add
          </button>
          <button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
