// Event → 3D environment mapping. Pure, dependency-free, and unit-testable.
//
// Given an event type slug, cultural styles, and any theme colours already
// applied to the plan, this resolves a complete "EventEnvironment": the palette,
// lighting mood, floor/wall colours, the set of decorations to render, the stage
// treatment, and the seating-arrangement style. The 3D scene reads ONLY this
// object, so each event looks genuinely different — never the same colours and
// decor for every event (an explicit requirement).

export type ArrangementStyle =
  | "banquet-round" // round tables (weddings, receptions, banquets)
  | "theatre" // rows of chairs facing a stage (conferences, community, cultural)
  | "cluster" // small clusters + lounge (birthdays, parties)
  | "u-shape"; // U-shaped tables (small corporate / meetings)

export type DecorationKind =
  | "mandap" // ornate wedding canopy
  | "floral-arch" // entrance / stage floral arch
  | "brass-lamp" // kuthuvilakku / nilavilakku standing lamps
  | "kerala-lamp" // tall Kerala nilavilakku
  | "banana-leaf" // banana-leaf dining accents
  | "balloon-cluster" // birthday balloons
  | "cake-table" // birthday cake table
  | "backdrop-panel" // themed photo backdrop
  | "pedestal-floral" // floral pedestals flanking the stage
  | "lantern-string" // hanging string lights / lanterns
  | "podium" // speaker podium (corporate / community)
  | "pillar"; // decorative pillars

export type LightingMood = {
  // Hemisphere + key light colours and intensities.
  ambient: string;
  ambientIntensity: number;
  key: string;
  keyIntensity: number;
  // Accent spotlights (e.g. warm uplighting on the stage).
  accent: string;
  accentIntensity: number;
  // Background clear colour for the canvas.
  background: string;
};

export type EventEnvironment = {
  // Human labels for the info panel.
  eventKey: string; // normalized key we matched
  displayName: string;
  // Colour system.
  palette: string[]; // 3–5 hex swatches for the panel + accents
  floorColor: string;
  wallColor: string;
  carpetColor: string; // aisle / central runner
  stageColor: string;
  accentColor: string;
  // Mood.
  lighting: LightingMood;
  // What to render.
  decorations: DecorationKind[];
  arrangement: ArrangementStyle;
  // Whether a dance floor fits this event.
  hasDanceFloor: boolean;
  // Short descriptor shown under the title.
  vibe: string;
};

// Base lighting presets reused across families.
const WARM_TRADITIONAL: LightingMood = {
  ambient: "#3a2a1a",
  ambientIntensity: 0.7,
  key: "#ffd9a0",
  keyIntensity: 1.15,
  accent: "#ff8a3d",
  accentIntensity: 0.8,
  background: "#140d08",
};

const ROYAL: LightingMood = {
  ambient: "#2a1a24",
  ambientIntensity: 0.7,
  key: "#ffe3c2",
  keyIntensity: 1.2,
  accent: "#ffcf5c",
  accentIntensity: 0.9,
  background: "#17090f",
};

const SERENE: LightingMood = {
  ambient: "#2f2d26",
  ambientIntensity: 0.85,
  key: "#fff3df",
  keyIntensity: 1.1,
  accent: "#d9b36a",
  accentIntensity: 0.6,
  background: "#12100b",
};

const PASTEL_ELEGANT: LightingMood = {
  ambient: "#33262e",
  ambientIntensity: 0.9,
  key: "#ffe8ef",
  keyIntensity: 1.1,
  accent: "#e6a4b4",
  accentIntensity: 0.7,
  background: "#160e13",
};

const VIBRANT: LightingMood = {
  ambient: "#20283a",
  ambientIntensity: 1.0,
  key: "#ffffff",
  keyIntensity: 1.2,
  accent: "#ff5db1",
  accentIntensity: 0.9,
  background: "#0d1020",
};

const NEUTRAL_HALL: LightingMood = {
  ambient: "#27272e",
  ambientIntensity: 1.0,
  key: "#eef1ff",
  keyIntensity: 1.15,
  accent: "#5b8bd0",
  accentIntensity: 0.55,
  background: "#0b0c12",
};

// Named environment builders (each a distinct look).
const ENV: Record<string, EventEnvironment> = {
  "tamil-wedding": {
    eventKey: "tamil-wedding",
    displayName: "Tamil / South Indian Wedding",
    palette: ["#c81d4e", "#ffd24c", "#0d9488", "#fff4e8"],
    floorColor: "#3b2416",
    wallColor: "#4a2d1c",
    carpetColor: "#9e1b3f",
    stageColor: "#c81d4e",
    accentColor: "#ffd24c",
    lighting: WARM_TRADITIONAL,
    decorations: ["mandap", "brass-lamp", "floral-arch", "banana-leaf", "pedestal-floral"],
    arrangement: "banquet-round",
    hasDanceFloor: false,
    vibe: "Traditional mandapam, jasmine, brass lamps and banana-leaf dining.",
  },
  "kerala-wedding": {
    eventKey: "kerala-wedding",
    displayName: "Kerala Wedding",
    palette: ["#fff4e8", "#ffd24c", "#0d9488", "#8a6d3b"],
    floorColor: "#2f2a1f",
    wallColor: "#3c3626",
    carpetColor: "#b89a52",
    stageColor: "#0d9488",
    accentColor: "#ffd24c",
    lighting: SERENE,
    decorations: ["kerala-lamp", "floral-arch", "pedestal-floral", "banana-leaf"],
    arrangement: "banquet-round",
    hasDanceFloor: false,
    vibe: "Cream, gold and green with tall nilavilakku lamps and floral elegance.",
  },
  "north-indian-wedding": {
    eventKey: "north-indian-wedding",
    displayName: "North Indian Wedding",
    palette: ["#b11226", "#ffcf5c", "#fff1dc", "#7a0f2b"],
    floorColor: "#3a1420",
    wallColor: "#4a1a28",
    carpetColor: "#8f1327",
    stageColor: "#b11226",
    accentColor: "#ffcf5c",
    lighting: ROYAL,
    decorations: ["mandap", "floral-arch", "pedestal-floral", "lantern-string", "pillar"],
    arrangement: "banquet-round",
    hasDanceFloor: true,
    vibe: "Royal red, gold and ivory with a grand floral mandap.",
  },
  birthday: {
    eventKey: "birthday",
    displayName: "Birthday Party",
    palette: ["#ff5db1", "#ffd23f", "#3ec1ff", "#7c5cff"],
    floorColor: "#241a33",
    wallColor: "#2c2140",
    carpetColor: "#ff5db1",
    stageColor: "#7c5cff",
    accentColor: "#ffd23f",
    lighting: VIBRANT,
    decorations: ["balloon-cluster", "cake-table", "backdrop-panel", "lantern-string"],
    arrangement: "cluster",
    hasDanceFloor: true,
    vibe: "Colourful balloons, a cake table and a vibrant themed backdrop.",
  },
  "engagement-reception": {
    eventKey: "engagement-reception",
    displayName: "Engagement / Reception",
    palette: ["#e6a4b4", "#f3d9c6", "#c9a24a", "#fff4ef"],
    floorColor: "#2a2026",
    wallColor: "#352833",
    carpetColor: "#d9a7b4",
    stageColor: "#c98a9b",
    accentColor: "#c9a24a",
    lighting: PASTEL_ELEGANT,
    decorations: ["floral-arch", "backdrop-panel", "pedestal-floral", "lantern-string"],
    arrangement: "banquet-round",
    hasDanceFloor: true,
    vibe: "Elegant pastels, rose-gold accents and a premium stage.",
  },
  community: {
    eventKey: "community",
    displayName: "Community Event",
    palette: ["#5b8bd0", "#e2e8f0", "#f5a623", "#334155"],
    floorColor: "#1f232c",
    wallColor: "#2a2f3a",
    carpetColor: "#3f5a86",
    stageColor: "#5b8bd0",
    accentColor: "#f5a623",
    lighting: NEUTRAL_HALL,
    decorations: ["podium", "backdrop-panel", "pillar"],
    arrangement: "theatre",
    hasDanceFloor: false,
    vibe: "Auditorium-style seating, a central stage and clear walking paths.",
  },
  // A sensible, still-distinct default for events without a bespoke look.
  celebration: {
    eventKey: "celebration",
    displayName: "Celebration",
    palette: ["#f5a623", "#f7c948", "#2dd4bf", "#fff4e8"],
    floorColor: "#241f17",
    wallColor: "#30291d",
    carpetColor: "#c89a3a",
    stageColor: "#f5a623",
    accentColor: "#2dd4bf",
    lighting: WARM_TRADITIONAL,
    decorations: ["floral-arch", "backdrop-panel", "lantern-string"],
    arrangement: "banquet-round",
    hasDanceFloor: true,
    vibe: "A warm, festive celebration layout.",
  },
};

// Event-type slug → environment key. Anything unmatched falls back by category
// heuristics in resolveEventEnvironment().
const SLUG_TO_ENV: Record<string, string> = {
  "tamil-wedding": "tamil-wedding",
  "kerala-wedding": "kerala-wedding",
  "telugu-wedding": "tamil-wedding", // closest South-Indian traditional look
  "kannada-wedding": "tamil-wedding",
  "north-indian-wedding": "north-indian-wedding",
  reception: "engagement-reception",
  engagement: "engagement-reception",
  mehndi: "north-indian-wedding",
  sangeet: "north-indian-wedding",
  birthday: "birthday",
  anniversary: "engagement-reception",
  "baby-shower": "birthday",
  "naming-ceremony": "celebration",
  housewarming: "celebration",
  retirement: "community",
  // Cultural & religious / education / corporate / community → theatre halls.
  "festival-celebration": "celebration",
  "temple-function": "celebration",
  pooja: "celebration",
  "cultural-program": "community",
  "traditional-ceremony": "celebration",
  conference: "community",
  seminar: "community",
  "product-launch": "community",
  "annual-day": "community",
  "award-ceremony": "community",
  "school-annual-day": "community",
  "college-fest": "community",
  graduation: "community",
  "alumni-reunion": "community",
  reunion: "celebration",
  fundraiser: "community",
  "community-gathering": "community",
  "charity-event": "community",
  concert: "community",
  "live-performance": "community",
  "dance-music-show": "community",
  "private-party": "birthday",
  "catering-event": "celebration",
  banquet: "engagement-reception",
  "tasting-event": "celebration",
  "food-festival": "celebration",
};

// Style override: if a wedding slug wasn't matched but a cultural style is set,
// use it to pick the regional wedding look.
const STYLE_TO_WEDDING: Record<string, string> = {
  tamil: "tamil-wedding",
  telugu: "tamil-wedding",
  kannada: "tamil-wedding",
  kerala: "kerala-wedding",
  "north-indian": "north-indian-wedding",
};

export type ResolveInput = {
  eventTypeSlug: string;
  categorySlug?: string | null;
  styles?: string[];
  // Theme colours already applied to the plan (from the theme gallery).
  themeStageColor?: string | null;
  themeAccentColor?: string | null;
};

// Resolve the full environment for an event. Deterministic and side-effect free.
export function resolveEventEnvironment(input: ResolveInput): EventEnvironment {
  const slug = (input.eventTypeSlug || "").toLowerCase().trim();

  let key = SLUG_TO_ENV[slug];

  // Wedding-ish slug we didn't list explicitly → use style.
  if (!key && slug.includes("wedding")) {
    const style = (input.styles ?? [])[0];
    key = (style && STYLE_TO_WEDDING[style]) || "tamil-wedding";
  }

  // Category heuristics for anything still unmatched.
  if (!key) {
    const cat = (input.categorySlug || "").toLowerCase();
    if (cat === "corporate" || cat === "education" || cat === "social-community" || cat === "entertainment") {
      key = "community";
    } else if (cat === "weddings") {
      const style = (input.styles ?? [])[0];
      key = (style && STYLE_TO_WEDDING[style]) || "engagement-reception";
    } else {
      key = "celebration";
    }
  }

  const base = ENV[key] ?? ENV.celebration;

  // Applied theme colours (if any) take precedence for stage/accent, so the
  // Theme gallery continues to visibly drive the 3D look.
  const stageColor = input.themeStageColor?.trim() || base.stageColor;
  const accentColor = input.themeAccentColor?.trim() || base.accentColor;

  // Return a fresh object so callers can't mutate the shared presets.
  return {
    ...base,
    stageColor,
    accentColor,
    palette: [stageColor, accentColor, ...base.palette].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5),
  };
}
