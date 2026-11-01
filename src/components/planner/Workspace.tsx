"use client";

import { useState } from "react";
import type { Plan } from "./types";
import { VenueDiscovery } from "./VenueDiscovery";
import { VendorManagement } from "./VendorManagement";
import { AiTools } from "./AiTools";
import { BudgetPanel } from "./BudgetPanel";
import { TimelinePanel } from "./TimelinePanel";
import { SummaryPanel } from "./SummaryPanel";
import { Chatbot } from "./Chatbot";
import { MenuGallery } from "../menu/MenuGallery";
import { ThemeGallery } from "../themes/ThemeGallery";
import { PlanDashboard } from "./PlanDashboard";
import { EventShowcase } from "../showcase/EventShowcase";

type Tab = "showcase" | "venues" | "vendors" | "themes" | "menu" | "ai" | "budget" | "timeline" | "summary" | "finalplan";

const TABS: { id: Tab; label: string }[] = [
  { id: "showcase", label: "3D Showcase" },
  { id: "venues", label: "Venue discovery" },
  { id: "vendors", label: "Vendors" },
  { id: "themes", label: "Themes" },
  { id: "menu", label: "Food menu" },
  { id: "ai", label: "AI tools" },
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "summary", label: "Summary" },
  { id: "finalplan", label: "Final Plan ✦" },
];

export function Workspace({ initialPlan }: { initialPlan: Plan }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [tab, setTab] = useState<Tab>("showcase");

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      {/* Plan header */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold lg:text-4xl">{plan.title}</h1>
          <p className="mt-1 text-sm text-white/65 lg:text-base">
            {plan.eventType.name} · {plan.city} · {plan.guestCount} guests
            {plan.styles.length ? ` · ${plan.styles.join(", ")}` : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10 pb-px" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium lg:text-[15px] ${
              tab === t.id ? "bg-white/8 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="min-h-[400px]">
        {tab === "showcase" && (
          <div>
            <div className="mb-4">
              <h3 className="font-display text-2xl font-semibold">Immersive event seating showcase</h3>
              <p className="mt-1 max-w-3xl text-sm text-white/65 lg:text-base">
                An automatic, event-specific 3D arrangement built from your guest count, venue size and event type. Rotate,
                zoom and inspect — colours, decor and lighting adapt to the event.
              </p>
            </div>
            <EventShowcase plan={plan} />
          </div>
        )}
        {tab === "venues" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <VenueDiscovery plan={plan} onSaved={setPlan} />
          </div>
        )}
        {tab === "vendors" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <VendorManagement plan={plan} onSaved={setPlan} />
          </div>
        )}
        {tab === "themes" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <div className="mb-4">
              <h3 className="font-display text-2xl font-semibold">Theme inspiration gallery</h3>
              <p className="mt-1 max-w-3xl text-sm text-white/65 lg:text-base">
                Browse real wedding &amp; event theme photographs, filter by style, and apply one to drive your 3D planner.
              </p>
            </div>
            <ThemeGallery plan={plan} onApplied={setPlan} />
          </div>
        )}
        {tab === "menu" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <div className="mb-4">
              <h3 className="font-display text-2xl font-semibold">Visual food menu</h3>
              <p className="mt-1 max-w-3xl text-sm text-white/65 lg:text-base">
                Build your menu from image-rich dish cards. Totals update live from your guest count and per-plate prices.
              </p>
            </div>
            <MenuGallery plan={plan} />
          </div>
        )}
        {tab === "ai" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <AiTools plan={plan} />
          </div>
        )}
        {tab === "budget" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <BudgetPanel plan={plan} onSaved={setPlan} />
          </div>
        )}
        {tab === "timeline" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <TimelinePanel plan={plan} onSaved={setPlan} />
          </div>
        )}
        {tab === "summary" && (
          <div className="vv-glass rounded-2xl p-5 lg:p-6">
            <SummaryPanel plan={plan} />
          </div>
        )}
        {tab === "finalplan" && <PlanDashboard plan={plan} onSaved={setPlan} />}
      </div>

      <Chatbot plan={plan} />
    </div>
  );
}
