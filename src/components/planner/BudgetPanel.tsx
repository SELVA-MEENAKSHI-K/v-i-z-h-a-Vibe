"use client";

import { useState } from "react";
import type { Plan, PlanBudgetItem } from "./types";
import { apiSend, formatINR } from "@/lib/client";

export function BudgetPanel({ plan, onSaved }: { plan: Plan; onSaved: (p: Plan) => void }) {
  const [items, setItems] = useState<PlanBudgetItem[]>(plan.budgetItems);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const totalMin = items.reduce((s, it) => s + it.unitCostMin * it.quantity, 0);
  const totalMax = items.reduce((s, it) => s + it.unitCostMax * it.quantity, 0);

  function update(id: string, patch: Partial<PlanBudgetItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    setDirty(true);
  }
  function add() {
    setItems((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, category: "misc", label: "New item", quantity: 1, unitCostMin: 0, unitCostMax: 0, estimated: true, assumption: null },
    ]);
    setDirty(true);
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/budget`, "POST", {
        items: items.map(({ id, ...rest }) => rest),
      });
      onSaved(data.plan);
      setItems(data.plan.budgetItems);
      setDirty(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save budget.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Budget estimate</h3>
        <span className="text-sm text-saffron-400">
          {formatINR(totalMin)} – {formatINR(totalMax)}
        </span>
      </div>
      <p className="text-xs text-white/50">All figures are editable estimates, not vendor quotes.</p>

      <div className="vv-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-xs text-white/50">
            <tr className="border-b border-white/10 text-left">
              <th className="py-2">Item</th>
              <th>Category</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Min</th>
              <th className="text-right">Max</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-white/5">
                <td className="py-1.5">
                  <input value={it.label} onChange={(e) => update(it.id, { label: e.target.value })} className="w-full rounded bg-white/5 px-2 py-1" />
                </td>
                <td>
                  <input value={it.category} onChange={(e) => update(it.id, { category: e.target.value })} className="w-28 rounded bg-white/5 px-2 py-1" />
                </td>
                <td className="text-right">
                  <input type="number" value={it.quantity} onChange={(e) => update(it.id, { quantity: Number(e.target.value) })} className="w-16 rounded bg-white/5 px-2 py-1 text-right" />
                </td>
                <td className="text-right">
                  <input type="number" value={it.unitCostMin} onChange={(e) => update(it.id, { unitCostMin: Number(e.target.value) })} className="w-24 rounded bg-white/5 px-2 py-1 text-right" />
                </td>
                <td className="text-right">
                  <input type="number" value={it.unitCostMax} onChange={(e) => update(it.id, { unitCostMax: Number(e.target.value) })} className="w-24 rounded bg-white/5 px-2 py-1 text-right" />
                </td>
                <td className="text-right">
                  <button onClick={() => remove(it.id)} className="text-xs text-red-300 hover:text-red-200">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button onClick={add} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5">
          + Add line
        </button>
        <button onClick={save} disabled={saving || !dirty} className="rounded-lg bg-saffron-500 px-4 py-1.5 text-sm font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-50">
          {saving ? "Saving…" : dirty ? "Save budget" : "Saved"}
        </button>
      </div>
    </div>
  );
}
