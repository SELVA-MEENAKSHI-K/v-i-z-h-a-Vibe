// AI timeline generator. Pure and unit-testable.
//
// Builds a realistic event-preparation schedule from the plan's ACTUAL data:
// event type, dates, guest count, selected venue, saved vendors, menus, theme
// and budget. Every deadline is derived from the real event date, and NO
// preparation task is ever scheduled on or after the event date (requirement).
//
// The output is persisted as TimelineTask rows by the /timeline route — this
// module only computes the plan; it does not touch the database.

import type { SerializedPlan } from "./plans";

export type GeneratedTask = {
  title: string;
  detail: string;
  // Days before the event (clamped to >= 1 so it is always before the event).
  offsetDays: number;
  priority: "high" | "medium" | "low";
  assignee: string;
  status: "pending";
  // Link to a saved vendor (DB id) when the task concerns a specific vendor.
  vendorId: string | null;
  // Title of a task this one depends on (resolved to an id after insert).
  dependsOnTitle: string | null;
};

// Clamp an offset so the task lands strictly before the event. When the event
// is very soon (e.g. 3 days away), compress offsets into the available window.
function clampOffset(desired: number, daysUntilEvent: number | null): number {
  if (daysUntilEvent == null) return Math.max(1, desired);
  // Always at least 1 day before; never after the event (offset >= 1).
  const maxOffset = Math.max(1, daysUntilEvent);
  if (desired <= maxOffset) return Math.max(1, desired);
  // Compress proportionally into the available lead time, keeping order.
  const scaled = Math.round((desired / 60) * maxOffset);
  return Math.min(maxOffset, Math.max(1, scaled));
}

function daysUntil(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  return diff;
}

// Build the schedule. Tasks are ordered soonest-prep-first (largest offset).
export function generateTimeline(plan: SerializedPlan): GeneratedTask[] {
  const daysOut = daysUntil(plan.startDate);
  const hasVenue = !!plan.selectedVenue;
  const hasMenu = plan.menus.length > 0;
  const theme = (plan.preferences?.["selectedThemeName"] as string | undefined) ?? null;

  const confirmedVendors = plan.savedVendors.filter((v) => v.status === "CONFIRMED");
  const pendingVendors = plan.savedVendors.filter((v) => v.status === "ENQUIRED" || v.status === "NEGOTIATING");

  const tasks: GeneratedTask[] = [];
  const add = (t: Omit<GeneratedTask, "offsetDays" | "status"> & { desiredOffset: number }) => {
    tasks.push({
      title: t.title,
      detail: t.detail,
      priority: t.priority,
      assignee: t.assignee,
      vendorId: t.vendorId,
      dependsOnTitle: t.dependsOnTitle,
      status: "pending",
      offsetDays: clampOffset(t.desiredOffset, daysOut),
    });
  };

  // --- Core milestones (always present) ---
  add({
    title: "Confirm guest list & final headcount",
    detail: `Lock the ~${plan.guestCount} count that drives catering, seating and vendor quantities.`,
    desiredOffset: 60,
    priority: "high",
    assignee: "Host family",
    vendorId: null,
    dependsOnTitle: null,
  });

  add({
    title: hasVenue ? "Confirm venue booking in writing" : "Select & book a venue",
    detail: hasVenue
      ? `Reconfirm date, timings and terms with ${plan.selectedVenue?.name}.`
      : "Use Venue Discovery to shortlist and book a suitable event venue.",
    desiredOffset: 55,
    priority: "high",
    assignee: "Host",
    vendorId: null,
    dependsOnTitle: "Confirm guest list & final headcount",
  });

  // --- Vendor-specific tasks (from the user's ACTUAL saved vendors) ---
  for (const sv of pendingVendors) {
    if (!sv.vendor) continue;
    add({
      title: `Finalise ${sv.vendor.category} vendor: ${sv.vendor.name}`,
      detail:
        sv.status === "NEGOTIATING"
          ? `Close negotiation and confirm the ${sv.packageName ?? "package"} with ${sv.vendor.name}.`
          : `Follow up on your enquiry with ${sv.vendor.name} and move to confirmation.`,
      desiredOffset: 45,
      priority: "high",
      assignee: "Host",
      vendorId: sv.vendorId,
      dependsOnTitle: "Select & book a venue",
    });
  }
  for (const sv of confirmedVendors) {
    if (!sv.vendor) continue;
    add({
      title: `Coordinate with ${sv.vendor.name} (${sv.vendor.category})`,
      detail: `Share the run-of-show, timings and final counts with ${sv.vendor.name}.`,
      desiredOffset: 14,
      priority: "medium",
      assignee: "Host",
      vendorId: sv.vendorId,
      dependsOnTitle: null,
    });
  }

  // --- Catering / menu ---
  add({
    title: "Finalise caterer & menu",
    detail: hasMenu
      ? "Confirm the per-plate rate, dietary counts and live-counter staffing."
      : "Build the menu in the Food tab, then confirm quantities with a caterer.",
    desiredOffset: 45,
    priority: "high",
    assignee: "Caterer coordinator",
    vendorId: null,
    dependsOnTitle: "Confirm guest list & final headcount",
  });

  // --- Decoration / theme ---
  add({
    title: "Lock decoration & theme",
    detail: `Approve stage, entrance and table styling${theme ? ` for the "${theme}" theme` : ""}.`,
    desiredOffset: 40,
    priority: "medium",
    assignee: "Decorator",
    vendorId: null,
    dependsOnTitle: null,
  });

  // --- Invitations ---
  add({
    title: "Send invitations & collect RSVPs",
    detail: "Finalise the invite design, dispatch, and track responses.",
    desiredOffset: 30,
    priority: "medium",
    assignee: "Host family",
    vendorId: null,
    dependsOnTitle: "Confirm guest list & final headcount",
  });

  // --- Logistics ---
  add({
    title: "Arrange transport & parking",
    detail: "Guest transport, valet/parking and clear signage.",
    desiredOffset: 10,
    priority: "low",
    assignee: "Logistics",
    vendorId: null,
    dependsOnTitle: null,
  });

  add({
    title: "Final vendor confirmations & balance payments",
    detail: "Reconfirm timings, counts and settle balances with every vendor.",
    desiredOffset: 7,
    priority: "high",
    assignee: "Host",
    vendorId: null,
    dependsOnTitle: null,
  });

  add({
    title: "Day-before walkthrough",
    detail: "Check setup, access, power and the run-of-show with the venue.",
    desiredOffset: 1,
    priority: "high",
    assignee: "Host + vendors",
    vendorId: null,
    dependsOnTitle: "Final vendor confirmations & balance payments",
  });

  // Order soonest-first in prep terms (largest offset = earliest calendar date).
  tasks.sort((a, b) => b.offsetDays - a.offsetDays);
  return tasks;
}

// Derive the concrete dueDate (ISO) for an offset, given the event date.
export function dueDateForOffset(eventIso: string | null, offsetDays: number): string | null {
  if (!eventIso) return null;
  const d = new Date(eventIso);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
}

// Compute the live status of a task given its stored status + due date.
// A pending/in-progress task whose due date has passed becomes "overdue".
export function effectiveStatus(
  stored: string,
  done: boolean,
  dueDateIso: string | null,
  now: Date = new Date(),
): "pending" | "in-progress" | "completed" | "overdue" {
  if (done || stored === "completed") return "completed";
  if (dueDateIso) {
    const due = new Date(dueDateIso);
    if (!Number.isNaN(due.getTime()) && due.getTime() < now.getTime()) return "overdue";
  }
  if (stored === "in-progress") return "in-progress";
  return "pending";
}

// Completion percentage across tasks.
export function completionPct(tasks: { done: boolean; status: string }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.done || t.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}
