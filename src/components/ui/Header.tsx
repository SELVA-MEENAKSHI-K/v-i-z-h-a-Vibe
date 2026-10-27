"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfigStatus } from "./ConfigStatus";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/plan/new", label: "Start planning" },
  { href: "/plans", label: "My Plans" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 vv-glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="text-2xl" aria-hidden>
            🪔
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Vizha<span className="text-saffron-500">Vibe</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <ConfigStatus />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 hover:bg-white/5 md:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile nav panel */}
      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-white/10 px-4 py-2 md:hidden">
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2.5 text-sm text-white/85 hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="px-2 py-2">
            <ConfigStatus />
          </div>
        </nav>
      )}
    </header>
  );
}
