"use client";

import { useMemo, useState } from "react";
import type { Plan } from "./types";
import { formatINR } from "@/lib/client";
import { seatingStatus } from "@/lib/seating";
import { SampleBadge, LiveBadge } from "@/components/ui/Badges";

export function SummaryPanel({ plan }: { plan: Plan }) {
  const [copied, setCopied] = useState(false);
  const seats = useMemo(() => seatingStatus(plan.guestCount, plan.layout?.objects ?? []), [plan]);

  const totalMin = plan.budgetItems.reduce((s, it) => s + it.unitCostMin * it.quantity, 0);
  const totalMax = plan.budgetItems.reduce((s, it) => s + it.unitCostMax * it.quantity, 0);

  // Outstanding planning tasks.
  const outstanding: string[] = [];
  if (!plan.selectedVenue) outstanding.push("Select a venue");
  if (!plan.startDate) outstanding.push("Set an event date");
  if ((plan.layout?.objects.length ?? 0) === 0) outstanding.push("Create a seating layout");
  if (seats.shortfall > 0) outstanding.push(`Seat ${seats.shortfall} more guests`);
  if (plan.budgetItems.length === 0) outstanding.push("Add a budget estimate");
  if (plan.tasks.filter((t) => !t.done).length > 0) outstanding.push(`${plan.tasks.filter((t) => !t.done).length} timeline tasks pending`);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/plan/${plan.shareToken}` : "";

  function copyShare() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const dateLabel = plan.startDate
    ? new Date(plan.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Not set";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Event" value={plan.eventType.name} sub={plan.eventType.categoryName} />
        <Stat label="City" value={plan.city} sub={plan.styles.join(", ") || "No style set"} />
        <Stat label="Date" value={dateLabel} sub={plan.endDate && plan.endDate !== plan.startDate ? `to ${new Date(plan.endDate).toLocaleDateString("en-IN")}` : "Single day"} />
        <Stat label="Guests" value={`${plan.guestCount}`} sub={`${seats.seatsConfigured} seats placed`} />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Estimated cost (editable)</span>
          <span className="font-medium text-saffron-400">
            {formatINR(totalMin)} – {formatINR(totalMax)}
          </span>
        </div>
        <div className="mt-1 text-xs text-white/40">Target budget: {plan.budget ? formatINR(plan.budget) : "not set"}</div>
      </div>

      {/* Selected venue */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Selected venue</span>
          {plan.selectedVenue && (plan.selectedVenue.isSample ? <SampleBadge /> : <LiveBadge />)}
        </div>
        {plan.selectedVenue ? (
          <div>
            <div className="font-medium">{plan.selectedVenue.name}</div>
            {plan.selectedVenue.address && <div className="text-xs text-white/55">{plan.selectedVenue.address}</div>}
            {plan.selectedVenue.attribution && <div className="mt-1 text-[10px] text-white/40">{plan.selectedVenue.attribution}</div>}
          </div>
        ) : (
          <p className="text-sm text-white/50">No venue selected yet. Use Venue discovery to choose one.</p>
        )}
      </div>

      {/* Outstanding tasks */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <span className="text-sm font-medium">Outstanding</span>
        {outstanding.length === 0 ? (
          <p className="mt-2 text-sm text-peacock-400">Everything looks set. 🎉</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {outstanding.map((o) => (
              <li key={o} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {o}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={copyShare} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">
          {copied ? "Link copied ✓" : "Copy share link"}
        </button>
        <span className="truncate text-xs text-white/40">{shareUrl}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
      {sub && <div className="text-xs text-white/50">{sub}</div>}
    </div>
  );
}
