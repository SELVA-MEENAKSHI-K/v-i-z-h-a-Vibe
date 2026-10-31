"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Plan, PlanVendorInfo, PlanSavedVendor, VendorStatus } from "./types";
import { apiGet, apiSend, formatINR } from "@/lib/client";
import { SmartImage } from "@/components/ui/SmartImage";

type CategoryDef = { slug: string; name: string; budgetCategory: string; icon: string; blurb: string };
type DiscoverResponse = { categories: CategoryDef[]; count: number; usedSamples: boolean; notice: string; vendors: PlanVendorInfo[] };

const CITIES = ["", "Madurai", "Chennai", "Bangalore"];
const STATUS_FLOW: VendorStatus[] = ["ENQUIRED", "NEGOTIATING", "CONFIRMED", "CANCELLED"];

const STATUS_STYLE: Record<VendorStatus, string> = {
  ENQUIRED: "bg-peacock-500/20 text-peacock-300",
  NEGOTIATING: "bg-amber-400/20 text-amber-200",
  CONFIRMED: "bg-emerald-500/20 text-emerald-300",
  CANCELLED: "bg-white/10 text-white/50",
};

function priceRange(v: PlanVendorInfo): string | null {
  if (!v.packages.length) return null;
  const min = Math.min(...v.packages.map((p) => p.priceMin));
  const max = Math.max(...v.packages.map((p) => p.priceMax));
  const unit = v.packages[0]?.unit ?? "";
  return `${formatINR(min)}–${formatINR(max)}${unit ? ` ${unit}` : ""}`;
}

export function VendorManagement({ plan, onSaved }: { plan: Plan; onSaved: (p: Plan) => void }) {
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [category, setCategory] = useState<string>("");
  const [city, setCity] = useState<string>(plan.city && CITIES.includes(plan.city) ? plan.city : "");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [results, setResults] = useState<PlanVendorInfo[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [enquiry, setEnquiry] = useState<PlanVendorInfo | null>(null);

  const saved = plan.savedVendors;
  const savedVendorIds = useMemo(() => new Set(saved.map((s) => s.vendor?.name.toLowerCase())), [saved]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (city) qs.set("city", city);
      if (query.trim()) qs.set("query", query.trim());
      if (maxPrice) qs.set("maxPrice", maxPrice);
      if (minRating) qs.set("minRating", minRating);
      const data = await apiGet<DiscoverResponse>(`/api/vendors?${qs}`);
      setCategories(data.categories);
      setResults(data.vendors);
      setNotice(data.notice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load vendors.");
    } finally {
      setLoading(false);
    }
  }, [category, city, query, maxPrice, minRating]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveVendor(v: PlanVendorInfo, enquiryText?: string, packageName?: string) {
    setError(null);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/vendors`, "POST", {
        vendorId: v.id,
        enquiry: enquiryText ?? null,
        packageName: packageName ?? null,
      });
      onSaved(data.plan);
      setEnquiry(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save vendor.");
    }
  }

  async function updateSaved(sv: PlanSavedVendor, patch: Record<string, unknown>) {
    setError(null);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/vendors/${sv.id}`, "PATCH", patch);
      onSaved(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update vendor.");
    }
  }

  async function removeSaved(sv: PlanSavedVendor) {
    setError(null);
    try {
      const data = await apiSend<{ plan: Plan }>(`/api/plans/${plan.shareToken}/vendors/${sv.id}`, "DELETE");
      onSaved(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove vendor.");
    }
  }

  function toggleCompare(id: string) {
    setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev));
  }

  const compareVendors = results.filter((v) => compare.includes(v.id));
  const confirmedCount = saved.filter((s) => s.status === "CONFIRMED").length;
  const confirmedSpend = saved
    .filter((s) => s.status === "CONFIRMED" && typeof s.agreedCost === "number")
    .reduce((sum, s) => sum + (s.agreedCost ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-xl font-semibold">Vendor discovery &amp; management</h3>
        <p className="text-sm text-white/60">
          Find photographers, caterers, decorators and more. Save vendors, track enquiries, and confirmed costs flow into your
          budget automatically.
        </p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

      {/* Saved vendors workflow */}
      {saved.length > 0 && (
        <div className="rounded-2xl border border-white/10 vv-glass p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold">Your vendors ({saved.length})</h4>
            <span className="text-xs text-white/55">
              {confirmedCount} confirmed{confirmedSpend > 0 ? ` · ${formatINR(confirmedSpend)} in budget` : ""}
            </span>
          </div>
          <div className="space-y-2">
            {saved.map((sv) => (
              <SavedVendorRow key={sv.id} sv={sv} onUpdate={(patch) => updateSaved(sv, patch)} onRemove={() => removeSaved(sv)} />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-white/40">Confirmed vendors with an agreed cost are added to your budget as non-estimated lines.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1.5 text-sm transition ${category === "" ? "bg-saffron-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${category === c.slug ? "bg-saffron-500 text-ink-900" : "bg-white/5 text-white/80 hover:bg-white/10"}`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vendors…"
          aria-label="Search vendors"
          className="min-w-[160px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" className="vv-select rounded-lg border border-white/15 px-3 py-2 text-sm">
          {CITIES.map((c) => (
            <option key={c || "any"} value={c} className="bg-ink-800">
              {c || "Any city"}
            </option>
          ))}
        </select>
        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="Maximum price" className="vv-select rounded-lg border border-white/15 px-3 py-2 text-sm">
          <option value="" className="bg-ink-800">Any price</option>
          <option value="50000" className="bg-ink-800">Under ₹50k</option>
          <option value="150000" className="bg-ink-800">Under ₹1.5L</option>
          <option value="500000" className="bg-ink-800">Under ₹5L</option>
        </select>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="Minimum rating" className="vv-select rounded-lg border border-white/15 px-3 py-2 text-sm">
          <option value="" className="bg-ink-800">Any rating</option>
          <option value="3" className="bg-ink-800">3★+</option>
          <option value="4" className="bg-ink-800">4★+</option>
        </select>
      </div>

      {notice && <p className="text-xs text-white/45">{notice}</p>}

      {/* Compare bar */}
      {compareVendors.length >= 2 && <CompareTable vendors={compareVendors} onClose={() => setCompare([])} />}

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/60">No vendors match these filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              alreadySaved={savedVendorIds.has(v.name.toLowerCase())}
              inCompare={compare.includes(v.id)}
              onCompare={() => toggleCompare(v.id)}
              onEnquire={() => setEnquiry(v)}
              onSave={() => saveVendor(v)}
            />
          ))}
        </div>
      )}

      {enquiry && <EnquiryModal vendor={enquiry} onClose={() => setEnquiry(null)} onSend={(msg, pkg) => saveVendor(enquiry, msg, pkg)} />}
    </div>
  );
}

function VendorCard({
  vendor,
  alreadySaved,
  inCompare,
  onCompare,
  onEnquire,
  onSave,
}: {
  vendor: PlanVendorInfo;
  alreadySaved: boolean;
  inCompare: boolean;
  onCompare: () => void;
  onEnquire: () => void;
  onSave: () => void;
}) {
  const price = priceRange(vendor);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1c1033]">
        <SmartImage src={vendor.photos[0]} alt={vendor.name} category="shop" sizes="(max-width:640px) 100vw, 33vw" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${vendor.verified ? "bg-emerald-500/90 text-ink-900" : "bg-amber-400/90 text-ink-900"}`}>
          {vendor.verified ? "✓ Verified" : "Sample"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-semibold">{vendor.name}</h4>
        <p className="text-xs capitalize text-white/55">
          {vendor.category.replace("-", " ")}
          {vendor.city ? ` · ${vendor.city}` : ""}
        </p>
        <div className="mt-1 text-xs text-white/70">
          {vendor.rating != null ? `★ ${vendor.rating.toFixed(1)}${vendor.reviewCount ? ` (${vendor.reviewCount})` : ""}` : "No verified rating"}
        </div>
        {price && <div className="mt-1 text-sm font-medium text-saffron-400">{price}</div>}
        {!vendor.verified && <p className="mt-1 text-[10px] text-amber-300/80">Indicative prices — not a confirmed quote.</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button onClick={onEnquire} className="flex-1 rounded-lg bg-saffron-500 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-saffron-400">
            {alreadySaved ? "Saved ✓ · Enquire" : "Enquire / Save"}
          </button>
          <button onClick={onSave} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5" title="Save without a message">
            + Save
          </button>
          <button
            onClick={onCompare}
            aria-pressed={inCompare}
            className={`rounded-lg border px-3 py-1.5 text-xs ${inCompare ? "border-peacock-400 bg-peacock-500/20 text-peacock-200" : "border-white/15 text-white/80 hover:bg-white/5"}`}
          >
            {inCompare ? "Comparing" : "Compare"}
          </button>
        </div>
      </div>
    </article>
  );
}

function SavedVendorRow({ sv, onUpdate, onRemove }: { sv: PlanSavedVendor; onUpdate: (patch: Record<string, unknown>) => void; onRemove: () => void }) {
  const [cost, setCost] = useState(sv.agreedCost != null ? String(sv.agreedCost) : "");
  const v = sv.vendor;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ favourite: !sv.favourite })}
            aria-pressed={sv.favourite}
            aria-label={sv.favourite ? "Remove favourite" : "Add favourite"}
            className="text-base"
          >
            {sv.favourite ? "❤️" : "🤍"}
          </button>
          <div>
            <div className="text-sm font-medium">{v?.name ?? "Vendor"}</div>
            <div className="text-[11px] capitalize text-white/50">
              {v?.category.replace("-", " ")}
              {sv.packageName ? ` · ${sv.packageName}` : ""}
            </div>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[sv.status]}`}>{sv.status}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={sv.status}
          onChange={(e) => onUpdate({ status: e.target.value })}
          aria-label="Vendor status"
          className="vv-select rounded-lg border border-white/15 px-2.5 py-1.5 text-xs"
        >
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s} className="bg-ink-800">
              {s}
            </option>
          ))}
        </select>

        {sv.status === "CONFIRMED" && (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              step={1000}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              onBlur={() => onUpdate({ agreedCost: cost === "" ? null : Number(cost) })}
              placeholder="Agreed cost ₹"
              aria-label="Agreed cost in rupees"
              className="w-32 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs"
            />
            <span className="text-[11px] text-white/45">→ budget</span>
          </div>
        )}

        <button onClick={onRemove} className="ml-auto rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-red-300 hover:bg-white/5">
          Remove
        </button>
      </div>
    </div>
  );
}

function CompareTable({ vendors, onClose }: { vendors: PlanVendorInfo[]; onClose: () => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-peacock-400/30 bg-peacock-500/[0.06] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-peacock-200">Compare ({vendors.length})</h4>
        <button onClick={onClose} className="text-xs text-white/60 hover:text-white">
          Clear
        </button>
      </div>
      <table className="w-full min-w-[480px] text-sm">
        <thead className="text-xs text-white/50">
          <tr>
            <th className="p-2 text-left">Vendor</th>
            <th className="p-2 text-left">Rating</th>
            <th className="p-2 text-left">Price</th>
            <th className="p-2 text-left">Data</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id} className="border-t border-white/10">
              <td className="p-2 font-medium">{v.name}</td>
              <td className="p-2">{v.rating != null ? `★ ${v.rating.toFixed(1)}` : "—"}</td>
              <td className="p-2">{priceRange(v) ?? "—"}</td>
              <td className="p-2">{v.verified ? "Verified" : "Sample"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnquiryModal({ vendor, onClose, onSend }: { vendor: PlanVendorInfo; onClose: () => void; onSend: (msg: string, pkg?: string) => void }) {
  const [msg, setMsg] = useState("");
  const [pkg, setPkg] = useState(vendor.packages[0]?.name ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="enquiry-title" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-5" onClick={(e) => e.stopPropagation()}>
        <h3 id="enquiry-title" className="font-display text-lg font-semibold">Enquire — {vendor.name}</h3>
        <p className="mt-1 text-xs text-white/55">We&apos;ll save this vendor to your plan with status ENQUIRED and keep your message.</p>
        {vendor.packages.length > 0 && (
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-white/70">Package of interest</span>
            <select value={pkg} onChange={(e) => setPkg(e.target.value)} className="vv-select w-full rounded-lg border border-white/15 px-3 py-2 text-sm">
              {vendor.packages.map((p) => (
                <option key={p.name} value={p.name} className="bg-ink-800">
                  {p.name} ({formatINR(p.priceMin)}–{formatINR(p.priceMax)})
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-white/70">Message (optional)</span>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            maxLength={2000}
            placeholder="Share your date, guest count and requirements…"
            className="min-h-[90px] w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/5">
            Cancel
          </button>
          <button onClick={() => onSend(msg, pkg || undefined)} className="rounded-lg bg-saffron-500 px-5 py-2 text-sm font-semibold text-ink-900 hover:bg-saffron-400">
            Save &amp; enquire
          </button>
        </div>
      </div>
    </div>
  );
}
