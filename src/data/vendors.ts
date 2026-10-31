// Vendor catalog — the eight supported service categories and a seed set of
// clearly-labelled SAMPLE vendors used when the database has no verified
// records for a city. Honesty policy (same as venues/menu): sample records are
// flagged `isSample: true` / `verification: "unverified"`, and we NEVER present
// their prices/ratings as confirmed facts. Real photos live under
// /public/images/vendors/<category>.jpg (see scripts/download-vendor-images.mjs);
// SmartImage falls back gracefully and never shows a toy illustration.

export type VendorCategoryDef = {
  slug: string;
  name: string;
  // Budget category this vendor maps to when its cost syncs to the budget.
  budgetCategory: string;
  icon: string;
  blurb: string;
};

// The eight categories required by the product spec.
export const VENDOR_CATEGORIES: VendorCategoryDef[] = [
  { slug: "photography", name: "Photography & Videography", budgetCategory: "photography", icon: "📷", blurb: "Candid, traditional & cinematic coverage." },
  { slug: "catering", name: "Catering", budgetCategory: "catering", icon: "🍽️", blurb: "Multi-cuisine catering & live counters." },
  { slug: "decoration", name: "Decoration", budgetCategory: "decor", icon: "🌸", blurb: "Stage, mandap, floral & lighting decor." },
  { slug: "makeup", name: "Makeup & Styling", budgetCategory: "makeup", icon: "💄", blurb: "Bridal makeup, hair & draping." },
  { slug: "music", name: "Music & Entertainment", budgetCategory: "entertainment", icon: "🎶", blurb: "DJ, live band, nadaswaram & hosts." },
  { slug: "invitations", name: "Wedding Invitations", budgetCategory: "invitations", icon: "💌", blurb: "Printed & digital invitation design." },
  { slug: "transportation", name: "Transportation", budgetCategory: "transport", icon: "🚗", blurb: "Guest transport, valet & car decor." },
  { slug: "equipment", name: "Event Equipment", budgetCategory: "equipment", icon: "🎪", blurb: "Tents, seating, AV & generators." },
];

export const VENDOR_CATEGORY_SLUGS = VENDOR_CATEGORIES.map((c) => c.slug);

export function vendorCategory(slug: string): VendorCategoryDef | undefined {
  return VENDOR_CATEGORIES.find((c) => c.slug === slug);
}

// Map a vendor category slug to the budget category used by BudgetItem.
export function vendorBudgetCategory(slug: string): string {
  return vendorCategory(slug)?.budgetCategory ?? "misc";
}

export type VendorPackage = {
  name: string;
  priceMin: number; // INR — indicative range, never a confirmed quote for samples
  priceMax: number;
  unit: string; // e.g. "per event", "per plate", "per day"
  includes: string[];
};

export type SampleVendor = {
  id: string; // stable "sample:<category>:<n>" id
  name: string;
  category: string;
  city: string;
  area?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  photos: string[]; // local real-photo paths (category-level, honest fallback)
  rating: number | null; // null => no verified rating
  reviewCount: number | null;
  packages: VendorPackage[];
};

const CITIES = ["Madurai", "Chennai", "Bangalore"] as const;

// A small, realistic sample set per category. These are clearly demo records —
// the UI labels them "Sample" and never claims the prices are live quotes.
// Photo paths are category-level so SmartImage always resolves to a real photo
// or a designed placeholder (never a toy illustration).
function photo(category: string): string[] {
  return [`/images/vendors/${category}.jpg`];
}

const PACKAGES: Record<string, VendorPackage[]> = {
  photography: [
    { name: "Essentials", priceMin: 45000, priceMax: 75000, unit: "per event", includes: ["1 photographer", "Edited photos", "Online gallery"] },
    { name: "Signature", priceMin: 90000, priceMax: 160000, unit: "per event", includes: ["2 photographers", "Cinematic video", "Album", "Drone (where permitted)"] },
  ],
  catering: [
    { name: "Veg Standard", priceMin: 450, priceMax: 700, unit: "per plate", includes: ["Welcome drink", "Main course", "2 desserts"] },
    { name: "Premium Buffet", priceMin: 850, priceMax: 1400, unit: "per plate", includes: ["Live counters", "Multi-cuisine", "Dessert bar"] },
  ],
  decoration: [
    { name: "Classic Stage", priceMin: 40000, priceMax: 90000, unit: "per event", includes: ["Stage backdrop", "Entrance arch", "Table florals"] },
    { name: "Grand Mandap", priceMin: 150000, priceMax: 350000, unit: "per event", includes: ["Floral mandap", "Lighting", "Walkway decor"] },
  ],
  makeup: [
    { name: "Bridal Basic", priceMin: 15000, priceMax: 30000, unit: "per function", includes: ["HD makeup", "Hair styling", "Draping"] },
    { name: "Bridal Premium", priceMin: 35000, priceMax: 70000, unit: "per function", includes: ["Airbrush makeup", "Trial session", "Touch-up assistant"] },
  ],
  music: [
    { name: "DJ Night", priceMin: 25000, priceMax: 60000, unit: "per event", includes: ["DJ", "Sound system", "Lighting"] },
    { name: "Live Ensemble", priceMin: 60000, priceMax: 150000, unit: "per event", includes: ["Live band / nadaswaram", "Sound", "Emcee"] },
  ],
  invitations: [
    { name: "Digital Suite", priceMin: 3000, priceMax: 12000, unit: "per event", includes: ["Animated e-invite", "RSVP page", "WhatsApp-ready"] },
    { name: "Printed Premium", priceMin: 80, priceMax: 350, unit: "per card", includes: ["Designer card", "Envelope", "Custom printing"] },
  ],
  transportation: [
    { name: "Guest Shuttle", priceMin: 12000, priceMax: 40000, unit: "per day", includes: ["Mini-bus", "Driver", "Fuel"] },
    { name: "Luxury Car", priceMin: 8000, priceMax: 25000, unit: "per day", includes: ["Decorated car", "Chauffeur"] },
  ],
  equipment: [
    { name: "Seating & Tent", priceMin: 30000, priceMax: 120000, unit: "per event", includes: ["Chairs", "Tenting", "Carpets"] },
    { name: "AV & Power", priceMin: 20000, priceMax: 80000, unit: "per event", includes: ["Projector/LED", "PA system", "Generator"] },
  ],
};

const NAME_PREFIX: Record<string, string[]> = {
  photography: ["Candid Frames", "Aperture Studio", "Golden Hour Films"],
  catering: ["Annam Caterers", "Spice Route Catering", "Grand Feast"],
  decoration: ["Bloom & Drape", "Mandap Makers", "Festoon Decor"],
  makeup: ["Glow Bridal Studio", "Kajal Makeovers", "Blush & Co"],
  music: ["Beatbox DJ", "Raga Live", "Sound Symphony"],
  invitations: ["InkLeaf Invites", "Pixel Cards", "Thirumana Designs"],
  transportation: ["City Ride Travels", "Royal Wheels", "Shuttle Plus"],
  equipment: ["EventKit Rentals", "StagePro Equipment", "TentWorks"],
};

export function sampleVendors(): SampleVendor[] {
  const out: SampleVendor[] = [];
  for (const cat of VENDOR_CATEGORY_SLUGS) {
    const names = NAME_PREFIX[cat] ?? [cat];
    names.forEach((name, i) => {
      const city = CITIES[i % CITIES.length];
      out.push({
        id: `sample:${cat}:${i}`,
        name,
        category: cat,
        city,
        area: city,
        address: `${city}, Tamil Nadu`,
        phone: null as unknown as string | undefined,
        email: undefined,
        website: undefined,
        photos: photo(cat),
        // Samples carry NO fabricated rating/reviews — honest "unverified".
        rating: null,
        reviewCount: null,
        packages: PACKAGES[cat] ?? [],
      });
    });
  }
  return out;
}

// Filter sample vendors by category / city / price / rating.
export type VendorFilter = {
  category?: string;
  city?: string;
  query?: string;
  maxPrice?: number; // filters on package priceMin
  minRating?: number;
};

export function filterSampleVendors(filter: VendorFilter): SampleVendor[] {
  const q = filter.query?.trim().toLowerCase();
  return sampleVendors().filter((v) => {
    if (filter.category && v.category !== filter.category) return false;
    if (filter.city && v.city.toLowerCase() !== filter.city.toLowerCase()) return false;
    if (q && !(v.name.toLowerCase().includes(q) || v.category.includes(q))) return false;
    if (typeof filter.minRating === "number" && (v.rating ?? 0) < filter.minRating) return false;
    if (typeof filter.maxPrice === "number") {
      const cheapest = Math.min(...(v.packages.length ? v.packages.map((p) => p.priceMin) : [Infinity]));
      if (cheapest > filter.maxPrice) return false;
    }
    return true;
  });
}
