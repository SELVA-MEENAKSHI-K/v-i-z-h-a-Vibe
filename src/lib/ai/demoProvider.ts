// Deterministic demo AI provider. Produces useful, context-aware suggestions
// with NO external calls. Output is labeled generated and prices are ranges
// with explicit assumptions — never confirmed facts.

import type {
  AiContext,
  AiProvider,
  AiResult,
  BudgetEstimate,
  BudgetLine,
  DecorConcept,
  MenuSuggestion,
  ThemeSuggestion,
  TimelineTaskSuggestion,
} from "./types";

const STYLE_PALETTES: Record<string, { name: string; palette: string[]; motifs: string[]; food: string[] }> = {
  tamil: {
    name: "Tamil",
    palette: ["#f5820a", "#c81d4e", "#f7c948", "#0d9488"],
    motifs: ["kolam patterns", "banana-leaf settings", "jasmine (malligai) garlands", "brass lamps"],
    food: ["Idli & medu vada", "Sambar & chutney", "Chettinad specials", "Payasam", "Filter coffee"],
  },
  kerala: {
    name: "Kerala",
    palette: ["#0d9488", "#f7c948", "#e23e57", "#1c1930"],
    motifs: ["nilavilakku lamps", "coconut-leaf decor", "white & gold drapes", "pookalam flower carpet"],
    food: ["Sadya on banana leaf", "Avial", "Olan", "Parippu & ghee", "Payasam"],
  },
  telugu: {
    name: "Telugu",
    palette: ["#ff9e2c", "#7c3aed", "#f7c948", "#14b8a6"],
    motifs: ["mango-leaf thoranam", "marigold strings", "traditional kalasham", "silk drapes"],
    food: ["Pulihora", "Gongura dishes", "Pappu & ghee", "Bobbatlu", "Qubani ka meetha"],
  },
  kannada: {
    name: "Kannada",
    palette: ["#f5820a", "#2dd4bf", "#ffd24c", "#6d28d9"],
    motifs: ["mysore silk accents", "sandalwood-toned decor", "jasmine & rose", "brass urli with flowers"],
    food: ["Bisi bele bath", "Ragi mudde", "Mysore masala dosa", "Obbattu", "Mysore pak"],
  },
  "north-indian": {
    name: "North Indian",
    palette: ["#e23e57", "#ffb347", "#7c3aed", "#f7c948"],
    motifs: ["marigold & rose garlands", "mirror-work drapes", "phoolon ki chadar", "royal jewel tones"],
    food: ["Paneer tikka", "Dal makhani", "Assorted naan", "Biryani", "Gulab jamun"],
  },
  mixed: {
    name: "Blended",
    palette: ["#f5820a", "#7c3aed", "#14b8a6", "#f7c948"],
    motifs: ["fusion floral arches", "mixed regional lamps", "contemporary drapes", "statement centerpieces"],
    food: ["Regional live counters", "Multi-cuisine mains", "Fusion desserts", "Mocktail bar"],
  },
};

function pickStyle(ctx: AiContext): { key: string; data: (typeof STYLE_PALETTES)[string] } {
  const s = ctx.styles?.[0]?.toLowerCase();
  if (s && STYLE_PALETTES[s]) return { key: s, data: STYLE_PALETTES[s] };
  if (ctx.styles && ctx.styles.length > 1) return { key: "mixed", data: STYLE_PALETTES.mixed };
  return { key: "mixed", data: STYLE_PALETTES.mixed };
}

function season(dateStr?: string): string {
  if (!dateStr) return "any season";
  const m = new Date(dateStr).getMonth();
  if (m >= 2 && m <= 5) return "summer";
  if (m >= 6 && m <= 9) return "monsoon";
  return "winter";
}

function themes(ctx: AiContext): ThemeSuggestion[] {
  const { data } = pickStyle(ctx);
  const city = ctx.city || "your city";
  const ev = ctx.eventTypeName || "event";
  const sea = season(ctx.startDate);
  return [
    {
      title: `${data.name} Heritage Glow`,
      palette: data.palette,
      summary: `A warm, traditional ${data.name.toLowerCase()} look for your ${ev.toLowerCase()} in ${city}, tuned for ${sea}.`,
      decorHighlights: data.motifs.slice(0, 3),
      representableIn3D: ["Stage backdrop", "Seating color accents", "Decor arch at entrance", "Dining layout"],
    },
    {
      title: "Modern Festive Minimal",
      palette: [data.palette[0], "#15131f", "#f7c948", "#2dd4bf"],
      summary: `A cleaner, contemporary take that keeps ${data.name.toLowerCase()} motifs as accents.`,
      decorHighlights: ["Statement centerpieces", "String-light canopy", "Monochrome drape with floral accent"],
      representableIn3D: ["Dance floor area", "Lighting zones", "Centerpiece markers on tables"],
    },
    {
      title: `${city} Garden Celebration`,
      palette: ["#0d9488", "#ffd24c", "#f5820a", "#6d28d9"],
      summary: `An open, garden-forward concept suited to ${ctx.guestCount || "your"} guests.`,
      decorHighlights: ["Floral walkway", "Open dining lawn", "Fairy-light trees"],
      representableIn3D: ["Walkway path", "Open dining zone", "Perimeter decor"],
    },
  ];
}

function decor(ctx: AiContext): DecorConcept[] {
  const { data } = pickStyle(ctx);
  return [
    {
      title: `${data.name} Entrance & Stage`,
      description: `${data.motifs[0]} at the entrance leading to a draped stage with ${data.motifs[3] || "lamp"} accents.`,
      representableIn3D: ["Entrance arch object", "Stage platform", "Backdrop panel", "Pathway"],
      notRepresentable: ["Exact fabric textures", "Live flower freshness", "Real lighting temperature"],
    },
    {
      title: "Table & Dining Styling",
      description: "Centerpieces and runners coordinated with the theme palette across guest tables.",
      representableIn3D: ["Table placement", "Centerpiece markers", "Color accents"],
      notRepresentable: ["Individual place settings detail", "Printed stationery"],
    },
  ];
}

function menus(ctx: AiContext): MenuSuggestion[] {
  const { data } = pickStyle(ctx);
  const dietary = ctx.dietary || "veg";
  const base: MenuSuggestion = {
    style: data.name,
    dietary,
    courses: [
      { course: "Welcome", items: ["Welcome drink", data.food[0] || "Starter"] },
      { course: "Main", items: data.food.slice(1, 4) },
      { course: "Dessert", items: [data.food[data.food.length - 1] || "Dessert"] },
    ],
    notes:
      dietary === "non-veg"
        ? "Includes non-vegetarian mains; vegetarian options served alongside."
        : dietary === "both"
          ? "Separate vegetarian and non-vegetarian counters recommended."
          : "Fully vegetarian menu. Flag Jain/vegan needs to your caterer.",
  };
  const lighter: MenuSuggestion = {
    style: "Multi-cuisine",
    dietary,
    courses: [
      { course: "Live counters", items: ["Chaat counter", "Dosa / tiffin counter"] },
      { course: "Mains", items: ["Regional thali", "Biryani / pulao", "Paneer or seasonal curry"] },
      { course: "Dessert", items: ["Payasam / kheer", "Ice cream"] },
    ],
    notes: "Buffet-style; scale counters to guest count for shorter queues.",
  };
  return [base, lighter];
}

function budget(ctx: AiContext): BudgetEstimate {
  const guests = ctx.guestCount || 100;
  const lines: BudgetLine[] = [
    {
      category: "venue",
      label: "Venue / hall rental",
      quantity: 1,
      unitCostMin: 60000,
      unitCostMax: 250000,
      assumption: "Single-day hall booking; varies widely by city, date, and venue tier.",
    },
    {
      category: "catering",
      label: "Catering (per guest)",
      quantity: guests,
      unitCostMin: 450,
      unitCostMax: 1200,
      assumption: "Per-plate range for a multi-course menu; menu and city affect this most.",
    },
    {
      category: "decor",
      label: "Decor & floral",
      quantity: 1,
      unitCostMin: 40000,
      unitCostMax: 300000,
      assumption: "Scales with stage, entrance, and table styling scope.",
    },
    {
      category: "entertainment",
      label: "Music / entertainment",
      quantity: 1,
      unitCostMin: 20000,
      unitCostMax: 150000,
      assumption: "DJ vs live band vs troupe changes this significantly.",
    },
    {
      category: "photography",
      label: "Photography & video",
      quantity: 1,
      unitCostMin: 35000,
      unitCostMax: 200000,
      assumption: "Candid + traditional coverage, one day.",
    },
    {
      category: "misc",
      label: "Invitations, favours, buffer",
      quantity: 1,
      unitCostMin: 15000,
      unitCostMax: 80000,
      assumption: "Keep ~10% buffer for last-minute changes.",
    },
  ];
  const totalMin = lines.reduce((s, l) => s + l.unitCostMin * l.quantity, 0);
  const totalMax = lines.reduce((s, l) => s + l.unitCostMax * l.quantity, 0);
  return {
    currency: "INR",
    lines,
    totalMin,
    totalMax,
    assumptions: [
      "All figures are indicative ranges, not quotes. Confirm with vendors.",
      `Based on ${guests} guests in ${ctx.city || "the selected city"}.`,
      "Prices vary by season, day of week, and vendor tier.",
    ],
  };
}

function timeline(ctx: AiContext): TimelineTaskSuggestion[] {
  const tasks: TimelineTaskSuggestion[] = [
    { title: "Confirm guest list & count", detail: "Lock an approximate headcount to drive venue and catering.", offsetDays: 90 },
    { title: "Shortlist & book venue", detail: "Visit 2–3 venues; confirm date availability and terms in writing.", offsetDays: 75 },
    { title: "Finalize caterer & menu", detail: "Tasting session; confirm per-plate and dietary options.", offsetDays: 50 },
    { title: "Lock decor & theme", detail: "Approve stage, entrance, and table styling against your budget.", offsetDays: 40 },
    { title: "Book photography & entertainment", detail: "Confirm coverage hours and deliverables.", offsetDays: 35 },
    { title: "Send invitations", detail: "Digital and/or printed; collect RSVPs.", offsetDays: 30 },
    { title: "Confirm seating & layout", detail: "Use the 3D planner to finalize table and stage positions.", offsetDays: 14 },
    { title: "Final vendor confirmations", detail: "Reconfirm timings, counts, and payments.", offsetDays: 7 },
    { title: "Day-before walkthrough", detail: "Check setup, access, and run-of-show.", offsetDays: 1 },
  ];
  return tasks;
}

export class DemoAiProvider implements AiProvider {
  name = "demo";

  async recommend(kind: AiResult["kind"], ctx: AiContext): Promise<AiResult> {
    switch (kind) {
      case "theme":
        return { kind, provider: this.name, generated: true, themes: themes(ctx) };
      case "decor":
        return { kind, provider: this.name, generated: true, concepts: decor(ctx) };
      case "menu":
        return { kind, provider: this.name, generated: true, menus: menus(ctx) };
      case "budget":
        return { kind, provider: this.name, generated: true, estimate: budget(ctx) };
      case "timeline":
        return { kind, provider: this.name, generated: true, tasks: timeline(ctx) };
    }
  }

  async chat(message: string, ctx: AiContext): Promise<string> {
    const ev = ctx.eventTypeName || "event";
    const city = ctx.city || "your city";
    const guests = ctx.guestCount ? `${ctx.guestCount} guests` : "your guest count";
    const m = message.toLowerCase();

    const prefix = "(Demo assistant — suggestions only, not confirmed facts.) ";

    if (m.includes("budget") || m.includes("cost") || m.includes("price")) {
      const est = budget(ctx);
      return (
        prefix +
        `For a ${ev} in ${city} with ${guests}, a rough all-in range is ₹${est.totalMin.toLocaleString(
          "en-IN",
        )}–₹${est.totalMax.toLocaleString("en-IN")}. These are indicative ranges — get vendor quotes to confirm. Open the Budget tab to edit quantities and assumptions.`
      );
    }
    if (m.includes("menu") || m.includes("food") || m.includes("eat")) {
      const { data } = pickStyle(ctx);
      return (
        prefix +
        `A ${data.name} menu could feature ${data.food.slice(0, 3).join(", ")} and more. Tell me your dietary preference (veg, non-veg, both, Jain, vegan) and I'll tailor the courses.`
      );
    }
    if (m.includes("theme") || m.includes("decor") || m.includes("color")) {
      const t = themes(ctx)[0];
      return prefix + `Try "${t.title}": ${t.summary} In the 3D planner you can show ${t.representableIn3D.slice(0, 3).join(", ")}.`;
    }
    if (m.includes("when") || m.includes("timeline") || m.includes("plan") || m.includes("schedule")) {
      return (
        prefix +
        "Start venue and caterer bookings ~2–3 months out, decor and invites ~4–6 weeks out, and finalize seating in the 3D planner ~2 weeks before. See the Timeline tab for a full checklist."
      );
    }
    if (m.includes("venue") || m.includes("hall") || m.includes("place")) {
      return (
        prefix +
        `I can help you compare venues in ${city}. Use Venue Discovery to search — when a Google Places key is configured you'll see live results, otherwise clearly-labeled sample venues.`
      );
    }
    return (
      prefix +
      `I can help with themes, decor, menus, budgets, timelines, and seating for your ${ev} in ${city}. What would you like to work on? (Note: I can't confirm real venue prices or availability.)`
    );
  }
}
