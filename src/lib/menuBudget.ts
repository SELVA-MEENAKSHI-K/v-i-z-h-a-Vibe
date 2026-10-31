// Food budget math — pure, deterministic functions (real arithmetic, never
// AI-generated totals). Used by the visual menu and the budget dashboard, and
// unit-tested in tests/menuBudget.test.ts.

export type MenuSelection = {
  slug: string;
  name: string;
  // Servings per guest (e.g. 1 = one serving each; 0.5 = shared). Default 1.
  servingsPerGuest: number;
  priceMin: number; // per serving, INR
  priceMax: number; // per serving, INR
};

export type SelectionLine = MenuSelection & {
  // Total servings required = ceil(guests * servingsPerGuest).
  quantity: number;
  subtotalMin: number;
  subtotalMax: number;
};

export type FoodEstimate = {
  currency: "INR";
  guests: number;
  lines: SelectionLine[];
  foodMin: number;
  foodMax: number;
  // Optional explicit service/tax percentage (0 unless configured).
  serviceTaxPct: number;
  serviceMin: number;
  serviceMax: number;
  totalMin: number;
  totalMax: number;
  perPersonMin: number;
  perPersonMax: number;
};

export function requiredQuantity(guests: number, servingsPerGuest: number): number {
  const g = Math.max(0, Math.floor(guests));
  const s = Math.max(0, servingsPerGuest);
  return Math.ceil(g * s);
}

export function computeFoodEstimate(
  guests: number,
  selections: MenuSelection[],
  serviceTaxPct = 0,
): FoodEstimate {
  const g = Math.max(0, Math.floor(guests));
  const pct = Math.max(0, serviceTaxPct);

  const lines: SelectionLine[] = selections.map((sel) => {
    const quantity = requiredQuantity(g, sel.servingsPerGuest);
    const subtotalMin = quantity * sel.priceMin;
    const subtotalMax = quantity * sel.priceMax;
    return { ...sel, quantity, subtotalMin, subtotalMax };
  });

  const foodMin = lines.reduce((s, l) => s + l.subtotalMin, 0);
  const foodMax = lines.reduce((s, l) => s + l.subtotalMax, 0);

  const serviceMin = Math.round((foodMin * pct) / 100);
  const serviceMax = Math.round((foodMax * pct) / 100);

  const totalMin = foodMin + serviceMin;
  const totalMax = foodMax + serviceMax;

  const perPersonMin = g > 0 ? Math.round(totalMin / g) : 0;
  const perPersonMax = g > 0 ? Math.round(totalMax / g) : 0;

  return {
    currency: "INR",
    guests: g,
    lines,
    foodMin,
    foodMax,
    serviceTaxPct: pct,
    serviceMin,
    serviceMax,
    totalMin,
    totalMax,
    perPersonMin,
    perPersonMax,
  };
}

// Remaining budget after food. Negative => over budget. Returns null when the
// user hasn't set a budget (budget <= 0).
export function remainingAfterFood(budget: number, foodTotal: number): number | null {
  if (!budget || budget <= 0) return null;
  return budget - foodTotal;
}
