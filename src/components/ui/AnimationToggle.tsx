"use client";

import { useCallback, useEffect, useState } from "react";

// Visible "Pause animations" control (WCAG 2.2 — give users a way to stop
// non-essential motion beyond the OS setting). It toggles data-vv-motion on
// <html>, which CSS keys off to freeze the festival backdrop, hero auto-play,
// word/aurora/shine effects and the cursor glow. The choice is remembered in
// localStorage. Pairs with an inline <head> script (see MotionPreferenceScript)
// that applies the stored value before first paint to avoid a flash.

const STORAGE_KEY = "vv-motion";

/** Read the persisted preference. "off" = paused; anything else = playing. */
function readPaused(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "off";
}

function applyPaused(paused: boolean) {
  const root = document.documentElement;
  if (paused) root.setAttribute("data-vv-motion", "off");
  else root.removeAttribute("data-vv-motion");
}

export function AnimationToggle({ className = "" }: { className?: string }) {
  // Start from the DOM attribute the inline script already set, so SSR/CSR agree.
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPaused(readPaused());
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      applyPaused(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "off" : "on");
      } catch {
        // localStorage may be unavailable (private mode) — the attribute still applies.
      }
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      // aria-pressed reflects "animations paused" state for screen readers.
      aria-pressed={ready ? paused : undefined}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/85 transition hover:bg-white/5 focus-visible:outline-none ${className}`}
      title={paused ? "Resume background animations" : "Pause background animations"}
    >
      <span aria-hidden="true">{paused ? "▶" : "⏸"}</span>
      {paused ? "Resume animations" : "Pause animations"}
    </button>
  );
}

/**
 * Inline script that applies the saved motion preference to <html> BEFORE the
 * first paint, preventing a flash of animation when the user chose "paused".
 * Rendered once in the root layout <head>.
 */
export function MotionPreferenceScript() {
  const js = `(function(){try{if(localStorage.getItem('${STORAGE_KEY}')==='off'){document.documentElement.setAttribute('data-vv-motion','off');}}catch(e){}})();`;
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
