// Theme catalog — the single source of truth for the visual theme gallery.
//
// Image honesty: `image` points to a REAL, licensed photograph stored locally
// under /public/images/themes/<slug>.jpg (see scripts/download-theme-images.mjs),
// with attribution in `imageSource`. These are inspiration photos, never claimed
// to be a specific venue. If a slug has no downloaded photo, the UI shows a
// clearly-labelled designed fallback (never an empty area, never a toy drawing).

export type ThemeCategory = "wedding" | "decoration" | "event";

export type ThemeBudgetTier = "low" | "medium" | "premium" | "luxury";

export type ThemeRegion = "tamil" | "kerala" | "telugu" | "kannada" | "north-indian" | "rajasthani" | "mixed" | "modern";

export type Setting = "indoor" | "outdoor" | "both";

// Maps a theme to existing 3D planner assets/styling (no codegen — just tokens
// the Explorer/VenueScene already understand or can map to colours).
export type Theme3D = {
  // Stage/mandap accent + backdrop colours applied in the 3D scene.
  stageColor: string;
  accentColor: string;
  // Object "style" token written onto placed objects (stage/decor-arch).
  styleToken: string;
  // Whether we have a sensible 3D representation for this theme.
  available: boolean;
};

export type ThemeDef = {
  slug: string;
  name: string;
  category: ThemeCategory;
  region: ThemeRegion;
  budgetTier: ThemeBudgetTier;
  setting: Setting;
  // Guest-count suitability (advisory).
  guestMin: number;
  guestMax: number;
  // Short summary + bullet decor highlights.
  summary: string;
  decor: string[];
  // Colour palette (hex) — shown as swatches and used for 3D accents.
  palette: string[];
  // Indicative decoration budget range (INR). Clearly an estimate.
  decorBudgetMin: number;
  decorBudgetMax: number;
  // Detail-modal content.
  stageIdeas: string[];
  entranceIdeas: string[];
  lightingIdeas: string[];
  foodPresentation: string[];
  // Local photo + attribution (filled by the downloader).
  image: string | null;
  imageSource: string | null;
  // Extra related photos for the modal (local paths, optional).
  gallery?: string[];
  // 3D mapping.
  threeD: Theme3D;
};

export const THEME_CATEGORIES: { slug: ThemeCategory | "all"; name: string; icon: string }[] = [
  { slug: "all", name: "All Themes", icon: "✦" },
  { slug: "wedding", name: "Weddings", icon: "💍" },
  { slug: "decoration", name: "Decorations", icon: "🌸" },
  { slug: "event", name: "Other Events", icon: "🎉" },
];

export const THEME_REGIONS: { slug: ThemeRegion | "all"; name: string }[] = [
  { slug: "all", name: "All styles" },
  { slug: "tamil", name: "Tamil" },
  { slug: "kerala", name: "Kerala" },
  { slug: "telugu", name: "Telugu" },
  { slug: "kannada", name: "Kannada" },
  { slug: "north-indian", name: "North Indian" },
  { slug: "rajasthani", name: "Rajasthani" },
  { slug: "mixed", name: "Mixed" },
  { slug: "modern", name: "Modern" },
];

export const THEME_BUDGET_TIERS: { slug: ThemeBudgetTier | "all"; name: string }[] = [
  { slug: "all", name: "Any budget" },
  { slug: "low", name: "Low" },
  { slug: "medium", name: "Medium" },
  { slug: "premium", name: "Premium" },
  { slug: "luxury", name: "Luxury" },
];

// Helper to keep definitions compact.
function t(def: ThemeDef): ThemeDef {
  return def;
}

export const THEMES: ThemeDef[] = [
  // ---------------- Wedding themes ----------------
  t({
    slug: "tamil-traditional-wedding",
    name: "Traditional Tamil Wedding",
    category: "wedding",
    region: "tamil",
    budgetTier: "premium",
    setting: "indoor",
    guestMin: 150,
    guestMax: 800,
    summary: "Jasmine-forward mandap with brass lamps and banana-leaf dining — a classic Tamil muhurtham look.",
    decor: ["Jasmine (malligai) floral", "Brass lamps (kuthuvilakku)", "Banana-leaf dining", "Traditional mandap"],
    palette: ["#c81d4e", "#ffd24c", "#fff4e8", "#0d9488"],
    decorBudgetMin: 80000,
    decorBudgetMax: 300000,
    stageIdeas: ["Draped mandap with jasmine strings", "Brass lamp rows flanking the couple", "Floral backdrop in red & gold"],
    entranceIdeas: ["Kolam at the entrance", "Banana trunk & mango-leaf thoranam", "Jasmine arch"],
    lightingIdeas: ["Warm amber uplighting", "Oil-lamp glow near the stage"],
    foodPresentation: ["Sadya on banana leaf", "Filter coffee counter", "Traditional sweets display"],
    image: "/images/themes/tamil-traditional-wedding.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#c81d4e", accentColor: "#ffd24c", styleToken: "tamil-jasmine", available: true },
  }),
  t({
    slug: "kerala-heritage-wedding",
    name: "Kerala Heritage Wedding",
    category: "wedding",
    region: "kerala",
    budgetTier: "premium",
    setting: "both",
    guestMin: 150,
    guestMax: 700,
    summary: "White-and-gold elegance with nilavilakku lamps and jasmine — serene Kerala tradition.",
    decor: ["White & gold decoration", "Nilavilakku lamps", "Jasmine & white flowers", "Kerala-style mandap"],
    palette: ["#fff4e8", "#ffd24c", "#0d9488", "#1c1033"],
    decorBudgetMin: 90000,
    decorBudgetMax: 320000,
    stageIdeas: ["White drape with gold trim", "Rows of nilavilakku", "White floral backdrop"],
    entranceIdeas: ["Pookalam flower carpet", "Coconut-leaf decor", "Brass lamp walkway"],
    lightingIdeas: ["Soft white wash", "Lamp-lit aisle"],
    foodPresentation: ["Sadya banana-leaf service", "Payasam counter"],
    image: "/images/themes/kerala-heritage-wedding.jpg",
    imageSource: "Wikimedia Commons · Netha Hussain (CC BY-SA 4.0)",
    threeD: { stageColor: "#0d9488", accentColor: "#ffd24c", styleToken: "kerala-white-gold", available: true },
  }),
  t({
    slug: "telugu-wedding",
    name: "Telugu Wedding",
    category: "wedding",
    region: "telugu",
    budgetTier: "premium",
    setting: "indoor",
    guestMin: 150,
    guestMax: 800,
    summary: "Vibrant mango-leaf thoranam, marigold strings and silk drapes for a Telugu celebration.",
    decor: ["Mango-leaf thoranam", "Marigold strings", "Traditional kalasham", "Silk drapes"],
    palette: ["#ff9e2c", "#7c3aed", "#ffd24c", "#14b8a6"],
    decorBudgetMin: 80000,
    decorBudgetMax: 280000,
    stageIdeas: ["Silk-draped stage", "Marigold backdrop", "Kalasham accents"],
    entranceIdeas: ["Mango-leaf thoranam arch", "Marigold entrance"],
    lightingIdeas: ["Warm golden lighting", "Accent spots on the kalasham"],
    foodPresentation: ["Pulihora & regional thali", "Bobbatlu dessert table"],
    image: "/images/themes/telugu-wedding.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#ff9e2c", accentColor: "#7c3aed", styleToken: "telugu-marigold", available: true },
  }),
  t({
    slug: "kannada-wedding",
    name: "Kannada Wedding",
    category: "wedding",
    region: "kannada",
    budgetTier: "medium",
    setting: "indoor",
    guestMin: 100,
    guestMax: 600,
    summary: "Mysore-silk tones with sandalwood accents, jasmine and rose, and brass urli florals.",
    decor: ["Mysore silk accents", "Sandalwood-toned decor", "Jasmine & rose", "Brass urli with flowers"],
    palette: ["#f5820a", "#2dd4bf", "#ffd24c", "#6d28d9"],
    decorBudgetMin: 60000,
    decorBudgetMax: 220000,
    stageIdeas: ["Silk backdrop in royal tones", "Brass urli florals", "Carved-look mandap"],
    entranceIdeas: ["Rose & jasmine arch", "Rangoli entry"],
    lightingIdeas: ["Warm sandalwood glow", "Soft focus on urli"],
    foodPresentation: ["Bisi bele bath counter", "Mysore pak sweets"],
    image: "/images/themes/kannada-wedding.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#6d28d9", accentColor: "#f5820a", styleToken: "kannada-silk", available: true },
  }),
  t({
    slug: "north-indian-royal-wedding",
    name: "North Indian Royal Wedding",
    category: "wedding",
    region: "north-indian",
    budgetTier: "luxury",
    setting: "both",
    guestMin: 300,
    guestMax: 1500,
    summary: "A grand red-and-gold mandap, floral entrance and royal stage for a regal celebration.",
    decor: ["Grand red & gold mandap", "Floral entrance", "Royal stage decoration", "Mehendi & sangeet setups"],
    palette: ["#c81d4e", "#ffd24c", "#7c3aed", "#fff4e8"],
    decorBudgetMin: 250000,
    decorBudgetMax: 1500000,
    stageIdeas: ["Elevated royal stage", "Phoolon ki chadar", "Crystal + floral mandap"],
    entranceIdeas: ["Grand floral gateway", "Dhol & baraat entry path"],
    lightingIdeas: ["Chandeliers", "Gold wash + pin spots"],
    foodPresentation: ["Live chaat & tandoor counters", "Dessert grazing table"],
    image: "/images/themes/north-indian-royal-wedding.jpg",
    imageSource: "Wikimedia Commons · Wikilover90 (CC BY-SA 4.0)",
    threeD: { stageColor: "#c81d4e", accentColor: "#ffd24c", styleToken: "north-royal", available: true },
  }),
  t({
    slug: "rajasthani-wedding",
    name: "Rajasthani Wedding",
    category: "wedding",
    region: "rajasthani",
    budgetTier: "luxury",
    setting: "both",
    guestMin: 200,
    guestMax: 1200,
    summary: "Regal palace vibes — mirror work, marigold, camels and jewel tones.",
    decor: ["Mirror-work drapes", "Marigold & rose", "Jewel-tone textiles", "Palace-style mandap"],
    palette: ["#e23e57", "#ff9e2c", "#7c3aed", "#ffd24c"],
    decorBudgetMin: 300000,
    decorBudgetMax: 1800000,
    stageIdeas: ["Mirror-work backdrop", "Jharokha-style frames", "Marigold cascades"],
    entranceIdeas: ["Palace gateway arch", "Folk performers path"],
    lightingIdeas: ["Warm lantern lighting", "Candle accents"],
    foodPresentation: ["Rajasthani thali counters", "Ghewar dessert bar"],
    image: "/images/themes/rajasthani-wedding.jpg",
    imageSource: "Wikimedia Commons · Sandra Cohen-Rose and Colin Rose (CC BY-SA 2.0)",
    threeD: { stageColor: "#e23e57", accentColor: "#ff9e2c", styleToken: "rajasthani", available: true },
  }),
  t({
    slug: "south-indian-grand-wedding",
    name: "South Indian Grand Wedding",
    category: "wedding",
    region: "mixed",
    budgetTier: "premium",
    setting: "indoor",
    guestMin: 300,
    guestMax: 1500,
    summary: "A grand convention-hall celebration blending Tamil, Telugu and Kannada traditions.",
    decor: ["Grand floral mandap", "Mixed-regional lamps", "Silk & jasmine", "Large stage"],
    palette: ["#f5820a", "#c81d4e", "#ffd24c", "#0d9488"],
    decorBudgetMin: 200000,
    decorBudgetMax: 900000,
    stageIdeas: ["Large draped stage", "Floral + lamp combination"],
    entranceIdeas: ["Grand floral entrance", "Kolam + thoranam"],
    lightingIdeas: ["Warm hall wash", "Stage pin spots"],
    foodPresentation: ["Multi-regional live counters", "Sadya + biryani counters"],
    image: "/images/themes/south-indian-grand-wedding.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#f5820a", accentColor: "#c81d4e", styleToken: "south-grand", available: true },
  }),
  t({
    slug: "modern-luxury-wedding",
    name: "Modern Luxury Wedding",
    category: "wedding",
    region: "modern",
    budgetTier: "luxury",
    setting: "indoor",
    guestMin: 150,
    guestMax: 600,
    summary: "Contemporary glamour — monochrome drapes, crystal accents and statement florals.",
    decor: ["Monochrome drapes", "Crystal & acrylic accents", "Statement floral installations", "Minimal mandap"],
    palette: ["#15131f", "#ffd24c", "#fff4e8", "#2dd4bf"],
    decorBudgetMin: 300000,
    decorBudgetMax: 2000000,
    stageIdeas: ["Sleek backdrop with floral cloud", "Acrylic + crystal detailing"],
    entranceIdeas: ["Mirror walkway", "Floral tunnel"],
    lightingIdeas: ["Programmable LED wash", "Warm + cool blend"],
    foodPresentation: ["Plated fine-dining service", "Live gourmet counters"],
    image: "/images/themes/modern-luxury-wedding.jpg",
    imageSource: "Wikimedia Commons · Vis M (CC BY-SA 4.0)",
    threeD: { stageColor: "#15131f", accentColor: "#2dd4bf", styleToken: "modern-lux", available: true },
  }),
  t({
    slug: "minimalist-wedding",
    name: "Minimalist Wedding",
    category: "wedding",
    region: "modern",
    budgetTier: "medium",
    setting: "both",
    guestMin: 50,
    guestMax: 250,
    summary: "Understated elegance — neutral palette, few statement blooms, clean lines.",
    decor: ["Neutral drapes", "A few statement florals", "Candles", "Clean minimal stage"],
    palette: ["#fff4e8", "#e8dcc6", "#2dd4bf", "#15131f"],
    decorBudgetMin: 50000,
    decorBudgetMax: 200000,
    stageIdeas: ["Simple draped arch", "Single floral accent"],
    entranceIdeas: ["Clean signage + candles", "Minimal floral"],
    lightingIdeas: ["Soft neutral wash", "Candlelight"],
    foodPresentation: ["Curated plated menu", "Minimal dessert table"],
    image: "/images/themes/minimalist-wedding.jpg",
    imageSource: "Wikimedia Commons · AnonymousUnknown author (Public domain)",
    threeD: { stageColor: "#e8dcc6", accentColor: "#2dd4bf", styleToken: "minimal", available: true },
  }),
  t({
    slug: "destination-wedding",
    name: "Destination Wedding",
    category: "wedding",
    region: "modern",
    budgetTier: "luxury",
    setting: "outdoor",
    guestMin: 50,
    guestMax: 300,
    summary: "Beach or resort-side celebration with open skies and natural light.",
    decor: ["Open-air floral arch", "Draped cabanas", "Natural & tropical florals", "Beach/garden stage"],
    palette: ["#2dd4bf", "#ffd24c", "#fff4e8", "#f5820a"],
    decorBudgetMin: 300000,
    decorBudgetMax: 2500000,
    stageIdeas: ["Seaside floral arch", "Driftwood + florals"],
    entranceIdeas: ["Palm-lined path", "Tropical floral entry"],
    lightingIdeas: ["Golden-hour natural light", "Festoon string lights"],
    foodPresentation: ["Beachside grazing tables", "Live seafood/veg counters"],
    image: "/images/themes/destination-wedding.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#2dd4bf", accentColor: "#ffd24c", styleToken: "destination", available: false },
  }),

  // ---------------- Decoration themes ----------------
  t({
    slug: "floral-decoration",
    name: "Floral Decoration",
    category: "decoration",
    region: "mixed",
    budgetTier: "premium",
    setting: "both",
    guestMin: 50,
    guestMax: 1000,
    summary: "Lavish fresh-flower installations across stage, entrance and tables.",
    decor: ["Fresh floral backdrop", "Flower-draped entrance", "Table centrepieces"],
    palette: ["#ff5fa2", "#ffd24c", "#2dd4bf", "#fff4e8"],
    decorBudgetMin: 100000,
    decorBudgetMax: 600000,
    stageIdeas: ["Full-floral backdrop", "Hanging flower clouds"],
    entranceIdeas: ["Floral tunnel", "Flower wall for photos"],
    lightingIdeas: ["Soft warm wash", "Fairy lights in florals"],
    foodPresentation: ["Floral-accented dessert table"],
    image: "/images/themes/floral-decoration.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#ff5fa2", accentColor: "#ffd24c", styleToken: "floral", available: true },
  }),
  t({
    slug: "jasmine-marigold-decoration",
    name: "Jasmine & Marigold Decoration",
    category: "decoration",
    region: "tamil",
    budgetTier: "medium",
    setting: "both",
    guestMin: 50,
    guestMax: 800,
    summary: "Classic South Indian jasmine strings and marigold garlands everywhere.",
    decor: ["Jasmine strings", "Marigold garlands", "Flower rangoli"],
    palette: ["#ffd24c", "#ff9e2c", "#fff4e8", "#0d9488"],
    decorBudgetMin: 50000,
    decorBudgetMax: 250000,
    stageIdeas: ["Marigold backdrop", "Jasmine curtain"],
    entranceIdeas: ["Marigold toran", "Jasmine arch"],
    lightingIdeas: ["Warm amber glow"],
    foodPresentation: ["Banana-leaf dining with floral accents"],
    image: "/images/themes/jasmine-marigold-decoration.jpg",
    imageSource: "Wikimedia Commons · PattayaPatrol (CC BY-SA 4.0)",
    threeD: { stageColor: "#ff9e2c", accentColor: "#ffd24c", styleToken: "jasmine-marigold", available: true },
  }),
  t({
    slug: "royal-gold-decoration",
    name: "Royal Gold Decoration",
    category: "decoration",
    region: "north-indian",
    budgetTier: "luxury",
    setting: "indoor",
    guestMin: 100,
    guestMax: 1000,
    summary: "Opulent gold drapes, chandeliers and jewel-tone accents.",
    decor: ["Gold drapes", "Chandeliers", "Jewel-tone textiles", "Gilded props"],
    palette: ["#ffd24c", "#c81d4e", "#15131f", "#fff4e8"],
    decorBudgetMin: 250000,
    decorBudgetMax: 1500000,
    stageIdeas: ["Gold shimmer backdrop", "Chandelier cluster"],
    entranceIdeas: ["Gilded gateway", "Candelabra path"],
    lightingIdeas: ["Warm gold wash", "Crystal sparkle"],
    foodPresentation: ["Gold-accent dessert bar"],
    image: "/images/themes/royal-gold-decoration.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#ffd24c", accentColor: "#c81d4e", styleToken: "royal-gold", available: true },
  }),
  t({
    slug: "pastel-decoration",
    name: "Pastel Decoration",
    category: "decoration",
    region: "modern",
    budgetTier: "medium",
    setting: "both",
    guestMin: 50,
    guestMax: 400,
    summary: "Soft pastel drapes and blooms for a dreamy, light look.",
    decor: ["Pastel drapes", "Blush & mint florals", "Soft props"],
    palette: ["#ffd1dc", "#c7f0e8", "#fff4e8", "#e8dcc6"],
    decorBudgetMin: 60000,
    decorBudgetMax: 300000,
    stageIdeas: ["Pastel ombré backdrop", "Soft floral cloud"],
    entranceIdeas: ["Balloon + floral arch", "Pastel drape entry"],
    lightingIdeas: ["Soft diffused light"],
    foodPresentation: ["Pastel dessert grazing table"],
    image: "/images/themes/pastel-decoration.jpg",
    imageSource: "Wikimedia Commons · Yelkrokoyade (CC BY-SA 3.0)",
    threeD: { stageColor: "#ffd1dc", accentColor: "#c7f0e8", styleToken: "pastel", available: true },
  }),
  t({
    slug: "brass-lamp-decoration",
    name: "Traditional Brass & Lamp Decoration",
    category: "decoration",
    region: "tamil",
    budgetTier: "medium",
    setting: "indoor",
    guestMin: 50,
    guestMax: 600,
    summary: "Brass lamps, kuthuvilakku and oil-lamp glow for a sacred traditional feel.",
    decor: ["Brass kuthuvilakku", "Oil-lamp rows", "Traditional brass props"],
    palette: ["#f5820a", "#ffd24c", "#1c1033", "#fff4e8"],
    decorBudgetMin: 40000,
    decorBudgetMax: 180000,
    stageIdeas: ["Lamp-lined stage", "Brass backdrop accents"],
    entranceIdeas: ["Lamp walkway", "Brass urli with floating flowers"],
    lightingIdeas: ["Oil-lamp glow", "Warm low light"],
    foodPresentation: ["Traditional brass serveware"],
    image: "/images/themes/brass-lamp-decoration.jpg",
    imageSource: "Wikimedia Commons (CC)",
    threeD: { stageColor: "#f5820a", accentColor: "#ffd24c", styleToken: "brass-lamp", available: true },
  }),
  t({
    slug: "mandap-decoration",
    name: "Mandap Decoration",
    category: "decoration",
    region: "mixed",
    budgetTier: "premium",
    setting: "indoor",
    guestMin: 100,
    guestMax: 1000,
    summary: "Statement mandap structures in floral, fabric and traditional styles.",
    decor: ["Four-pillar mandap", "Floral + drape canopy", "Decorated seating"],
    palette: ["#c81d4e", "#ffd24c", "#0d9488", "#fff4e8"],
    decorBudgetMin: 120000,
    decorBudgetMax: 700000,
    stageIdeas: ["Floral canopy mandap", "Drape + lamp pillars"],
    entranceIdeas: ["Matching mini-arch at entry"],
    lightingIdeas: ["Canopy pin lights", "Warm wash"],
    foodPresentation: ["Coordinated dining decor"],
    image: "/images/themes/mandap-decoration.jpg",
    imageSource: "Wikimedia Commons · Ingo Mehling (CC BY-SA 4.0)",
    threeD: { stageColor: "#c81d4e", accentColor: "#0d9488", styleToken: "mandap", available: true },
  }),
  t({
    slug: "garden-decoration",
    name: "Garden Decoration",
    category: "decoration",
    region: "modern",
    budgetTier: "medium",
    setting: "outdoor",
    guestMin: 50,
    guestMax: 500,
    summary: "Open-lawn decor with fairy lights, florals and natural greenery.",
    decor: ["Fairy-light canopy", "Natural greenery", "Open floral stage"],
    palette: ["#0d9488", "#ffd24c", "#fff4e8", "#ff9e2c"],
    decorBudgetMin: 70000,
    decorBudgetMax: 350000,
    stageIdeas: ["Greenery backdrop", "Floral + fairy lights"],
    entranceIdeas: ["Fairy-light tree path", "Floral garden gate"],
    lightingIdeas: ["Festoon + fairy lights", "Golden-hour natural"],
    foodPresentation: ["Open-lawn grazing tables"],
    image: "/images/themes/garden-decoration.jpg",
    imageSource: "Wikimedia Commons · Shixart1985 (CC BY 2.0)",
    threeD: { stageColor: "#0d9488", accentColor: "#ffd24c", styleToken: "garden", available: true },
  }),
  t({
    slug: "beach-decoration",
    name: "Beach Decoration",
    category: "decoration",
    region: "modern",
    budgetTier: "premium",
    setting: "outdoor",
    guestMin: 30,
    guestMax: 250,
    summary: "Seaside setup with driftwood, tropical florals and open skies.",
    decor: ["Driftwood arch", "Tropical florals", "Flowing drapes"],
    palette: ["#2dd4bf", "#ffd24c", "#fff4e8", "#38bdf8"],
    decorBudgetMin: 150000,
    decorBudgetMax: 700000,
    stageIdeas: ["Driftwood + floral arch", "Sheer drapes in the breeze"],
    entranceIdeas: ["Palm-lined entry", "Shell & floral accents"],
    lightingIdeas: ["Golden-hour", "String lights at dusk"],
    foodPresentation: ["Beachside live counters"],
    image: "/images/themes/beach-decoration.jpg",
    imageSource: "Wikimedia Commons · Derk29 (CC BY-SA 4.0)",
    threeD: { stageColor: "#2dd4bf", accentColor: "#38bdf8", styleToken: "beach", available: false },
  }),
  t({
    slug: "crystal-led-decoration",
    name: "Crystal & LED Decoration",
    category: "decoration",
    region: "modern",
    budgetTier: "luxury",
    setting: "indoor",
    guestMin: 100,
    guestMax: 800,
    summary: "Sparkling crystal props with programmable LED lighting for a glam night look.",
    decor: ["Crystal curtains", "LED walls", "Mirror props"],
    palette: ["#7c3aed", "#2dd4bf", "#ffd24c", "#15131f"],
    decorBudgetMin: 200000,
    decorBudgetMax: 1200000,
    stageIdeas: ["LED backdrop", "Crystal chandelier cluster"],
    entranceIdeas: ["LED tunnel", "Crystal archway"],
    lightingIdeas: ["Programmable RGB", "Pin spots on crystals"],
    foodPresentation: ["Backlit dessert bar"],
    image: "/images/themes/crystal-led-decoration.jpg",
    imageSource: "Wikimedia Commons · Shixart1985 (CC BY 2.0)",
    threeD: { stageColor: "#7c3aed", accentColor: "#2dd4bf", styleToken: "crystal-led", available: true },
  }),
  t({
    slug: "rustic-decoration",
    name: "Rustic Decoration",
    category: "decoration",
    region: "modern",
    budgetTier: "low",
    setting: "both",
    guestMin: 30,
    guestMax: 300,
    summary: "Warm rustic charm with wood, jute, wildflowers and warm lights.",
    decor: ["Wooden props", "Jute & burlap", "Wildflower arrangements"],
    palette: ["#b08968", "#ffd24c", "#fff4e8", "#7aa84a"],
    decorBudgetMin: 30000,
    decorBudgetMax: 150000,
    stageIdeas: ["Wooden backdrop", "Wildflower + lantern accents"],
    entranceIdeas: ["Wooden signage", "Jute + floral entry"],
    lightingIdeas: ["Warm Edison bulbs", "Lanterns"],
    foodPresentation: ["Farmhouse-style grazing boards"],
    image: "/images/themes/rustic-decoration.jpg",
    imageSource: "Wikimedia Commons · Missgmatthews (CC BY-SA 4.0)",
    threeD: { stageColor: "#b08968", accentColor: "#7aa84a", styleToken: "rustic", available: true },
  }),

  // ---------------- Other event themes ----------------
  t({ slug: "birthday-party", name: "Birthday Party", category: "event", region: "modern", budgetTier: "low", setting: "both", guestMin: 20, guestMax: 200, summary: "Balloons, cake table and festive decor for all ages.", decor: ["Balloon arch", "Cake & dessert table", "Themed backdrop"], palette: ["#ff5fa2", "#ffd24c", "#2dd4bf", "#fff4e8"], decorBudgetMin: 15000, decorBudgetMax: 120000, stageIdeas: ["Balloon + name backdrop"], entranceIdeas: ["Balloon gateway"], lightingIdeas: ["Colourful party lights"], foodPresentation: ["Cake centrepiece", "Snack counters"], image: "/images/themes/birthday-party.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#ff5fa2", accentColor: "#ffd24c", styleToken: "birthday", available: true } }),
  t({ slug: "kids-birthday", name: "Kids Birthday", category: "event", region: "modern", budgetTier: "low", setting: "indoor", guestMin: 20, guestMax: 120, summary: "Playful cartoon-theme decor, balloons and a fun cake setup.", decor: ["Themed balloons", "Character cutouts", "Fun props"], palette: ["#38bdf8", "#ffd24c", "#ff5fa2", "#7aa84a"], decorBudgetMin: 12000, decorBudgetMax: 90000, stageIdeas: ["Character backdrop"], entranceIdeas: ["Balloon tunnel"], lightingIdeas: ["Bright cheerful lighting"], foodPresentation: ["Themed cake & treats"], image: "/images/themes/kids-birthday.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#38bdf8", accentColor: "#ff5fa2", styleToken: "kids", available: true } }),
  t({ slug: "engagement", name: "Engagement", category: "event", region: "mixed", budgetTier: "medium", setting: "indoor", guestMin: 50, guestMax: 400, summary: "Romantic ring-ceremony stage with florals and warm lights.", decor: ["Floral stage", "Ring-platform decor", "Drapes"], palette: ["#ff5fa2", "#ffd24c", "#fff4e8", "#c81d4e"], decorBudgetMin: 50000, decorBudgetMax: 300000, stageIdeas: ["Floral heart backdrop", "Ring platform"], entranceIdeas: ["Floral arch"], lightingIdeas: ["Warm romantic wash"], foodPresentation: ["Dessert & mocktail bar"], image: "/images/themes/engagement.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#ff5fa2", accentColor: "#ffd24c", styleToken: "engagement", available: true } }),
  t({ slug: "reception", name: "Reception", category: "event", region: "mixed", budgetTier: "premium", setting: "indoor", guestMin: 150, guestMax: 1200, summary: "Elegant evening reception stage with grand florals and lighting.", decor: ["Grand stage backdrop", "Floral + drape", "Sofa seating decor"], palette: ["#7c3aed", "#ffd24c", "#c81d4e", "#fff4e8"], decorBudgetMin: 150000, decorBudgetMax: 800000, stageIdeas: ["Grand couple sofa stage", "Floral + LED backdrop"], entranceIdeas: ["Red-carpet floral entry"], lightingIdeas: ["Evening wash + spots"], foodPresentation: ["Live counters + plated"], image: "/images/themes/reception.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#7c3aed", accentColor: "#ffd24c", styleToken: "reception", available: true } }),
  t({ slug: "mehendi", name: "Mehendi", category: "event", region: "north-indian", budgetTier: "medium", setting: "both", guestMin: 50, guestMax: 400, summary: "Vibrant, colourful mehendi setup with umbrellas, marigold and low seating.", decor: ["Colourful umbrellas", "Marigold strings", "Low floor seating"], palette: ["#ff9e2c", "#ff5fa2", "#2dd4bf", "#ffd24c"], decorBudgetMin: 50000, decorBudgetMax: 300000, stageIdeas: ["Marigold + umbrella backdrop"], entranceIdeas: ["Colourful floral entry"], lightingIdeas: ["Bright festive lighting"], foodPresentation: ["Chaat & street-food counters"], image: "/images/themes/mehendi.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#ff9e2c", accentColor: "#ff5fa2", styleToken: "mehendi", available: true } }),
  t({ slug: "sangeet", name: "Sangeet", category: "event", region: "north-indian", budgetTier: "premium", setting: "indoor", guestMin: 100, guestMax: 600, summary: "Music-and-dance night with a performance stage and dynamic lighting.", decor: ["Performance stage", "LED + drapes", "Dance floor"], palette: ["#7c3aed", "#2dd4bf", "#ff5fa2", "#ffd24c"], decorBudgetMin: 120000, decorBudgetMax: 700000, stageIdeas: ["LED performance backdrop", "DJ + dance floor"], entranceIdeas: ["LED tunnel"], lightingIdeas: ["Dynamic concert lighting"], foodPresentation: ["Cocktail + live counters"], image: "/images/themes/sangeet.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#7c3aed", accentColor: "#2dd4bf", styleToken: "sangeet", available: true } }),
  t({ slug: "baby-shower", name: "Baby Shower", category: "event", region: "modern", budgetTier: "low", setting: "indoor", guestMin: 20, guestMax: 150, summary: "Soft pastel celebration with balloons and a sweet dessert table.", decor: ["Pastel balloons", "Dessert table", "Soft florals"], palette: ["#ffd1dc", "#c7f0e8", "#ffd24c", "#fff4e8"], decorBudgetMin: 15000, decorBudgetMax: 120000, stageIdeas: ["Pastel balloon backdrop"], entranceIdeas: ["Balloon + floral arch"], lightingIdeas: ["Soft warm light"], foodPresentation: ["Pastel dessert grazing"], image: "/images/themes/baby-shower.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#ffd1dc", accentColor: "#c7f0e8", styleToken: "baby-shower", available: true } }),
  t({ slug: "anniversary", name: "Anniversary", category: "event", region: "mixed", budgetTier: "medium", setting: "indoor", guestMin: 30, guestMax: 300, summary: "Elegant milestone celebration with florals and warm golden decor.", decor: ["Floral stage", "Golden accents", "Photo wall"], palette: ["#ffd24c", "#c81d4e", "#fff4e8", "#7c3aed"], decorBudgetMin: 40000, decorBudgetMax: 250000, stageIdeas: ["Floral + number backdrop"], entranceIdeas: ["Golden floral arch"], lightingIdeas: ["Warm golden wash"], foodPresentation: ["Celebration cake + counters"], image: "/images/themes/anniversary.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#ffd24c", accentColor: "#c81d4e", styleToken: "anniversary", available: true } }),
  t({ slug: "corporate-event", name: "Corporate Event", category: "event", region: "modern", budgetTier: "premium", setting: "indoor", guestMin: 50, guestMax: 1000, summary: "Professional stage with branded backdrop, clean lines and AV setup.", decor: ["Branded stage backdrop", "Clean seating", "Lectern + AV"], palette: ["#15131f", "#2dd4bf", "#ffd24c", "#fff4e8"], decorBudgetMin: 80000, decorBudgetMax: 600000, stageIdeas: ["LED branded backdrop", "Podium + screens"], entranceIdeas: ["Branded registration arch"], lightingIdeas: ["Clean stage wash"], foodPresentation: ["Buffet + coffee counters"], image: "/images/themes/corporate-event.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#15131f", accentColor: "#2dd4bf", styleToken: "corporate", available: true } }),
  t({ slug: "cultural-festival", name: "Cultural Festival", category: "event", region: "tamil", budgetTier: "medium", setting: "both", guestMin: 100, guestMax: 2000, summary: "Colourful stage for cultural programmes with traditional motifs.", decor: ["Traditional motifs", "Colourful drapes", "Performance stage"], palette: ["#f5820a", "#c81d4e", "#ffd24c", "#0d9488"], decorBudgetMin: 60000, decorBudgetMax: 400000, stageIdeas: ["Motif backdrop", "Large performance stage"], entranceIdeas: ["Traditional decorated gate"], lightingIdeas: ["Colourful stage lighting"], foodPresentation: ["Regional food stalls"], image: "/images/themes/cultural-festival.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#f5820a", accentColor: "#c81d4e", styleToken: "cultural", available: true } }),
  t({ slug: "college-function", name: "College Function", category: "event", region: "modern", budgetTier: "low", setting: "indoor", guestMin: 100, guestMax: 2000, summary: "Energetic stage for annual day / fest with vibrant backdrop and lighting.", decor: ["Vibrant backdrop", "Banner + branding", "Performance stage"], palette: ["#7c3aed", "#2dd4bf", "#ffd24c", "#ff5fa2"], decorBudgetMin: 40000, decorBudgetMax: 300000, stageIdeas: ["Themed fest backdrop", "Big stage + screens"], entranceIdeas: ["Banner archway"], lightingIdeas: ["Concert-style lighting"], foodPresentation: ["Food stalls"], image: "/images/themes/college-function.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#7c3aed", accentColor: "#ffd24c", styleToken: "college", available: true } }),
  t({ slug: "community-celebration", name: "Community Celebration", category: "event", region: "mixed", budgetTier: "low", setting: "both", guestMin: 100, guestMax: 3000, summary: "Welcoming large-scale community gathering with simple festive decor.", decor: ["Simple festive decor", "Large seating", "Community stage"], palette: ["#0d9488", "#ffd24c", "#f5820a", "#fff4e8"], decorBudgetMin: 30000, decorBudgetMax: 250000, stageIdeas: ["Simple decorated stage"], entranceIdeas: ["Welcome arch"], lightingIdeas: ["Even bright lighting"], foodPresentation: ["Community dining counters"], image: "/images/themes/community-celebration.jpg", imageSource: "Wikimedia Commons (CC)", threeD: { stageColor: "#0d9488", accentColor: "#f5820a", styleToken: "community", available: true } }),
];

export function themeBySlug(slug: string): ThemeDef | undefined {
  return THEMES.find((t2) => t2.slug === slug);
}

export function filterThemes(opts: {
  category?: ThemeCategory | "all";
  region?: ThemeRegion | "all";
  budget?: ThemeBudgetTier | "all";
  setting?: Setting | "all";
  search?: string;
}): ThemeDef[] {
  const q = opts.search?.trim().toLowerCase();
  return THEMES.filter((th) => {
    if (opts.category && opts.category !== "all" && th.category !== opts.category) return false;
    if (opts.region && opts.region !== "all" && th.region !== opts.region) return false;
    if (opts.budget && opts.budget !== "all" && th.budgetTier !== opts.budget) return false;
    if (opts.setting && opts.setting !== "all" && th.setting !== "both" && th.setting !== opts.setting) return false;
    if (q && !`${th.name} ${th.summary} ${th.decor.join(" ")} ${th.region}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
