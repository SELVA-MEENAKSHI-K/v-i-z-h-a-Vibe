"use client";

import { useMemo, useState } from "react";
import type { Plan } from "../planner/types";
import { formatINR } from "@/lib/client";
import { SmartImage } from "../ui/SmartImage";
import {
  MENU_ITEMS,
  COURSES,
  CUISINES,
  type MenuItemDef,
  type MenuCourse,
  type CuisineStyle,
  type Diet,
} from "@/data/menuItems";
import { computeFoodEstimate, remainingAfterFood, type MenuSelection } from "@/lib/menuBudget";

const DIETS: { slug: Diet | "all"; name: string }[] = [
  { slug: "all", name: "All diets" },
  { slug: "veg", name: "Veg" },
  { slug: "non-veg", name: "Non-veg" },
  { slug: "vegan", name: "Vegan" },
];

const DIET_BADGE: Record<Diet, { label: string; cls: string }> = {
  veg: { label: "● Veg", cls: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" },
  "non-veg": { label: "● Non-veg", cls: "text-red-300 border-red-400/40 bg-red-400/10" },
  vegan: { label: "● Vegan", cls: "text-lime-300 border-lime-400/40 bg-lime-400/10" },
};

type SelState = Record<string, { servingsPerGuest: number }>;

export function MenuGallery({ plan }: { plan: Plan }) {
  const [course, setCourse] = useState<MenuCourse | "all">("all");
  const [cuisine, setCuisine] = useState<CuisineStyle | "all">("all");
  const [diet, setDiet] = useState<Diet | "all">("all");
  const [guests, setGuests] = useState<number>(plan.guestCount || 100);
  const [serviceTaxPct, setServiceTaxPct] = useState<number>(0);
  const [selected, setSelected] = useState<SelState>({});

  const items = useMemo(
    () =>
      MENU_ITEMS.filter((m) => {
        if (course !== "all" && m.course !== course) return false;
        if (cuisine !== "all" && m.cuisine !== cuisine && m.cuisine !== "mixed") return false;
        if (diet !== "all" && m.diet !== diet) return false;
        return true;
      }),
    [course, cuisine, diet],
  );

  const selections: MenuSelection[] = useMemo(
    () =>
      Object.entries(selected).map(([slug, s]) => {
        const def = MENU_ITEMS.find((m) => m.slug === slug)!;
        return {
          slug,
          name: def.name,
          servingsPerGuest: s.servingsPerGuest,
          priceMin: def.priceMin,
          priceMax: def.priceMax,
        };
      }),
    [selected],
  );

  const estimate = useMemo(() => computeFoodEstimate(guests, selections, serviceTaxPct), [guests, selections, serviceTaxPct]);
  const remainingMin = remainingAfterFood(plan.budget, estimate.totalMax); // worst case vs budget
  const remainingMax = remainingAfterFood(plan.budget, estimate.totalMin);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[slug]) delete next[slug];
      else next[slug] = { servingsPerGuest: 1 };
      return next;
    });
  }
  function setServings(slug: string, v: number) {
    setSelected((prev) => ({ ...prev, [slug]: { servingsPerGuest: Math.max(0.25, Math.min(5, v)) } }));
  }

  return (
    <div className="space-y-5 pb-28">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-white/70">
            Guests
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
              className="w-24 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70">
            Service/Tax %
            <input
              type="number"
              min={0}
              max={30}
              value={serviceTaxPct}
              onChange={(e) => setServiceTaxPct(Math.max(0, Number(e.target.value)))}
              className="w-20 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-sm"
              title="Optional — only applied if you set it"
            />
          </label>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={course === "all"} onClick={() => setCourse("all")}>
            All courses
          </FilterChip>
          {COURSES.map((c) => (
            <FilterChip key={c.slug} active={course === c.slug} onClick={() => setCourse(c.slug)}>
              {c.icon} {c.name}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={cuisine === "all"} onClick={() => setCuisine("all")} tone="peacock">
            All cuisines
          </FilterChip>
          {CUISINES.filter((c) => c.slug !== "mixed").map((c) => (
            <FilterChip key={c.slug} active={cuisine === c.slug} onClick={() => setCuisine(c.slug)} tone="peacock">
              {c.name}
            </FilterChip>
          ))}
          <span className="mx-1 w-px bg-white/10" />
          {DIETS.map((d) => (
            <FilterChip key={d.slug} active={diet === d.slug} onClick={() => setDiet(d.slug)} tone="plum">
              {d.name}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Gallery */}
      {items.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
          No dishes match these filters. Try widening the cuisine or diet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <DishCard
              key={m.slug}
              item={m}
              guests={guests}
              selected={!!selected[m.slug]}
              servingsPerGuest={selected[m.slug]?.servingsPerGuest ?? 1}
              onToggle={() => toggle(m.slug)}
              onServings={(v) => setServings(m.slug, v)}
            />
          ))}
        </div>
      )}

      {/* Sticky estimate bar */}
      <div className="sticky bottom-3 z-10 rounded-2xl border border-white/10 vv-glass p-4 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/50">Food estimate ({Object.keys(selected).length} items · {guests} guests)</div>
            <div className="mt-0.5 text-lg font-semibold text-saffron-400">
              {formatINR(estimate.totalMin)} – {formatINR(estimate.totalMax)}
            </div>
            <div className="text-xs text-white/55">
              Per person {formatINR(estimate.perPersonMin)}–{formatINR(estimate.perPersonMax)}
              {estimate.serviceTaxPct > 0 && ` · incl ${estimate.serviceTaxPct}% service/tax`}
            </div>
          </div>
          <div className="text-right">
            {remainingMin != null && remainingMax != null ? (
              <>
                <div className="text-xs uppercase tracking-wide text-white/50">Remaining of {formatINR(plan.budget)}</div>
                <div className={`mt-0.5 text-lg font-semibold ${remainingMin < 0 ? "text-red-300" : "text-emerald-300"}`}>
                  {formatINR(remainingMin)} – {formatINR(remainingMax)}
                </div>
                {remainingMin < 0 && <div className="text-xs text-red-300/80">May exceed budget at the high end</div>}
              </>
            ) : (
              <div className="text-xs text-white/40">Set a budget on the plan to see remaining funds</div>
            )}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-amber-300/80">
          Demo estimate — indicative sample prices, not a confirmed catering quote. Find caterers to get real quotations.
        </p>
      </div>
    </div>
  );
}

// Real food photograph via SmartImage: real photo -> food fallback -> designed
// placeholder. Never a blank area and never a toy illustration.
function DishPhoto({ item }: { item: MenuItemDef }) {
  return (
    <SmartImage
      src={item.imageUrl}
      alt={`${item.name} — ${item.description}`}
      category="food"
      credit={item.imageSource}
      className="transition-transform duration-500 group-hover:scale-110"
      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
      noIllustrativeFallback
      placeholderText="Real photo unavailable"
    />
  );
}

function FilterChip({
  active,
  onClick,
  children,
  tone = "saffron",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "saffron" | "peacock" | "plum";
}) {
  const on =
    tone === "peacock"
      ? "bg-peacock-500 text-ink-900"
      : tone === "plum"
        ? "bg-plum-600 text-white"
        : "bg-saffron-500 text-ink-900";
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs transition ${active ? on : "bg-white/5 text-white/75 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

function DishCard({
  item,
  guests,
  selected,
  servingsPerGuest,
  onToggle,
  onServings,
}: {
  item: MenuItemDef;
  guests: number;
  selected: boolean;
  servingsPerGuest: number;
  onToggle: () => void;
  onServings: (v: number) => void;
}) {
  const qty = Math.ceil(guests * servingsPerGuest);
  const subMin = qty * item.priceMin;
  const subMax = qty * item.priceMax;
  const badge = DIET_BADGE[item.diet];

  return (
    <article
      className={`group overflow-hidden rounded-2xl border transition ${
        selected ? "border-saffron-500/60 shadow-glow" : "border-white/10 hover:border-white/25"
      } bg-ink-800/60`}
    >
      {/* Real food photograph (~60% of the card) with loading + error states */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1c1033]">
        <DishPhoto item={item} />
        <span className={`absolute left-2 top-2 z-10 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>
        <span className="absolute right-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] capitalize text-white/90 backdrop-blur-sm">
          {item.cuisine.replace("-", " ")}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold leading-tight">{item.name}</h4>
          <span className="whitespace-nowrap text-sm font-medium text-saffron-400">
            {formatINR(item.priceMin)}–{formatINR(item.priceMax)}
          </span>
        </div>
        <p className="mt-1 text-xs text-white/60">{item.description}</p>
        <p className="mt-2 text-[11px] text-white/45">
          Serving: {item.serving}
          {item.allergens.length > 0 && <> · Allergens: {item.allergens.join(", ")}</>}
        </p>

        {/* Expandable controls when selected */}
        {selected ? (
          <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 animate-fade-up">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Servings / guest</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onServings(servingsPerGuest - 0.25)} className="h-6 w-6 rounded bg-white/10 hover:bg-white/20" aria-label="Decrease servings">
                  −
                </button>
                <span className="w-10 text-center font-medium">{servingsPerGuest}</span>
                <button onClick={() => onServings(servingsPerGuest + 0.25)} className="h-6 w-6 rounded bg-white/10 hover:bg-white/20" aria-label="Increase servings">
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>
                Qty: <span className="font-medium text-white">{qty}</span> servings
              </span>
              <span>
                Subtotal: <span className="font-medium text-saffron-400">{formatINR(subMin)}–{formatINR(subMax)}</span>
              </span>
            </div>
            <button
              onClick={onToggle}
              className="w-full rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-400/20"
            >
              Remove from menu
            </button>
          </div>
        ) : (
          <button
            onClick={onToggle}
            className="mt-3 w-full rounded-lg bg-saffron-500 px-3 py-2 text-sm font-semibold text-ink-900 transition hover:bg-saffron-400"
          >
            + Add to event menu
          </button>
        )}
      </div>
    </article>
  );
}
