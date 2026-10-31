"use client";

import { useState } from "react";
import type { Plan, PlanVenue } from "./types";
import { apiGet, apiSend, formatINR } from "@/lib/client";
import { SampleBadge, LiveBadge, CatalogBadge, UnverifiedTag } from "@/components/ui/Badges";
import { SmartImage } from "@/components/ui/SmartImage";

type SearchResult = {
  live: boolean;
  usedProvider: boolean;
  provider: string;
  usedLocation: boolean;
  keyMissing: boolean;
  sampleOnly: boolean;
  providerError: string | null;
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
  const [radiusKm, setRadiusKm] = useState(25);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  async function run(useCoords?: { lat: number; lng: number } | null) {
    setLoading(true);
    setError(null);
    setRateLimited(false);
    try {
      const params = new URLSearchParams();
      // When searching by live location, send coordinates; otherwise the city.
      const loc = useCoords ?? null;
      if (loc) {
        params.set("lat", String(loc.lat));
        params.set("lng", String(loc.lng));
        params.set("radiusKm", String(radiusKm));
      } else {
        params.set("city", plan.city);
      }
      if (query.trim()) params.set("query", query.trim());
      if (venueType) params.set("venueType", venueType);
      if (verifiedOnly) params.set("verifiedOnly", "1");
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

  // Request the browser's current GPS location, then run a "near me" search.
  function useMyLocation() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location isn't supported on this device or browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLocating(false);
        run(c);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access, or search by city instead."
            : "Couldn't get your location. Try again or search by city.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function clearLocation() {
    setCoords(null);
    run(null);
  }

  async function saveVenue(v: PlanVenue, select: boolean) {
    setSavingId(v.providerId || v.id);
    try {
      // We persist only the provider place ID + our own app data for live venues.
      const updated = await apiSend<Plan>(`/api/plans/${plan.shareToken}/venues`, "POST", {
        providerId: v.providerId || v.id,
        source: v.source === "geoapify" ? "geoapify" : v.source === "catalog" ? "catalog" : "sample",
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
    if (v.source === "geoapify") return <LiveBadge />;
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
          onKeyDown={(e) => e.key === "Enter" && run(coords)}
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
          onClick={() => run(coords)}
          disabled={loading}
          className="rounded-lg bg-saffron-500 px-5 py-2 text-sm font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Real-time location search */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={useMyLocation}
          disabled={locating || loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-peacock-500/50 bg-peacock-500/10 px-3 py-2 text-sm font-medium text-peacock-400 hover:bg-peacock-500/20 disabled:opacity-60"
        >
          <span aria-hidden>📍</span>
          {locating ? "Locating…" : "Use my location"}
        </button>
        <label className="flex items-center gap-1.5 text-xs text-white/60">
          Within
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            aria-label="Search radius in kilometers"
            className="vv-select rounded-md border border-white/15 px-2 py-1 text-xs"
          >
            {[5, 10, 25, 50].map((r) => (
              <option key={r} value={r} className="bg-ink-800 text-white">
                {r} km
              </option>
            ))}
          </select>
        </label>
        {coords && (
          <span className="inline-flex items-center gap-2 rounded-full bg-peacock-500/15 px-3 py-1 text-xs text-peacock-400">
            Near you ({coords.lat.toFixed(3)}, {coords.lng.toFixed(3)})
            <button onClick={clearLocation} className="text-white/60 hover:text-white" aria-label="Clear location and search by city">
              ✕
            </button>
          </span>
        )}
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-white/70" title="Exclude hotels/resorts whose event facilities aren't confirmed by the provider">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="accent-saffron-500"
          />
          Verified event venues only
        </label>
      </div>
      <p className="text-[11px] text-white/40">
        Results are filtered to event venues (marriage halls, banquet halls, convention centres, event spaces). Restaurants,
        shops and unrelated businesses are excluded. Hotels appear only as unverified unless the provider confirms event
        facilities. HTTPS (or localhost) is required for GPS location.
      </p>

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
          {result.usedProvider ? <LiveBadge /> : result.sampleOnly ? <SampleBadge /> : <CatalogBadge />}
          <span className="text-white/60">{result.notice}</span>
        </div>
      )}

      {/* Missing-key helper (only when it actually blocks live search) */}
      {result && result.keyMissing && !loading && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
          To enable live venue discovery (e.g. searching “Arunadu” nearby), add a server-side{" "}
          <code className="rounded bg-black/40 px-1">GEOAPIFY_API_KEY</code> in <code className="rounded bg-black/40 px-1">.env</code>{" "}
          and restart. See the README → “Configuring Geoapify Places”.
        </div>
      )}

      {/* Provider transient-error state */}
      {result?.providerError && !loading && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-200/80">
          Live venue search issue: {result.providerError}
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
          const photo = v.photos && v.photos.length > 0 ? v.photos[0] : null;
          return (
            <div key={key} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
              {/* Venue photo when provided; otherwise an illustrative fallback
                  (clearly labelled — never claimed to be the real venue). */}
              <div className="relative aspect-[16/9] w-full bg-[#1c1033]">
                <SmartImage
                  src={photo}
                  alt={photo ? `${v.name}` : `${v.name} — illustrative venue preview`}
                  category="venue"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
                <span className="absolute right-2 top-2 z-10">{sourceBadge(v)}</span>
              </div>
              <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{v.name}</h4>
                  {v.address && <p className="text-xs text-white/55">{v.address}</p>}
                </div>
              </div>

              {/* Event-suitability honesty label */}
              {v.source === "geoapify" && (
                <div className="mt-2">
                  {v.eventClass === "event-venue" ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                      ✓ Event venue (provider category)
                    </span>
                  ) : v.eventClass === "hotel-possible" ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300"
                      title="Listed as a hotel/resort. Event facilities are not confirmed by the provider — contact the venue."
                    >
                      ⚠ Event facilities unverified
                    </span>
                  ) : null}
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                {v.distanceKm != null && (
                  <span className="rounded-full bg-peacock-500/15 px-2 py-0.5 font-medium text-peacock-400">
                    📍 {v.distanceKm} km away
                  </span>
                )}
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
                    {v.source === "geoapify" ? "View on map ↗" : "Directions ↗"}
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
            </div>
          );
        })}
      </div>

      {/* Idle / empty state */}
      {!result && !loading && (
        <p className="text-sm text-white/50">
          Search to discover venues in {plan.city}, or use your location for nearby results. With a Geoapify key configured
          you&apos;ll see live results alongside any authorized catalog records; otherwise you&apos;ll see clearly-labeled
          catalog or sample venues.
        </p>
      )}
    </div>
  );
}
