// Derive honest venue dimensions for the 3D showcase.
//
// Priority:
//   1. If the plan already has a saved 3D layout with room size, use it (the
//      user's own planner dimensions) — treated as NOT a sample.
//   2. If a selected venue has a verified capacity, size the room to fit that
//      capacity at a realistic density — NOT a sample (grounded in real data).
//   3. Otherwise, generate a representative room scaled to the guest count and
//      flag it as a SAMPLE preview (honestly labelled in the UI).

import type { Plan } from "@/components/planner/types";

export type DerivedDimensions = {
  width: number;
  depth: number;
  isSample: boolean;
  // Where the size came from, for transparency.
  source: "layout" | "venue-capacity" | "sample";
};

const AREA_PER_GUEST = 1.5; // m² per guest for a mixed seated event (realistic)
const ASPECT = 1.3; // width:depth ratio for a typical hall

function sizeForCapacity(capacity: number): { width: number; depth: number } {
  const area = Math.max(60, capacity * AREA_PER_GUEST);
  // area = width * depth, width = depth * ASPECT  => depth = sqrt(area/ASPECT)
  const depth = Math.sqrt(area / ASPECT);
  const width = depth * ASPECT;
  // Clamp + round to whole metres (hall-like, matches planner min/max).
  return {
    width: clamp(Math.round(width), 10, 90),
    depth: clamp(Math.round(depth), 8, 70),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function deriveVenueDimensions(plan: Plan): DerivedDimensions {
  // 1. Existing saved layout dimensions.
  if (plan.layout && plan.layout.roomWidth > 0 && plan.layout.roomDepth > 0) {
    return {
      width: Math.round(plan.layout.roomWidth),
      depth: Math.round(plan.layout.roomDepth),
      isSample: false,
      source: "layout",
    };
  }

  // 2. Selected venue with a real, verified capacity.
  const v = plan.selectedVenue;
  const capacity = v?.capacityMax ?? v?.capacityMin ?? null;
  if (v && typeof capacity === "number" && capacity > 0) {
    const { width, depth } = sizeForCapacity(capacity);
    return { width, depth, isSample: false, source: "venue-capacity" };
  }

  // 3. Representative sample sized to the guest count.
  const { width, depth } = sizeForCapacity(Math.max(20, plan.guestCount));
  return { width, depth, isSample: true, source: "sample" };
}
