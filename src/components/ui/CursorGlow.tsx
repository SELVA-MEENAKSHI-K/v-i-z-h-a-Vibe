"use client";

import { useEffect, useRef } from "react";

/** Soft yellow glow that follows the mouse on every page (mouse devices only). */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Skip on touch devices, when the OS prefers reduced motion, or when the
    // user paused animations via the "Pause animations" toggle (data-vv-motion).
    const paused = document.documentElement.getAttribute("data-vv-motion") === "off";
    if (!el || paused || !window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let cx = x;
    let cy = y;
    const tick = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      el.style.transform = `translate3d(${cx - 260}px, ${cy - 260}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.style.opacity = "1";
    };
    const leave = () => {
      el.style.opacity = "0";
    };
    // Pause the animation loop while the tab is hidden so we do zero work in
    // the background (saves CPU/battery); resume when it becomes visible again.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="vv-cursor-glow" aria-hidden="true" />;
}
