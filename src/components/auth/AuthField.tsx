"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

// A labelled input for the light auth card: leading icon, focus ring, and an
// optional password show/hide eye toggle. Keeps native validation attributes.
type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  /** When true, renders a password field with a working show/hide toggle. */
  password?: boolean;
  hint?: string;
};

export function AuthField({ label, icon, password, hint, id, ...rest }: Props) {
  const [show, setShow] = useState(false);
  const inputId = id ?? `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const type = password ? (show ? "text" : "password") : rest.type ?? "text";

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-sm font-semibold text-ink-900/80">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/40">{icon}</span>
        <input
          id={inputId}
          {...rest}
          type={type}
          className="w-full rounded-xl border border-ink-900/15 bg-white px-10 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-900/35 focus:border-plum-500 focus:ring-2 focus:ring-plum-500/30"
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-900/45 transition hover:text-ink-900/70"
          >
            {show ? <EyeOff /> : <Eye />}
          </button>
        )}
      </span>
      {hint && <span className="mt-1 block text-[11px] text-ink-900/45">{hint}</span>}
    </label>
  );
}

export function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3 3.8M6.1 6.1A18.5 18.5 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4-.7" />
      <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2M2 2l20 20" />
    </svg>
  );
}
