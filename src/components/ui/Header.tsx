"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfigStatus } from "./ConfigStatus";
import { useAuth } from "@/lib/useAuth";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();

  // Auth-aware nav. The Admin entry is rendered as a distinct top-right button
  // (below), shown only to admins and enforced again server-side on every
  // /api/admin route — a normal user flipping this flag gets 403s.
  const links: { href: string; label: string }[] = [
    { href: "/", label: "Home" },
    { href: "/plan/new", label: "Start planning" },
  ];
  if (user) {
    links.push({ href: "/plans", label: "My Plans" }, { href: "/profile", label: "My Profile" });
  }

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 vv-glass">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded-lg border border-plum-600/50 bg-plum-600/20 px-3 py-1 font-semibold text-violet-200 shadow-[0_0_18px_-6px_rgba(139,92,246,0.7)] transition hover:bg-plum-600/35 hover:text-white"
            >
              <span aria-hidden>🛡️</span> Admin
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="rounded-lg border border-white/15 px-3 py-1 text-sm hover:bg-white/5">
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">
                Login
              </Link>
              <Link href="/signup" className="rounded-lg bg-saffron-500 px-3 py-1 font-semibold text-ink-900 hover:bg-saffron-400">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        <div className="hidden xl:block">
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
            {links.map((l) => (
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
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2.5 text-sm font-semibold text-violet-200 hover:bg-white/5"
                >
                  🛡️ Admin
                </Link>
              </li>
            )}
            <li>
              {user ? (
                <button onClick={handleLogout} className="block w-full rounded-lg px-2 py-2.5 text-left text-sm text-red-200 hover:bg-white/5">
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 text-sm text-white/85 hover:bg-white/5">
                    Login
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 text-sm text-saffron-400 hover:bg-white/5">
                    Sign Up
                  </Link>
                </>
              )}
            </li>
          </ul>
          <div className="px-2 py-2">
            <ConfigStatus />
          </div>
        </nav>
      )}
    </header>
  );
}
