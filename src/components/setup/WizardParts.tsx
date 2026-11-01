import type { ReactNode } from "react";

// Small presentational helpers used by the setup wizard, extracted verbatim
// from SetupWizard.tsx (same props, same markup). No behaviour change.

/** Labelled form field with an optional required marker and error message. */
export function Field({ label, children, className = "", required = false, error }: { label: string; children: ReactNode; className?: string; required?: boolean; error?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-white/80">
        {label}
        {required ? <span className="ml-0.5 text-kumkum-500" aria-hidden>*</span> : <span className="ml-1 text-xs font-normal text-white/40">(optional)</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-300">
          {error}
        </span>
      )}
    </label>
  );
}

/** A labelled key/value row in the live-preview summary list. */
export function Row({ icon, label, value, extra, muted }: { icon: string; label: string; value: string; extra?: string; muted?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="flex w-24 shrink-0 items-center gap-2 text-white/50">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right">
        <span key={value} className={`vv-pop inline-block break-words font-medium capitalize ${muted ? "text-white/30" : "text-white"}`}>
          {value}
        </span>
        {extra && <div className="text-[11px] text-white/45">{extra}</div>}
      </dd>
    </div>
  );
}
