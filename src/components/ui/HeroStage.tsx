"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HERO_SCENES } from "./heroScenes";
import { heroAudio } from "@/lib/heroAudio";

// The 3D scene is heavy: load it only in the browser, only when needed.
const Hero3D = dynamic(() => import("../three/Hero3D"), { ssr: false });

/** Falls back to the 2D illustration if WebGL throws while rendering. */
class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Mode = "3d" | "2d";

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Home-page hero stage: an arched window that cycles through five celebrations
 * (dance, music, wedding, proposal, birthday).
 *
 * - 3D mode: a real-time 3D scene whose camera flies between floating
 *   dioramas, with pointer parallax and optional sound.
 * - Lite mode: the 2D illustrated version (used automatically on devices
 *   without WebGL, with reduced motion, or when the user picks it).
 * - Auto-advances every ~8s; pausing, hovering the chips or the Pause button
 *   holds the current scene.
 */
export function HeroStage() {
  const [scene, setScene] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [mode, setMode] = useState<Mode>("2d");
  const [canUse3d, setCanUse3d] = useState(false);
  const [ready3d, setReady3d] = useState(false);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [inView, setInView] = useState(true);
  const [sound, setSound] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const markup = useMemo(() => HERO_SCENES.map((s) => s.build()), []);

  /* ---- decide 2D vs 3D once, in the browser ---- */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener("change", apply);

    const ok = webglAvailable();
    setCanUse3d(ok);
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem("vv-hero-mode");
    } catch {
      /* storage unavailable */
    }
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const weak = (nav.deviceMemory !== undefined && nav.deviceMemory < 4) || (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) || !!nav.connection?.saveData;
    setQuality(window.innerWidth < 700 || weak ? "low" : "high");
    if (ok && !mq.matches) setMode(stored === "2d" ? "2d" : stored === "3d" ? "3d" : weak ? "2d" : "3d");
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Stop rendering (and auto-advancing) when the hero is off screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const use3d = mode === "3d" && canUse3d && !reduce;
  const show2d = !use3d || !ready3d;

  // Auto-play: next celebration every 8 seconds.
  useEffect(() => {
    if (reduce || !inView) return;
    const id = window.setTimeout(() => setScene((s) => (s + 1) % HERO_SCENES.length), 8000);
    return () => window.clearTimeout(id);
  }, [scene, reduce, inView]);

  /* ---- optional sound follows the scene ---- */
  useEffect(() => {
    if (sound) heroAudio.setScene(scene);
  }, [scene, sound]);
  useEffect(() => () => heroAudio.stop(), []);

  const toggleSound = async () => {
    if (sound) {
      heroAudio.stop();
      setSound(false);
    } else {
      await heroAudio.start(scene);
      setSound(true);
    }
  };

  const cur = HERO_SCENES[scene];

  return (
    <div
      ref={stageRef}
      className={`vv-stage vv-banner ${!inView ? "vv-frozen" : ""}`}
      data-scene={scene}
      data-mode={use3d && ready3d ? "3d" : "2d"}
    >
      {show2d && (
        <svg viewBox="0 0 360 460" role="img" aria-label={`Animated illustration: ${cur.eng}`} preserveAspectRatio="xMidYMid meet">
          {markup.map((m, i) => (
            <g
              key={i}
              className={`scene${i === scene ? " on" : ""}`}
              aria-hidden={i === scene ? undefined : true}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: m }}
            />
          ))}
        </svg>
      )}

      {use3d && (
        <div className={`vv-canvas ${ready3d ? "on" : ""}`} role="img" aria-label={`Animated 3D scene: ${cur.eng}`}>
          <Boundary onError={() => setMode("2d")}>
            <Hero3D scene={scene} paused={!inView} quality={quality} onReady={() => setReady3d(true)} />
          </Boundary>
        </div>
      )}

      {/* caption */}
      <div className="vv-banner-caption">
        <div key={scene} className="vv-swap">
          <p className="font-display text-3xl font-semibold leading-tight md:text-5xl" lang="ta">
            {cur.tamil}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">{cur.eng}</p>
        </div>
        <Link href={`/plan/new?category=${cur.category}`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-saffron-400 hover:text-saffron-300">
          Plan a {cur.eng.toLowerCase()} →
        </Link>
      </div>

      {/* progress dots (not interactive: the scene plays on its own) */}
      <div className="vv-banner-dots" aria-hidden="true">
        {HERO_SCENES.map((s, i) => (
          <span key={s.short} className={i === scene ? "on" : ""} />
        ))}
      </div>

      <button type="button" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Turn sound off" : "Turn sound on"} className="vv-banner-sound">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          {sound ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m22 9-6 6m0-6 6 6" />}
        </svg>
      </button>
    </div>
  );
}
