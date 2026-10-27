export function SampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-200 ${className}`}
      title="Sample data — not live venue information."
    >
      ● Sample data — not live
    </span>
  );
}

export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-peacock-400/40 bg-peacock-400/10 px-2 py-0.5 text-[11px] font-medium text-peacock-400 ${className}`}
      title="Live data from Google Maps Platform."
    >
      ● Live (Google)
    </span>
  );
}

export function CatalogBadge({ verified, className = "" }: { verified?: boolean; className?: string }) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ${className}`}
        title="Source-verified catalog record stored with permission."
      >
        ✓ Verified catalog
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-slate-400/40 bg-slate-400/10 px-2 py-0.5 text-[11px] font-medium text-slate-300 ${className}`}
      title="Catalog record — details not yet verified."
    >
      Catalog · Not verified
    </span>
  );
}

export function GeneratedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-plum-500/40 bg-plum-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-200 ${className}`}
      title="AI-generated suggestion — not a confirmed fact."
    >
      ✦ AI suggestion
    </span>
  );
}

export function UnverifiedTag({ label }: { label: string }) {
  return (
    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50" title="Unverified — confirm with the venue.">
      {label} · unverified
    </span>
  );
}
