"use client";

import type { SeatingStats } from "@/lib/showcaseSeating";
import type { EventEnvironment } from "@/lib/eventEnvironment";

// Colourful info panel beside the 3D model. Shows the event facts, a capacity
// bar chart (arranged vs available, and real occupancy only when present), and
// a grid of stat chips. Never renders fabricated occupancy.

function StatChip({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[11px] uppercase tracking-wide text-white/55">{label}</span>
      </div>
      <div className="mt-1 font-display text-xl font-semibold text-white">{value}</div>
      {sub && <div className="text-[11px] text-white/45">{sub}</div>}
    </div>
  );
}

export function SeatingStatsPanel({
  env,
  stats,
  eventName,
  eventTypeName,
  guestCount,
  roomWidth,
  roomDepth,
  isSampleVenue,
}: {
  env: EventEnvironment;
  stats: SeatingStats;
  eventName: string;
  eventTypeName: string;
  guestCount: number;
  roomWidth: number;
  roomDepth: number;
  isSampleVenue: boolean;
}) {
  const cap = Math.max(1, stats.totalCapacity);
  const arrangedPct = Math.round((stats.seatsArranged / cap) * 100);
  const availablePct = Math.round((stats.availableSeats / cap) * 100);
  const occupiedPct = typeof stats.occupiedSeats === "number" ? Math.round((stats.occupiedSeats / cap) * 100) : null;

  const [c0, c1, c2] = env.palette;

  return (
    <aside className="vv-scroll max-h-[680px] overflow-y-auto rounded-2xl border border-white/10 vv-glass p-4">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          {env.palette.slice(0, 4).map((c) => (
            <span key={c} className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ background: c }} />
          ))}
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold text-white">{eventName}</h3>
        <p className="text-sm text-saffron-400">{env.displayName}</p>
        <p className="mt-1 text-xs text-white/55">{env.vibe}</p>
      </div>

      {isSampleVenue && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
          Sample venue preview — these dimensions are a representative example, not a specific confirmed venue.
        </p>
      )}

      {/* Capacity chart */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-white/60">
          <span>Seating capacity</span>
          <span>{stats.totalCapacity} total</span>
        </div>
        <div className="flex h-5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10" role="img" aria-label={`${stats.seatsArranged} arranged, ${stats.availableSeats} available of ${stats.totalCapacity}`}>
          <div className="h-full" style={{ width: `${arrangedPct}%`, background: c0 }} title={`Arranged: ${stats.seatsArranged}`} />
          {occupiedPct !== null && (
            <div className="h-full" style={{ width: `${occupiedPct}%`, background: c2 ?? "#10b981" }} title={`Occupied: ${stats.occupiedSeats}`} />
          )}
          <div className="h-full" style={{ width: `${availablePct}%`, background: "rgba(255,255,255,0.12)" }} title={`Available: ${stats.availableSeats}`} />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/60">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: c0 }} />Arranged {stats.seatsArranged}</span>
          {occupiedPct !== null && (
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: c2 ?? "#10b981" }} />Occupied {stats.occupiedSeats}</span>
          )}
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white/25" />Available {stats.availableSeats}</span>
        </div>
      </div>

      {/* Stat grid */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatChip label="Guests" value={guestCount} color={c1 ?? "#f7c948"} />
        <StatChip label="Total seats" value={stats.totalCapacity} color={c0 ?? "#f5a623"} />
        <StatChip label="Arranged" value={stats.seatsArranged} color={c0 ?? "#f5a623"} />
        <StatChip label="Available" value={stats.availableSeats} color="#64748b" />
        <StatChip label="Tables" value={stats.tableCount} color={c1 ?? "#f7c948"} />
        <StatChip label="Dining seats" value={stats.diningCapacity} color={c2 ?? "#2dd4bf"} />
        {stats.theatreSeats > 0 && <StatChip label="Theatre seats" value={stats.theatreSeats} color={c2 ?? "#2dd4bf"} />}
        {typeof stats.occupiedSeats === "number" && <StatChip label="Reserved" value={stats.occupiedSeats} color="#10b981" />}
      </div>

      {/* Venue facts */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
        <Row label="Event type" value={eventTypeName} />
        <Row label="Venue dimensions" value={`${roomWidth} × ${roomDepth} m`} />
        <Row label="Floor area" value={`${roomWidth * roomDepth} m²`} />
        <Row label="Stage" value={`${stats.stage.width} × ${stats.stage.depth} m`} />
        <Row label="Dining capacity" value={`${stats.diningCapacity} seats`} />
        <Row label="Arrangement" value={labelForArrangement(env.arrangement)} last />
      </div>

      <p className="mt-3 text-[10px] text-white/40">
        Showcase preview — an illustrative, event-specific arrangement generated from your guest count, venue size and event
        type. Not an architectural replica. Seat counts are computed, never fabricated.
      </p>
    </aside>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${last ? "" : "border-b border-white/8"}`}>
      <span className="text-white/55">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function labelForArrangement(a: EventEnvironment["arrangement"]): string {
  switch (a) {
    case "banquet-round":
      return "Round-table banquet";
    case "theatre":
      return "Theatre / auditorium";
    case "cluster":
      return "Lounge clusters";
    case "u-shape":
      return "U-shape tables";
    default:
      return a;
  }
}
