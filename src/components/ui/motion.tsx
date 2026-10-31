"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Small motion helpers for the home page. All of them:
 *  - render fully visible on the server and with JavaScript off,
 *  - only animate pointer-capable, motion-OK devices,
 *  - are cheap (one listener, transform/opacity only).
 */

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fades and lifts its children in when they scroll into view. */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "shown">("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    // Already on screen at load: leave it alone (no flash).
    if (r.top < window.innerHeight * 0.92) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${state === "hidden" ? "vv-reveal-hidden" : state === "shown" ? "vv-reveal-shown" : ""} ${className}`} style={{ "--vv-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

/** 3D tilt with a moving glare, driven by the pointer. */
export function Tilt({ children, max = 9, className = "" }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      el.dataset.active = "1";
    });
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    delete el.dataset.active;
  };

  return (
    <div ref={ref} className={`vv-tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="vv-tilt-inner">
        {children}
        <span className="vv-tilt-glare" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Pulls its child a few pixels toward the cursor when it gets close. */
export function Magnetic({ children, strength = 0.28, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) * 0.9;
      if (Math.hypot(dx, dy) < reach) {
        el.style.transform = `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)`;
      } else {
        el.style.transform = "";
      }
    };
    const leave = () => {
      el.style.transform = "";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={`vv-magnetic ${className}`}>
      {children}
    </span>
  );
}

/** Soft light that follows the pointer across its parent section. */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = parent.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
        el.style.opacity = "1";
      });
    };
    const leave = () => {
      el.style.opacity = "0";
    };
    parent.addEventListener("pointermove", move, { passive: true });
    parent.addEventListener("pointerleave", leave);
    return () => {
      parent.removeEventListener("pointermove", move);
      parent.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="vv-spotlight" aria-hidden="true" />;
}

/** Counts up to a number (keeps any suffix such as "+") when scrolled into view. */
export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const m = /^(\d+)(.*)$/.exec(value);
  const target = m ? parseInt(m[1], 10) : 0;
  const suffix = m ? m[2] : "";
  const [shown, setShown] = useState(target);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !m || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1100;
        const tick = (now: number) => {
          const u = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - u, 3);
          setShown(Math.round(target * eased));
          if (u < 1) raf = requestAnimationFrame(tick);
        };
        setShown(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <div ref={ref} className={className}>
      {m ? `${shown}${suffix}` : value}
    </div>
  );
}
