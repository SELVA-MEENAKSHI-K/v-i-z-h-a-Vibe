// VendorCategoryArt — hand-built, category-specific SVG illustrations for the
// eight vendor categories. Used as a tasteful preview ONLY when a vendor has no
// verified, source-backed photo. It is purely decorative (aria-hidden) and is
// always labelled "Illustration" by the caller — never presented as a real
// vendor photo. Colours come from VizhaVibe's palette (saffron/kumkum/peacock/
// plum/marigold) so previews feel on-brand instead of generic.

import type { CSSProperties } from "react";

const SAFF = "#f59e0b";
const MARIGOLD = "#fbbf24";
const ROSE = "#ec4899";
const TEAL = "#2dd4bf";
const VIOLET = "#a78bfa";
const CREAM = "#fde8c8";
const INK = "#1c1033";

// Each category gets a distinct scene + accent gradient so no two unrelated
// categories share the same illustration.
const ACCENT: Record<string, [string, string]> = {
  photography: ["#312e81", "#6d28d9"],
  catering: ["#7c2d12", "#b45309"],
  decoration: ["#831843", "#be185d"],
  makeup: ["#4a044e", "#a21caf"],
  music: ["#0c4a6e", "#0e7490"],
  invitations: ["#422006", "#a16207"],
  transportation: ["#064e3b", "#047857"],
  equipment: ["#1e1b4b", "#4338ca"],
};

function Scene({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [from, to] = ACCENT[slug] ?? [INK, "#2a1a4a"];
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden>
      <defs>
        <linearGradient id={`vg-${slug}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <radialGradient id={`vglow-${slug}`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="160" height="120" fill={`url(#vg-${slug})`} />
      <rect width="160" height="120" fill={`url(#vglow-${slug})`} />
      {children}
    </svg>
  );
}

const ART: Record<string, () => React.ReactNode> = {
  // Camera + shutter — photography & videography.
  photography: () => (
    <>
      <rect x="44" y="46" width="72" height="46" rx="8" fill={INK} opacity="0.55" />
      <rect x="62" y="38" width="22" height="10" rx="3" fill={INK} opacity="0.55" />
      <circle cx="80" cy="69" r="16" fill="none" stroke={CREAM} strokeWidth="3" />
      <circle cx="80" cy="69" r="9" fill={VIOLET} opacity="0.85" />
      <circle cx="104" cy="54" r="3" fill={MARIGOLD} />
    </>
  ),
  // Cloche + steam — catering.
  catering: () => (
    <>
      <path d="M44 82 h72 a4 4 0 0 1 0 8 H44 a4 4 0 0 1 0-8 Z" fill={CREAM} opacity="0.9" />
      <path d="M50 82 a30 22 0 0 1 60 0 Z" fill={SAFF} />
      <circle cx="80" cy="54" r="3.5" fill={CREAM} />
      <path d="M70 44 q-4-8 2-14" stroke={CREAM} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M90 44 q4-8-2-14" stroke={CREAM} strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
    </>
  ),
  // Floral arch / mandap — decoration.
  decoration: () => (
    <>
      <path d="M40 92 V66 a40 40 0 0 1 80 0 V92" fill="none" stroke={CREAM} strokeWidth="4" opacity="0.85" />
      <circle cx="40" cy="60" r="7" fill={ROSE} />
      <circle cx="120" cy="60" r="7" fill={ROSE} />
      <circle cx="62" cy="40" r="6" fill={MARIGOLD} />
      <circle cx="98" cy="40" r="6" fill={MARIGOLD} />
      <circle cx="80" cy="33" r="7" fill={ROSE} />
      <circle cx="80" cy="33" r="3" fill={MARIGOLD} />
    </>
  ),
  // Lipstick + compact — makeup & styling.
  makeup: () => (
    <>
      <rect x="66" y="40" width="12" height="34" rx="3" fill={ROSE} />
      <rect x="66" y="74" width="12" height="12" rx="2" fill={CREAM} opacity="0.85" />
      <circle cx="98" cy="68" r="15" fill={CREAM} opacity="0.85" />
      <circle cx="98" cy="68" r="15" fill="none" stroke={VIOLET} strokeWidth="2.5" />
      <path d="M92 68 h12 M98 62 v12" stroke={VIOLET} strokeWidth="2" opacity="0.5" />
    </>
  ),
  // Musical notes + waves — music & entertainment.
  music: () => (
    <>
      <circle cx="62" cy="80" r="8" fill={TEAL} />
      <rect x="69" y="44" width="3.5" height="36" fill={CREAM} />
      <circle cx="98" cy="74" r="8" fill={MARIGOLD} />
      <rect x="105" y="40" width="3.5" height="34" fill={CREAM} />
      <path d="M72.5 44 H108.5" stroke={CREAM} strokeWidth="3.5" />
      <path d="M34 66 q8-10 16 0 t16 0" stroke={TEAL} strokeWidth="2" fill="none" opacity="0.5" />
    </>
  ),
  // Envelope + heart seal — invitations.
  invitations: () => (
    <>
      <rect x="46" y="46" width="68" height="46" rx="5" fill={CREAM} opacity="0.92" />
      <path d="M46 50 L80 72 L114 50" fill="none" stroke={SAFF} strokeWidth="3" />
      <path d="M80 70 l-6-6 a4 4 0 1 1 6-5 a4 4 0 1 1 6 5 Z" fill={ROSE} />
    </>
  ),
  // Car with decor ribbon — transportation.
  transportation: () => (
    <>
      <path d="M40 76 h80 l-8-16 a8 8 0 0 0-7-4 H55 a8 8 0 0 0-7 4 Z" fill={CREAM} opacity="0.9" />
      <rect x="40" y="76" width="80" height="10" rx="4" fill={TEAL} />
      <circle cx="56" cy="88" r="7" fill={INK} stroke={CREAM} strokeWidth="2.5" />
      <circle cx="104" cy="88" r="7" fill={INK} stroke={CREAM} strokeWidth="2.5" />
      <path d="M80 60 l-5-8 h10 Z" fill={ROSE} />
    </>
  ),
  // Tent / canopy — event equipment.
  equipment: () => (
    <>
      <path d="M80 36 L120 86 H40 Z" fill={CREAM} opacity="0.9" />
      <path d="M80 36 L96 86 H64 Z" fill={VIOLET} opacity="0.8" />
      <path d="M40 86 q10-10 20 0 q10-10 20 0 q10-10 20 0 q10-10 20 0" fill="none" stroke={MARIGOLD} strokeWidth="3" />
      <rect x="78" y="30" width="4" height="10" fill={CREAM} />
    </>
  ),
};

export function VendorCategoryArt({ slug, className = "", style }: { slug: string; className?: string; style?: CSSProperties }) {
  const key = ART[slug] ? slug : "equipment";
  const draw = ART[key];
  return (
    <div className={`h-full w-full ${className}`} style={style} aria-hidden>
      <Scene slug={key}>{draw()}</Scene>
    </div>
  );
}
