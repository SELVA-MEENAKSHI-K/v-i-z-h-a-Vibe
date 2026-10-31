// Showcase seating generator + statistics. Pure and unit-testable.
//
// Produces ONE realistic, event-appropriate arrangement for the showcase 3D
// view and a set of ACCURATE statistics. It never fabricates occupancy or
// reservation data: "occupied" is only ever reported when real reservation
// data is supplied by the caller (none exists today, so it is omitted).

import type { ArrangementStyle } from "./eventEnvironment";

export type ShowcaseTable = {
  id: string;
  shape: "round" | "rect";
  x: number;
  z: number;
  seats: number;
  // Precomputed seat ring positions (relative to the table centre).
  seatAngles: number[];
};

export type ShowcaseChairRow = {
  id: string;
  x: number;
  z: number;
  rotY: number;
  seats: number;
  seatSpacing: number;
};

export type StagePlacement = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
};

export type ShowcaseArrangement = {
  tables: ShowcaseTable[];
  chairRows: ShowcaseChairRow[];
  stage: StagePlacement;
  // Dance floor rectangle (null when the event has none).
  danceFloor: { x: number; z: number; width: number; depth: number } | null;
  // Aisle runner down the centre (for theatre-style walking paths).
  aisle: { width: number } | null;
};

export type SeatingStats = {
  guestCount: number;
  // Theoretical capacity the room+arrangement can hold.
  totalCapacity: number;
  // Seats actually placed by the arrangement.
  seatsArranged: number;
  // totalCapacity - seatsArranged (never negative).
  availableSeats: number;
  // Real reservations only — undefined when no reservation data exists.
  occupiedSeats?: number;
  tableCount: number;
  diningSeats: number; // seats at tables (dining)
  theatreSeats: number; // seats in chair rows
  // Stage footprint in metres (for the panel).
  stage: { width: number; depth: number };
  // Dining-area capacity (same as diningSeats; exposed for the panel label).
  diningCapacity: number;
};

const SEATS_PER_ROUND = 8;
const SEATS_PER_RECT = 10;

function roundTo(n: number): number {
  return Number(n.toFixed(2));
}

// Seat ring angles for a round table.
function ringAngles(seats: number): number[] {
  return Array.from({ length: seats }, (_, i) => (i / seats) * Math.PI * 2);
}

export type GenerateInput = {
  guestCount: number;
  roomWidth: number;
  roomDepth: number;
  arrangement: ArrangementStyle;
  hasDanceFloor: boolean;
};

// Build the arrangement geometry. Everything is centred at the origin; +Z is
// toward the entrance (back), -Z is toward the stage (front).
export function generateShowcaseArrangement(input: GenerateInput): ShowcaseArrangement {
  const { guestCount, roomWidth, roomDepth, arrangement, hasDanceFloor } = input;

  // Stage sized to the room (clamped). Sits at the front (-Z).
  const stageWidth = Math.max(5, Math.min(roomWidth * 0.5, 12));
  const stageDepth = Math.max(2.5, Math.min(roomDepth * 0.18, 4));
  const stage: StagePlacement = {
    x: 0,
    z: roundTo(-roomDepth / 2 + stageDepth / 2 + 0.5),
    width: roundTo(stageWidth),
    depth: roundTo(stageDepth),
    height: 0.6,
  };

  const tables: ShowcaseTable[] = [];
  const chairRows: ShowcaseChairRow[] = [];
  let danceFloor: ShowcaseArrangement["danceFloor"] = null;
  let aisle: ShowcaseArrangement["aisle"] = null;

  // Front clearance after the stage (and dance floor, if any).
  let frontZ = stage.z + stageDepth / 2;
  if (hasDanceFloor) {
    const dfW = Math.min(roomWidth * 0.3, 7);
    const dfD = Math.min(roomDepth * 0.18, 5);
    danceFloor = {
      x: 0,
      z: roundTo(frontZ + dfD / 2 + 0.8),
      width: roundTo(dfW),
      depth: roundTo(dfD),
    };
    frontZ = danceFloor.z + dfD / 2;
  }

  // Seating region: from frontZ (+clearance) to the back wall (-clearance).
  const regionStartZ = frontZ + 1.5;
  const regionEndZ = roomDepth / 2 - 1.5;
  const usableDepth = Math.max(2, regionEndZ - regionStartZ);
  const usableWidth = Math.max(2, roomWidth - 3); // side clearance

  if (arrangement === "theatre") {
    // Rows of chairs with a central aisle.
    const aisleWidth = 1.6;
    aisle = { width: aisleWidth };
    const rowSpacing = 0.95;
    const seatSpacing = 0.55;
    const halfWidth = (usableWidth - aisleWidth) / 2;
    const seatsPerHalf = Math.max(1, Math.floor(halfWidth / seatSpacing));
    const rows = Math.max(1, Math.floor(usableDepth / rowSpacing));
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      const z = roundTo(regionStartZ + r * rowSpacing);
      // Left block + right block.
      chairRows.push({
        id: `rowL-${r}`,
        x: roundTo(-aisleWidth / 2 - (seatsPerHalf * seatSpacing) / 2),
        z,
        rotY: 0,
        seats: seatsPerHalf,
        seatSpacing,
      });
      chairRows.push({
        id: `rowR-${r}`,
        x: roundTo(aisleWidth / 2 + (seatsPerHalf * seatSpacing) / 2),
        z,
        rotY: 0,
        seats: seatsPerHalf,
        seatSpacing,
      });
      idx += seatsPerHalf * 2;
      if (idx >= guestCount + seatsPerHalf * 2) break; // a little surplus, then stop
    }
  } else if (arrangement === "u-shape") {
    // A single U of rectangular tables around the front.
    const positions: [number, number][] = [
      [-usableWidth / 3, regionStartZ + 1],
      [0, regionStartZ + 1],
      [usableWidth / 3, regionStartZ + 1],
      [-usableWidth / 2 + 1, regionStartZ + 3],
      [usableWidth / 2 - 1, regionStartZ + 3],
    ];
    positions.forEach(([x, z], i) => {
      tables.push({
        id: `t-${i}`,
        shape: "rect",
        x: roundTo(x),
        z: roundTo(z),
        seats: SEATS_PER_RECT,
        seatAngles: [],
      });
    });
  } else {
    // banquet-round + cluster: a grid of round tables sized to guests.
    const spacing = arrangement === "cluster" ? 3.6 : 3.1;
    const tableRadius = 0.9;
    const cols = Math.max(1, Math.floor(usableWidth / spacing));
    const needed = Math.max(1, Math.ceil(guestCount / SEATS_PER_ROUND));
    const rowsFit = Math.max(1, Math.floor(usableDepth / spacing));
    const maxTables = cols * rowsFit;
    const tableCount = Math.min(needed, maxTables);

    for (let i = 0; i < tableCount; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = -((cols - 1) * spacing) / 2 + c * spacing;
      const z = regionStartZ + tableRadius + r * spacing;
      if (z > regionEndZ) break;
      tables.push({
        id: `t-${i}`,
        shape: "round",
        x: roundTo(x),
        z: roundTo(z),
        seats: SEATS_PER_ROUND,
        seatAngles: ringAngles(SEATS_PER_ROUND),
      });
    }
  }

  return { tables, chairRows, stage, danceFloor, aisle };
}

// Compute accurate statistics from an arrangement.
// `reservedSeats` is optional REAL reservation data; omit it entirely when none
// exists (we never invent occupancy).
export function computeSeatingStats(
  guestCount: number,
  roomWidth: number,
  roomDepth: number,
  arrangement: ShowcaseArrangement,
  reservedSeats?: number,
): SeatingStats {
  const diningSeats = arrangement.tables.reduce((s, t) => s + t.seats, 0);
  const theatreSeats = arrangement.chairRows.reduce((s, r) => s + r.seats, 0);
  const seatsArranged = diningSeats + theatreSeats;

  // Theoretical capacity: how many guests the room could seat at this density.
  // Use the arrangement's own seat density but allow headroom up to the room
  // footprint. We report capacity as the greater of seatsArranged and a
  // room-based estimate, so "available" is meaningful and never negative.
  const areaPerSeat = theatreSeats > seatsArranged / 2 ? 0.9 : 1.4; // m² per seat
  const usableArea = Math.max(0, (roomWidth - 3) * (roomDepth - 3));
  const roomCapacity = Math.floor(usableArea / areaPerSeat);
  const totalCapacity = Math.max(seatsArranged, roomCapacity);

  const availableSeats = Math.max(0, totalCapacity - seatsArranged);

  const stats: SeatingStats = {
    guestCount,
    totalCapacity,
    seatsArranged,
    availableSeats,
    tableCount: arrangement.tables.length,
    diningSeats,
    theatreSeats,
    stage: { width: arrangement.stage.width, depth: arrangement.stage.depth },
    diningCapacity: diningSeats,
  };

  // Only attach occupancy when REAL reservation data is provided.
  if (typeof reservedSeats === "number" && reservedSeats >= 0) {
    stats.occupiedSeats = Math.min(reservedSeats, seatsArranged);
  }

  return stats;
}
