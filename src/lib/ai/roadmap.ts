// Structured event roadmap generator (deterministic, grounded in real data).
//
// Builds a complete, personalised roadmap from the user's ACTUAL saved plan
// selections — venue, theme, menu, budget line items, layout, guest count and
// date. Pure functions + real arithmetic (no fabricated prices presented as
// confirmed). This is NOT model output; it is computed from the plan. A live
// AI provider (when configured) powers the separate suggestion/chat endpoints.

import type { SerializedPlan } from "../plans";
import { computeFoodEstimate, type MenuSelection } from "../menuBudget";
import { seatingStatus } from "../seating";

export type RoadmapTask = {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  offsetDays: number; // days before the event
  owner: string;
  status: "pending" | "in-progress" | "completed";
};

export type RoadmapTimelineSlot = { time: string; activity: string };

export type EventRoadmap = {
  generated: true;
  provider: string;
  // A. Overview
  overview: {
    title: string;
    venue: string | null;
    venueAddress: string | null;
    date: string | null;
    guestCount: number;
    theme: string | null;
    city: string;
    eventType: string;
    styles: string[];
    totalEstimateMin: number;
    totalEstimateMax: number;
    budget: number;
    note: string;
  };
  // B. Venue preparation
  venuePrep: string[];
  // C. Decoration roadmap
  decoration: { items: string[]; setupSchedule: string[]; estMin: number; estMax: number };
  // D. Food roadmap
  food: {
    menu: { course: string; items: string[] }[];
    servingNote: string;
    estMin: number;
    estMax: number;
  };
  // E. Event-day timeline
  timeline: RoadmapTimelineSlot[];
  // F. Checklist
  checklist: RoadmapTask[];
  // G. Budget report
  budgetReport: { lines: { label: string; min: number; max: number }[]; totalMin: number; totalMax: number; perGuestMin: number; perGuestMax: number; remainingMin: number | null; remainingMax: number | null };
  // H. Vendor requirements (confirmed vs still-needed) + separated expenses.
  vendors: {
    confirmed: { name: string; category: string; cost: number | null }[];
    pending: { name: string; category: string; status: string }[];
    needed: string[]; // categories with no saved vendor yet
    confirmedExpense: number; // sum of agreed costs (NOT estimates)
    estimatedExpense: { min: number; max: number }; // indicative for pending/needed
  };
  // I. Recommendations
  recommendations: string[];
};

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// Build a realistic event-day timeline tuned to the event type/category.
function buildTimeline(plan: SerializedPlan): RoadmapTimelineSlot[] {
  const cat = plan.eventType.categoryName.toLowerCase();
  const name = plan.eventType.name.toLowerCase();
  const isWedding = cat.includes("wedding") || name.includes("wedding") || name.includes("reception") || name.includes("muhurtham");
  const isCorporate = cat.includes("corporate") || name.includes("conference") || name.includes("seminar");
  const isEvening = name.includes("reception") || name.includes("sangeet") || name.includes("concert") || name.includes("party");

  if (isWedding && !isEvening) {
    return [
      { time: "5:30 AM", activity: "Venue opens — final cleaning & access check" },
      { time: "6:00 AM", activity: "Decoration team: stage, mandap & entrance setup" },
      { time: "7:00 AM", activity: "Decoration inspection & lighting test" },
      { time: "7:30 AM", activity: "Catering setup & welcome-drink station" },
      { time: "8:30 AM", activity: "Guest welcome & seating begins" },
      { time: "9:30 AM", activity: "Main ceremony / muhurtham" },
      { time: "12:00 PM", activity: "Photography & guest interaction" },
      { time: "12:30 PM", activity: "Lunch service begins" },
      { time: "2:30 PM", activity: "Winding down & vendor settlement" },
    ];
  }
  if (isEvening) {
    return [
      { time: "2:00 PM", activity: "Venue access — decoration & stage setup" },
      { time: "4:00 PM", activity: "Lighting & sound check" },
      { time: "5:00 PM", activity: "Catering setup & welcome-drink counter" },
      { time: "6:00 PM", activity: "Guest welcome & photography" },
      { time: "7:00 PM", activity: "Main programme / reception on stage" },
      { time: "8:30 PM", activity: "Dinner service begins" },
      { time: "10:00 PM", activity: "Entertainment / close" },
    ];
  }
  if (isCorporate) {
    return [
      { time: "7:00 AM", activity: "Venue & AV setup, registration desk" },
      { time: "8:30 AM", activity: "Breakfast & guest registration" },
      { time: "9:30 AM", activity: "Opening session" },
      { time: "11:00 AM", activity: "Tea break & networking" },
      { time: "1:00 PM", activity: "Lunch" },
      { time: "2:00 PM", activity: "Afternoon sessions" },
      { time: "4:30 PM", activity: "Closing & high tea" },
    ];
  }
  // Generic celebration
  return [
    { time: "8:00 AM", activity: "Venue access & decoration setup" },
    { time: "10:00 AM", activity: "Decoration inspection & catering setup" },
    { time: "11:00 AM", activity: "Guest welcome" },
    { time: "12:00 PM", activity: "Main celebration / programme" },
    { time: "1:00 PM", activity: "Lunch service" },
    { time: "3:00 PM", activity: "Photography & close" },
  ];
}

function buildChecklist(plan: SerializedPlan, hasVenue: boolean, hasMenu: boolean): RoadmapTask[] {
  const tasks: RoadmapTask[] = [
    { title: "Confirm guest list & final headcount", detail: `Lock the ~${plan.guestCount} count that drives catering & seating.`, priority: "high", offsetDays: 60, owner: "Host family", status: "pending" },
    { title: hasVenue ? "Confirm venue booking in writing" : "Select & book a venue", detail: hasVenue ? `Reconfirm date, timings & terms with ${plan.selectedVenue?.name}.` : "Use Venue Discovery to pick a suitable event venue.", priority: "high", offsetDays: 55, owner: "Host", status: hasVenue ? "in-progress" : "pending" },
    { title: "Finalise caterer & menu", detail: hasMenu ? "Confirm per-plate rate and dietary counts with the caterer." : "Build the menu in the Food tab, then confirm with a caterer.", priority: "high", offsetDays: 45, owner: "Caterer coordinator", status: "pending" },
    { title: "Lock decoration & theme", detail: `Approve stage, entrance & table styling${plan.preferences?.["selectedThemeName"] ? ` for the "${String(plan.preferences["selectedThemeName"])}" theme` : ""}.`, priority: "medium", offsetDays: 40, owner: "Decorator", status: "pending" },
    { title: "Book photography & videography", detail: "Confirm coverage hours, deliverables and advance.", priority: "medium", offsetDays: 35, owner: "Host", status: "pending" },
    { title: "Book entertainment / music", detail: "DJ, live band or troupe as per the plan.", priority: "low", offsetDays: 30, owner: "Host", status: "pending" },
    { title: "Send invitations & collect RSVPs", detail: "Digital and/or printed invites; track responses.", priority: "medium", offsetDays: 30, owner: "Host family", status: "pending" },
    { title: "Finalise seating & layout", detail: "Confirm table, stage and dining zones; verify capacity against the guest count.", priority: "medium", offsetDays: 14, owner: "Host", status: "pending" },
    { title: "Arrange transport & parking", detail: "Guest transport, valet/parking and signage.", priority: "low", offsetDays: 10, owner: "Logistics", status: "pending" },
    { title: "Final vendor confirmations", detail: "Reconfirm timings, counts and balance payments.", priority: "high", offsetDays: 7, owner: "Host", status: "pending" },
    { title: "Day-before walkthrough", detail: "Check setup, access, power and run-of-show.", priority: "high", offsetDays: 1, owner: "Host + vendors", status: "pending" },
  ];
  return tasks;
}

export function generateRoadmap(plan: SerializedPlan, provider = "structured"): EventRoadmap {
  const hasVenue = !!plan.selectedVenue;
  const theme = (plan.preferences?.["selectedThemeName"] as string | undefined) ?? null;

  // --- Food estimate from the plan's saved menus (real arithmetic) ---
  const menuSelections: MenuSelection[] = [];
  const menuCourses: { course: string; items: string[] }[] = [];
  for (const m of plan.menus) {
    for (const c of m.courses) {
      menuCourses.push({ course: c.course, items: c.items });
    }
  }
  // If budget line items include a per-guest catering line, use it; else a
  // sensible indicative per-guest range from the menu count.
  const cateringLine = plan.budgetItems.find((b) => b.category === "catering");
  let foodMin = 0;
  let foodMax = 0;
  if (cateringLine) {
    foodMin = cateringLine.unitCostMin * cateringLine.quantity;
    foodMax = cateringLine.unitCostMax * cateringLine.quantity;
  } else if (menuCourses.length > 0) {
    const perMin = 350;
    const perMax = 900;
    const est = computeFoodEstimate(plan.guestCount, [{ slug: "menu", name: "Menu", servingsPerGuest: 1, priceMin: perMin, priceMax: perMax }]);
    foodMin = est.foodMin;
    foodMax = est.foodMax;
    menuSelections.push({ slug: "menu", name: "Menu", servingsPerGuest: 1, priceMin: perMin, priceMax: perMax });
  }

  // --- Budget report from saved budget items (+ food) ---
  const lines = plan.budgetItems.map((b) => ({ label: b.label, min: b.unitCostMin * b.quantity, max: b.unitCostMax * b.quantity }));
  if (!cateringLine && foodMax > 0) lines.push({ label: "Catering (menu estimate)", min: foodMin, max: foodMax });
  // Ensure common categories are represented as placeholders if missing.
  const haveCats = new Set(plan.budgetItems.map((b) => b.category));
  const ensure: { label: string; category: string; min: number; max: number }[] = [
    { label: "Photography & video", category: "photography", min: 35000, max: 200000 },
    { label: "Entertainment", category: "entertainment", min: 20000, max: 150000 },
    { label: "Transport", category: "transport", min: 10000, max: 80000 },
    { label: "Miscellaneous & buffer", category: "misc", min: 15000, max: 100000 },
  ];
  for (const e of ensure) if (!haveCats.has(e.category)) lines.push({ label: `${e.label} (estimate)`, min: e.min, max: e.max });

  const totalMin = lines.reduce((s, l) => s + l.min, 0);
  const totalMax = lines.reduce((s, l) => s + l.max, 0);
  const perGuestMin = plan.guestCount > 0 ? Math.round(totalMin / plan.guestCount) : 0;
  const perGuestMax = plan.guestCount > 0 ? Math.round(totalMax / plan.guestCount) : 0;
  const remainingMin = plan.budget > 0 ? plan.budget - totalMax : null;
  const remainingMax = plan.budget > 0 ? plan.budget - totalMin : null;

  // --- Decoration ---
  const decorLine = plan.budgetItems.find((b) => b.category === "decor");
  const decorItems = [
    "Entrance decoration",
    "Stage / mandap decoration",
    "Flower arrangements",
    "Lighting setup",
    "Table decoration",
  ];
  if (theme) decorItems.unshift(`Theme styling: ${theme}`);

  // --- Seating awareness ---
  const seats = seatingStatus(plan.guestCount, plan.layout?.objects ?? []);

  // --- Vendor requirements (from the user's ACTUAL saved vendors) ---
  const CORE_VENDOR_CATEGORIES = ["photography", "catering", "decoration"];
  const savedVendors = plan.savedVendors ?? [];
  const confirmedVendors = savedVendors.filter((v) => v.status === "CONFIRMED");
  const pendingVendors = savedVendors.filter((v) => v.status === "ENQUIRED" || v.status === "NEGOTIATING");
  const savedCategories = new Set(savedVendors.filter((v) => v.status !== "CANCELLED").map((v) => v.vendor?.category).filter(Boolean) as string[]);
  const neededCategories = CORE_VENDOR_CATEGORIES.filter((c) => !savedCategories.has(c));

  const confirmedExpense = confirmedVendors.reduce((s, v) => s + (typeof v.agreedCost === "number" ? v.agreedCost : 0), 0);
  // Indicative estimate for vendors not yet confirmed (cheapest package range).
  let pendingEstMin = 0;
  let pendingEstMax = 0;
  for (const v of pendingVendors) {
    const pkgs = v.vendor?.packages ?? [];
    if (pkgs.length) {
      pendingEstMin += Math.min(...pkgs.map((p) => p.priceMin));
      pendingEstMax += Math.max(...pkgs.map((p) => p.priceMax));
    }
  }

  const vendors = {
    confirmed: confirmedVendors.map((v) => ({ name: v.vendor?.name ?? "Vendor", category: v.vendor?.category ?? "", cost: typeof v.agreedCost === "number" ? v.agreedCost : null })),
    pending: pendingVendors.map((v) => ({ name: v.vendor?.name ?? "Vendor", category: v.vendor?.category ?? "", status: v.status })),
    needed: neededCategories,
    confirmedExpense,
    estimatedExpense: { min: pendingEstMin, max: pendingEstMax },
  };

  // --- Recommendations (grounded in the actual plan) ---
  const recs: string[] = [];
  if (plan.budget > 0 && totalMin > plan.budget) {
    recs.push(`Your estimated minimum (₹${totalMin.toLocaleString("en-IN")}) exceeds your budget (₹${plan.budget.toLocaleString("en-IN")}). Consider trimming decor scope or choosing a mid-range caterer.`);
  } else if (remainingMax != null && remainingMax < plan.budget * 0.1) {
    recs.push("You're close to your budget ceiling — keep a ~10% buffer for last-minute changes.");
  }
  if (!hasVenue) recs.push("No venue selected yet — book this first, as it drives catering counts and layout.");
  if (menuCourses.length === 0) recs.push("Add a menu in the Food tab so catering quantities and cost can be estimated.");
  if (seats.shortfall > 0) recs.push(`Seating is short by ${seats.shortfall} — plan for ~${Math.ceil(seats.shortfall / 8)} more round tables (8 seats each).`);
  if (neededCategories.length) recs.push(`Still to book: ${neededCategories.join(", ")}. Add these in the Vendors tab to lock costs and schedule.`);
  if (confirmedExpense > 0) recs.push(`₹${confirmedExpense.toLocaleString("en-IN")} of confirmed vendor cost is already reflected in your budget.`);
  recs.push("Confirm live counters' staffing ratio (1 per ~50 guests) to avoid queues.");
  if (theme) recs.push(`Coordinate florist and lighting to your "${theme}" palette for a cohesive look.`);
  recs.push("Share a day-of run-of-show with every vendor to avoid setup clashes.");

  return {
    generated: true,
    provider,
    overview: {
      title: plan.title,
      venue: plan.selectedVenue?.name ?? null,
      venueAddress: plan.selectedVenue?.address ?? null,
      date: fmtDate(plan.startDate),
      guestCount: plan.guestCount,
      theme,
      city: plan.city,
      eventType: plan.eventType.name,
      styles: plan.styles,
      totalEstimateMin: totalMin,
      totalEstimateMax: totalMax,
      budget: plan.budget,
      note: "All costs are indicative estimates, not confirmed quotes.",
    },
    venuePrep: [
      hasVenue ? `Confirm booking & terms with ${plan.selectedVenue?.name}.` : "Select and book a suitable event venue.",
      "Measure the hall and confirm usable floor area.",
      `Plan seating for ${plan.guestCount} guests (${seats.tablesNeeded} round tables at 8 each).`,
      "Decide stage / mandap placement and sightlines.",
      "Mark the dining area and buffet/live-counter positions.",
      "Arrange parking and a clear guest drop-off point.",
      "Confirm guest facilities: restrooms, water, seating for elders, accessibility.",
    ],
    decoration: {
      items: decorItems,
      setupSchedule: ["Day before: structure & drape setup", "Event morning: fresh flowers & final touches", "2 hrs before: lighting test & inspection"],
      estMin: decorLine ? decorLine.unitCostMin * decorLine.quantity : 40000,
      estMax: decorLine ? decorLine.unitCostMax * decorLine.quantity : 300000,
    },
    food: {
      menu: menuCourses.length ? menuCourses : [{ course: "Menu", items: ["Add dishes in the Food tab"] }],
      servingNote: `Plan servings for ~${plan.guestCount} guests (add ~5% buffer). Confirm final counts with the caterer 3 days before.`,
      estMin: foodMin,
      estMax: foodMax,
    },
    timeline: buildTimeline(plan),
    checklist: buildChecklist(plan, hasVenue, menuCourses.length > 0),
    budgetReport: { lines, totalMin, totalMax, perGuestMin, perGuestMax, remainingMin, remainingMax },
    vendors,
    recommendations: recs,
  };
}
