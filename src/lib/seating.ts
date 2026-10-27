// Seating / layout math. Pure functions so they are easy to unit test and
// reuse in both the 3D scene and the 2D list alternative.

export type ObjectKind =
  | "round-table"
  | "rect-table"
  | "chair"
  | "stage"
  | "dance-floor"
  | "buffet"
  | "entrance"
  | "decor-arch"
  | "pillar"
  | "service";

export const SEATS_PER_OBJECT: Record<string, number> = {
  "round-table": 8,
  "rect-table": 10,
  chair: 1,
};

export type LayoutObjectLike = { kind: string; seats?: number };

// Total configured seats across placed objects.
export function totalSeats(objects: LayoutObjectLike[]): number {
  return objects.reduce((sum, o) => {
    const s = typeof o.seats === "number" && o.seats > 0 ? o.seats : SEATS_PER_OBJECT[o.kind] ?? 0;
    return sum + s;
  }, 0);
}

export type SeatingStatus = {
  guestCount: number;
  seatsConfigured: number;
  shortfall: number; // guests without a seat (0 if enough)
  surplus: number; // extra seats beyond guests
  tablesNeeded: number; // round tables to seat all guests
  utilizationPct: number; // seats used vs configured (0..100)
};

export function seatingStatus(guestCount: number, objects: LayoutObjectLike[], seatsPerTable = SEATS_PER_OBJECT["round-table"]): SeatingStatus {
  const seatsConfigured = totalSeats(objects);
  const shortfall = Math.max(0, guestCount - seatsConfigured);
  const surplus = Math.max(0, seatsConfigured - guestCount);
  const tablesNeeded = Math.ceil(guestCount / Math.max(1, seatsPerTable));
  const utilizationPct = seatsConfigured > 0 ? Math.min(100, Math.round((Math.min(guestCount, seatsConfigured) / seatsConfigured) * 100)) : 0;
  return { guestCount, seatsConfigured, shortfall, surplus, tablesNeeded, utilizationPct };
}

export type GeneratedObject = {
  kind: ObjectKind;
  label: string;
  posX: number;
  posY: number;
  posZ: number;
  rotY: number;
  scale: number;
  seats: number;
  style?: string;
};

// Generate a guest-count-aware starter layout: a stage, dance floor, buffet,
// entrance, and a grid of round tables sized to the guest count, laid out
// within the given room bounds (meters, centered at origin).
export function generateLayout(guestCount: number, roomWidth = 24, roomDepth = 18, seatsPerTable = SEATS_PER_OBJECT["round-table"]): GeneratedObject[] {
  const objects: GeneratedObject[] = [];

  // Fixed furniture.
  objects.push({ kind: "stage", label: "Stage", posX: 0, posY: 0, posZ: -roomDepth / 2 + 2, rotY: 0, scale: 1, seats: 0, style: "theme" });
  objects.push({ kind: "dance-floor", label: "Dance Floor", posX: 0, posY: 0, posZ: -roomDepth / 2 + 5.5, rotY: 0, scale: 1, seats: 0 });
  objects.push({ kind: "entrance", label: "Entrance", posX: 0, posY: 0, posZ: roomDepth / 2 - 1, rotY: 0, scale: 1, seats: 0 });
  objects.push({ kind: "buffet", label: "Buffet", posX: roomWidth / 2 - 2, posY: 0, posZ: 0, rotY: Math.PI / 2, scale: 1, seats: 0 });

  const tablesNeeded = Math.ceil(guestCount / Math.max(1, seatsPerTable));

  // Dining area occupies the rear 60% of the room (away from stage/entrance).
  const areaWidth = roomWidth - 6;
  const areaDepth = roomDepth * 0.5;
  const areaStartZ = -roomDepth / 2 + 8; // just behind the dance floor

  const spacing = 3.2; // meters between table centers
  const cols = Math.max(1, Math.floor(areaWidth / spacing));
  const rows = Math.max(1, Math.ceil(tablesNeeded / cols));

  let placed = 0;
  for (let r = 0; r < rows && placed < tablesNeeded; r++) {
    for (let c = 0; c < cols && placed < tablesNeeded; c++) {
      const x = -((cols - 1) * spacing) / 2 + c * spacing;
      const z = areaStartZ + r * spacing;
      // Keep within room depth.
      if (z > roomDepth / 2 - 2) break;
      objects.push({
        kind: "round-table",
        label: `Table ${placed + 1}`,
        posX: Number(x.toFixed(2)),
        posY: 0,
        posZ: Number(z.toFixed(2)),
        rotY: 0,
        scale: 1,
        seats: seatsPerTable,
      });
      placed++;
    }
  }

  return objects;
}
