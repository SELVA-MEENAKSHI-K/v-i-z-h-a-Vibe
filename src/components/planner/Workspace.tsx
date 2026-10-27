"use client";

import { useState } from "react";
import type { Plan } from "./types";
import { Explorer } from "./Explorer";
import { VenueDiscovery } from "./VenueDiscovery";
import { AiTools } from "./AiTools";
import { BudgetPanel } from "./BudgetPanel";
import { TimelinePanel } from "./TimelinePanel";
import { SummaryPanel } from "./SummaryPanel";
import { Chatbot } from "./Chatbot";

type Tab = "planner" | "venues" | "ai" | "budget" | "timeline" | "summary";

const TABS: { id: Tab; label: string }[] = [
  { id: "planner", label: "3D Planner" },
  { id: "venues", label: "Venue discovery" },
  { id: "ai", label: "AI tools" },
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "summary", label: "Summary" },
];

export function Workspace({ initialPlan }: { initialPlan: Plan }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [tab, setTab] = useState<Tab>("planner");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Plan header */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{plan.title}</h1>
          <p className="text-sm text-white/60">
            {plan.eventType.name} · {plan.city} · {plan.guestCount} guests
            {plan.styles.length ? ` · ${plan.styles.join(", ")}` : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-white/10 pb-px" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm ${
              tab === t.id ? "bg-white/8 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="min-h-[400px]">
        {tab === "planner" && <Explorer plan={plan} onSaved={setPlan} />}
        {tab === "venues" && (
          <div className="vv-glass rounded-2xl p-5">
            <VenueDiscovery plan={plan} onSaved={setPlan} />
          </div>
        )}
        {tab === "ai" && (
          <div className="vv-glass rounded-2xl p-5">
            <AiTools plan={plan} />
          </div>
        )}
        {tab === "budget" && (
          <div className="vv-glass rounded-2xl p-5">
            <BudgetPanel plan={plan} onSaved={setPlan} />
          </div>
        )}
        {tab === "timeline" && (
          <div className="vv-glass rounded-2xl p-5">
            <TimelinePanel plan={plan} />
          </div>
        )}
        {tab === "summary" && (
          <div className="vv-glass rounded-2xl p-5">
            <SummaryPanel plan={plan} />
          </div>
        )}
      </div>

      <Chatbot plan={plan} />
    </div>
  );
}
