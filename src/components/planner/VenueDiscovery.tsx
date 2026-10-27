"use client";

import { useState } from "react";
import type { Plan, PlanVenue } from "./types";
import { apiGet, apiSend, formatINR } from "@/lib/client";
import { SampleBadge, LiveBadge, CatalogBadge, UnverifiedTag } from "@/components/ui/Badges";

type SearchResult = {
  live: boolean;
  usedGoogle: boolean;
  keyMissing: boolean;
  sampleOnly: boolean;
  googleError: string | null;
  catalogCount: number;
  city: string | null;
  query: string | null;
  source: string;
  notice: string;
  count: number;
  venues: PlanVenue[];
};

const VENUE_TYPES = [
  { value: "", label: "All types" },
  { value: "mahal", label: "Mahal" },
  { value: "wedding_hall", label: "Wedding hall" },
  { value: "banquet_hall", label: "Banquet hall" },
  { value: "party_hall", label: "Party hall" },
  { value: "convention_center", label: "Convention center" },
  { value: "resort", label: "Resort" },
];

export function VenueDiscovery({ plan, onSaved }: { plan: Plan; onSaved: (p: Plan) => void }) {
  const [query, setQuery] = useState("");
  const [venueType, setVenueType] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setRateLimited(false);
    try {
      const params = new URLSearchParams({ city: plan.city });
      if (query.trim()) params.set("query", query.trim());
      if (venueType) params.set("venueType", venueType);
      const data = await apiGet<SearchResult>(`/api/venues/search?${params.toString()}`);
      setResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Search failed.";
      if (/too many requests/i.test(msg)) setRateLimited(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function saveVenue(v: PlanVenue, select: boolean) {
    setSavingId(v.providerId || v.id);
    try {
      // We persist only the Place ID + our own app data for Google venues.
      const updated = await apiSend<Plan>(`/api/plans/${plan.shareToken}/venues`, "POST", {
        providerId: v.providerId || v.id,
        source: v.source === "google" ? "google" : v.source === "catalog" ? "catalog" : "sample",
        name: v.name,
        address: v.address,
        city: v.city,
        lat: v.lat,
        lng: v.lng,
        rating: v.rating,
        reviewCount: v.reviewCount,
        website: v.website,
        phone: v.phone,
        openingHours: v.openingHours,
        photos: v.photos,
        venueTypes: v.venueTypes,
        mapsUrl: v.mapsUrl,
        attribution: v.attribution,
        select,
      });
      onSaved(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save venue.");
    } finally {
      setSavingId(null);
    }
  }

  function sourceBadge(v: PlanVenue) {
    if (v.source === "google") return <LiveBadge />;
    if (v.source === "catalog") return <CatalogBadge verified={v.verified} />;
    return <SampleBadge />;
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={`Search ${plan.city} venues — mahal, wedding hall, party hall, or a venue name`}
          aria-label={`Search venues in ${plan.city}`}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        <select
          value={venueType}
          onChange={(e) => setVenueType(e.target.value)}
          aria-label="Venue type filter"
          className="vv-select rounded-lg border border-white/15 px-3 py-2 text-sm"
        >
          {VENUE_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="bg-ink-800 text-white">
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg bg-saffron-500 px-5 py-2 text-sm font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Context: what is being searched */}
      <p className="text-xs text-white/50">
        Searching in <span className="text-white/80">{plan.city}</span>
        {query.trim() && (
          <>
            {" "}
            for “<span className="text-white/80">{query.trim()}</span>”
          </>
        )}
        {venueType && <> · type: {VENUE_TYPES.find((t) => t.value === venueType)?.label}</>}
      </p>

      {/* Loading state */}
      {loading && (
        <div className="grid gap-3 md:grid-cols-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Rate-limit state */}
      {rateLimited && (
        <div role="alert" className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          You&apos;re searching too quickly. Please wait a minute and try again.
        </div>
      )}

      {/* Error state */}
      {error && !rateLimited && (
        <div role="alert" className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Notice / source banner */}
      {result && !loading && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {result.usedGoogle ? <LiveBadge /> : result.sampleOnly ? <SampleBadge /> : <CatalogBadge />}
          <span className="text-white/60">{result.notice}</span>
        </div>
      )}

      {/* Missing-key helper (only when it actually blocks live search) */}
      {result && result.keyMissing && !loading && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
          To enable live venue discovery (e.g. searching “Arunadu” on Google), add a server-side{" "}
          <code className="rounded bg-black/40 px-1">GOOGLE_PLACES_API_KEY</code> in <code className="rounded bg-black/40 px-1">.env</code>{" "}
          and restart. See the README → “Configuring Google Places”.
        </div>
      )}

      {/* Google transient-error state */}
      {result?.googleError && !loading && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/80">
          Live Google search issue: {result.googleError}
        </div>
      )}

      {/* No-results state */}
      {result && result.venues.length === 0 && !loading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
          No venues found for “{result.query || "your search"}” in {plan.city}.
          <div className="mt-1 text-xs text-white/40">Try a broader term like “wedding hall” or “banquet hall”.</div>
        </div>
      )}

      {/* Results */}
      <div className="grid gap-3 md:grid-cols-2">
        {result?.venues.map((v) => {
          const key = v.providerId || v.id;
          const isSaved = plan.savedVenues.some((s) => (s.venue.providerId || s.venue.id) === key);
          const isSelected = (plan.selectedVenue?.providerId || plan.selectedVenue?.id) === key;
          const hasVerifiedCapacity = v.capacityMin != null || v.capacityMax != null;
          const hasVerifiedPrice = v.priceMin != null || v.priceMax != null;
          return (
            <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{v.name}</h4>
                  {v.address && <p className="text-xs text-white/55">{v.address}</p>}
                </div>
                {sourceBadge(v)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                {v.rating != null && (
                  <span>
                    ★ {v.rating} {v.reviewCount != null && <span className="text-white/40">({v.reviewCount})</span>}
                  </span>
                )}
                {v.venueTypes.slice(0, 2).map((t) => (
                  <span key={t} className="rounded bg-white/5 px-1.5 py-0.5">
                    {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              {/* Capacity / price — verified values only, else confirm message */}
              <div className="mt-2 space-y-1 text-xs">
                <div className="text-white/70">
                  Capacity:{" "}
                  {hasVerifiedCapacity ? (
                    <span className="text-emerald-300">
                      {v.capacityMin ?? "?"}
                      {v.capacityMax ? `–${v.capacityMax}` : "+"} guests
                    </span>
                  ) : (
                    <span className="text-white/45">Contact venue to confirm.</span>
                  )}
                </div>
                <div className="text-white/70">
                  Price:{" "}
                  {hasVerifiedPrice ? (
                    <span className="text-emerald-300">
                      {formatINR(v.priceMin ?? 0)}
                      {v.priceMax ? `–${formatINR(v.priceMax)}` : "+"}
                    </span>
                  ) : (
                    <span className="text-white/45">Contact venue to confirm.</span>
                  )}
                </div>
              </div>

              {!hasVerifiedCapacity && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <UnverifiedTag label="capacity" />
                  <UnverifiedTag label="pricing" />
                  <UnverifiedTag label="availability" />
                </div>
              )}

              {v.amenities && v.amenities.length > 0 && (
                <p className="mt-2 text-xs text-white/55">Amenities: {v.amenities.join(", ")}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {v.mapsUrl && (
                  <a href={v.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-peacock-400 hover:underline">
                    {v.source === "google" ? "Open in Google Maps ↗" : "Directions ↗"}
                  </a>
                )}
                {v.website && (
                  <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-peacock-400 hover:underline">
                    Website ↗
                  </a>
                )}
                {v.phone && <span className="text-white/60">{v.phone}</span>}
              </div>

              {v.attribution && <p className="mt-2 text-[10px] text-white/40">{v.attribution}</p>}
              {v.sourceUrl && v.source === "catalog" && (
                <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/40 underline">
                  Source ↗
                </a>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => saveVenue(v, false)}
                  disabled={savingId === key || isSaved}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:opacity-50"
                >
                  {isSaved ? "Saved" : "Shortlist"}
                </button>
                <button
                  onClick={() => saveVenue(v, true)}
                  disabled={savingId === key}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    isSelected ? "bg-peacock-600 text-white" : "bg-saffron-500 text-ink-900 hover:bg-saffron-400"
                  }`}
                >
                  {isSelected ? "Selected ✓" : "Select for plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Idle / empty state */}
      {!result && !loading && (
        <p className="text-sm text-white/50">
          Search to discover venues in {plan.city}. With a Google Places key configured you&apos;ll see live Google results
          alongside any authorized catalog records; otherwise you&apos;ll see clearly-labeled catalog or sample venues.
        </p>
      )}
    </div>
  );
}
