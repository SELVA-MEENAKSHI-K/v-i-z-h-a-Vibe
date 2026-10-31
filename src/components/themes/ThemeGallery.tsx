"use client";

// Image-first, Pinterest-style theme inspiration gallery. Real photographs
// (local /public/images/themes/*) via SmartImage with fallback, category &
// filter chips, a detail modal, favourites, and "Apply theme" that persists to
// the plan and drives the 3D planner's stage colours. CSS/Tailwind animations
// (no framer-motion dependency) keep it fast on low-memory machines.

import { useMemo, useState } from "react";
import type { Plan } from "../planner/types";
import { apiSend, formatINR } from "@/lib/client";
import { SmartImage } from "../ui/SmartImage";
import {
  THEMES,
  THEME_CATEGORIES,
  THEME_REGIONS,
  THEME_BUDGET_TIERS,
  filterThemes,
  type ThemeDef,
  type ThemeCategory,
  type ThemeRegion,
  type ThemeBudgetTier,
  type Setting,
} from "@/data/themes";

const SETTINGS: { slug: Setting | "all"; name: string }[] = [
  { slug: "all", name: "Any setting" },
  { slug: "indoor", name: "Indoor" },
  { slug: "outdoor", name: "Outdoor" },
];

export function ThemeGallery({ plan, onApplied }: { plan: Plan; onApplied?: (p: Plan) => void }) {
  const [category, setCategory] = useState<ThemeCategory | "all">("all");
  const [region, setRegion] = useState<ThemeRegion | "all">("all");
  const [budget, setBudget] = useState<ThemeBudgetTier | "all">("all");
  const [setting, setSetting] = useState<Setting | "all">("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<ThemeDef | null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null);

  const appliedSlug = (plan.preferences?.["selectedThemeSlug"] as string | undefined) ?? undefined;

  const themes = useMemo(
    () => filterThemes({ category, region, budget, setting, search }),
    [category, region, budget, setting, search],
  );

  function toggleFav(slug: string) {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function applyTheme(th: ThemeDef) {
    setApplyingSlug(th.slug);
    try {
      const updated = await apiSend<Plan>(`/api/plans/${plan.shareToken}`, "PATCH", {
        preferences: {
          ...plan.preferences,
          selectedThemeSlug: th.slug,
          selectedThemeName: th.name,
          themeStageColor: th.threeD.stageColor,
          themeAccentColor: th.threeD.accentColor,
          themeStyleToken: th.threeD.styleToken,
        },
      });
      onApplied?.(updated);
      setDetail(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not apply theme.");
    } finally {
      setApplyingSlug(null);
    }
  }

  async function removeTheme() {
    setApplyingSlug("__remove__");
    try {
      const prefs = { ...plan.preferences } as Record<string, unknown>;
      delete prefs.selectedThemeSlug;
      delete prefs.selectedThemeName;
      delete prefs.themeStageColor;
      delete prefs.themeAccentColor;
      delete prefs.themeStyleToken;
      const updated = await apiSend<Plan>(`/api/plans/${plan.shareToken}`, "PATCH", { preferences: prefs });
      onApplied?.(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not remove theme.");
    } finally {
      setApplyingSlug(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Applied theme banner */}
      {appliedSlug && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-saffron-500/30 bg-saffron-500/10 px-4 py-2.5 text-sm">
          <span>
            Applied theme: <span className="font-semibold text-saffron-400">{String(plan.preferences?.["selectedThemeName"] ?? appliedSlug)}</span>
            <span className="ml-2 text-xs text-white/50">— drives the 3D planner stage colours</span>
          </span>
          <button onClick={removeTheme} disabled={applyingSlug === "__remove__"} className="rounded-md border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/5">
            {applyingSlug === "__remove__" ? "Removing…" : "Remove theme"}
          </button>
        </div>
      )}

      {/* Category filter (scrollable) */}
      <div className="vv-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {THEME_CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
              category === c.slug ? "bg-saffron-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            <span aria-hidden>{c.icon}</span>
            {c.name}
          </button>
        ))}
      </div>

      {/* Secondary filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search themes…"
          aria-label="Search themes"
          className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        <Select value={region} onChange={(v) => setRegion(v as ThemeRegion | "all")} options={THEME_REGIONS} label="Region" />
        <Select value={budget} onChange={(v) => setBudget(v as ThemeBudgetTier | "all")} options={THEME_BUDGET_TIERS} label="Budget" />
        <Select value={setting} onChange={(v) => setSetting(v as Setting | "all")} options={SETTINGS} label="Setting" />
      </div>

      <p className="text-xs text-white/45">
        {themes.length} theme{themes.length === 1 ? "" : "s"} · inspiration photographs (licensed), not photos of a specific venue.
      </p>

      {/* Masonry-style gallery */}
      {themes.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/60">
          No themes match these filters. Try widening them.
        </p>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {themes.map((th, i) => (
            <ThemeCard
              key={th.slug}
              theme={th}
              index={i}
              isFav={favs.has(th.slug)}
              isApplied={appliedSlug === th.slug}
              applying={applyingSlug === th.slug}
              onFav={() => toggleFav(th.slug)}
              onView={() => setDetail(th)}
              onApply={() => applyTheme(th)}
            />
          ))}
        </div>
      )}

      {detail && (
        <ThemeModal
          theme={detail}
          isApplied={appliedSlug === detail.slug}
          applying={applyingSlug === detail.slug}
          onClose={() => setDetail(null)}
          onApply={() => applyTheme(detail)}
        />
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { slug: string; name: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="vv-select rounded-lg border border-white/15 px-3 py-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.slug} value={o.slug} className="bg-ink-800 text-white">
          {o.name}
        </option>
      ))}
    </select>
  );
}

function ThemeCard({
  theme,
  index,
  isFav,
  isApplied,
  applying,
  onFav,
  onView,
  onApply,
}: {
  theme: ThemeDef;
  index: number;
  isFav: boolean;
  isApplied: boolean;
  applying: boolean;
  onFav: () => void;
  onView: () => void;
  onApply: () => void;
}) {
  return (
    <article
      className="group block break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60 opacity-0 shadow-panel [animation-fill-mode:forwards]"
      style={{ animation: `fade-up 0.5s ease-out ${Math.min(index, 8) * 60}ms forwards` }}
    >
      {/* Image occupies most of the card */}
      <button onClick={onView} className="relative block aspect-[4/5] w-full overflow-hidden bg-[#1c1033] text-left" aria-label={`View ${theme.name}`}>
        <SmartImage
          src={theme.image}
          alt={`${theme.name} — ${theme.summary}`}
          category="decoration"
          credit={theme.imageSource}
          className="transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
        />
        {/* gradient + title overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 pt-10">
          <h3 className="font-display text-lg font-semibold leading-tight text-white drop-shadow">{theme.name}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-saffron-500/90 px-2 py-0.5 text-[10px] font-medium capitalize text-ink-900">{theme.category}</span>
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] capitalize text-white/90 backdrop-blur-sm">{theme.region.replace("-", " ")}</span>
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] capitalize text-white/90 backdrop-blur-sm">{theme.budgetTier}</span>
          </div>
        </div>
        {/* favourite */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onFav();
            }
          }}
          aria-label={isFav ? "Remove from favourites" : "Save to favourites"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-base backdrop-blur-sm transition hover:bg-black/70"
        >
          {isFav ? "❤️" : "🤍"}
        </span>
        {isApplied && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-ink-900">✓ Applied</span>
        )}
      </button>

      {/* palette + actions */}
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          {theme.palette.map((c) => (
            <span key={c} className="h-4 w-4 rounded-full ring-1 ring-white/20" style={{ background: c }} title={c} />
          ))}
          <span className="ml-auto text-[11px] text-white/50">
            {formatINR(theme.decorBudgetMin)}–{formatINR(theme.decorBudgetMax)}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={onView} className="flex-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/85 hover:bg-white/5">
            View details
          </button>
          <button
            onClick={onApply}
            disabled={applying}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              isApplied ? "bg-emerald-600 text-white" : "bg-saffron-500 text-ink-900 hover:bg-saffron-400"
            } disabled:opacity-60`}
          >
            {applying ? "Applying…" : isApplied ? "Applied ✓" : "Apply theme"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ThemeModal({
  theme,
  isApplied,
  applying,
  onClose,
  onApply,
}: {
  theme: ThemeDef;
  isApplied: boolean;
  applying: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${theme.name} details`}
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/9] w-full bg-[#1c1033]">
          <SmartImage src={theme.image} alt={theme.name} category="decoration" credit={theme.imageSource} sizes="100vw" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-12">
            <h3 className="font-display text-2xl font-semibold text-white">{theme.name}</h3>
            <p className="mt-1 text-sm text-white/80">{theme.summary}</p>
          </div>
        </div>

        <div className="vv-scroll max-h-[55vh] space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Tag>{theme.category}</Tag>
            <Tag>{theme.region.replace("-", " ")}</Tag>
            <Tag>{theme.budgetTier}</Tag>
            <Tag>{theme.setting}</Tag>
            <Tag>
              {theme.guestMin}–{theme.guestMax} guests
            </Tag>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-semibold text-saffron-400">Colour palette</h4>
            <div className="flex gap-2">
              {theme.palette.map((c) => (
                <div key={c} className="flex flex-col items-center gap-1">
                  <span className="h-8 w-8 rounded-lg ring-1 ring-white/20" style={{ background: c }} />
                  <span className="text-[10px] text-white/50">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <Section title="Decoration" items={theme.decor} />
          <Section title="Stage ideas" items={theme.stageIdeas} />
          <Section title="Entrance ideas" items={theme.entranceIdeas} />
          <Section title="Lighting" items={theme.lightingIdeas} />
          <Section title="Food presentation" items={theme.foodPresentation} />

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Estimated decoration budget</span>
              <span className="font-semibold text-saffron-400">
                {formatINR(theme.decorBudgetMin)} – {formatINR(theme.decorBudgetMax)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-amber-300/80">Indicative estimate — not a confirmed quote.</p>
          </div>

          {!theme.threeD.available && (
            <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              3D preview for this theme is limited — its photographic inspiration is shown above, and applying it will still
              set the planner&apos;s colour palette.
            </p>
          )}
          <p className="text-[11px] text-white/40">{theme.imageSource}</p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/5">
            Close
          </button>
          <button
            onClick={onApply}
            disabled={applying}
            className={`rounded-lg px-5 py-2 text-sm font-semibold ${
              isApplied ? "bg-emerald-600 text-white" : "bg-saffron-500 text-ink-900 hover:bg-saffron-400"
            } disabled:opacity-60`}
          >
            {applying ? "Applying…" : isApplied ? "Applied to event ✓" : "Apply to event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-saffron-400">{title}</h4>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <li key={it} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/75">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/5 px-2.5 py-1 capitalize text-white/75">{children}</span>;
}
