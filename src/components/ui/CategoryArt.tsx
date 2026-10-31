// Premium category artwork: deep jewel-tone grounds, soft bokeh, and fine
// gold line-art with a gentle glow. One consistent family of hand-built SVGs,
// all decorative (aria-hidden) and always paired with a visible text label by
// the caller, so they stay accessible.

import type { CSSProperties, ReactNode } from "react";

const GOLD = "#f6d48a";
const CREAM = "#fff3dc";
const SAFF = "#ffa43a";
const ROSE = "#ff7aa8";
const TEAL = "#5eead4";

type ArtProps = { className?: string; style?: CSSProperties };

const line = {
  fill: "none",
  stroke: GOLD,
  strokeWidth: 1.1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const BOKEH: [number, number, number][] = [
  [14, 20, 7],
  [96, 14, 9],
  [106, 52, 6],
  [24, 62, 8],
  [84, 70, 6],
  [48, 10, 5],
  [70, 24, 4],
];

/** Shared frame: gradient ground, glow, bokeh, fine dot grid, floor fade, gold hairline. */
function Stage({ id, from, to, glow, children }: { id: string; from: string; to: string; glow: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 120 96" className="h-full w-full" role="presentation" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <radialGradient id={`gl-${id}`} cx="50%" cy="46%" r="52%">
          <stop offset="0" stopColor={glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fl-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
        <pattern id={`dt-${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.45" fill={GOLD} opacity="0.22" />
        </pattern>
        <filter id={`bk-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id={`g-${id}`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="120" height="96" fill={`url(#bg-${id})`} />
      <rect width="120" height="96" fill={`url(#dt-${id})`} />
      <rect width="120" height="96" fill={`url(#gl-${id})`} />
      <g filter={`url(#bk-${id})`}>
        {BOKEH.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? glow : GOLD} opacity={0.14} />
        ))}
      </g>
      <g filter={`url(#g-${id})`}>{children}</g>
      <rect y="70" width="120" height="26" fill={`url(#fl-${id})`} />
      <rect x="2.5" y="2.5" width="115" height="91" rx="5" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.35" />
    </svg>
  );
}

function Flame({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="-2" rx="3.2" ry="5.4" fill={SAFF} opacity="0.35" />
      <path d="M0 -8 q3.2 4.2 0 7.6 q-3.2 -3.4 0 -7.6z" fill="#ffe29a" />
    </g>
  );
}

function Diya({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 5} ${y} q5 6 10 0z`} fill={SAFF} opacity="0.9" />
      <Flame x={x} y={y - 1.5} />
    </g>
  );
}

function Weddings() {
  return (
    <Stage id="wed" from="#4a0d2e" to="#1d0a2e" glow="#ff9a62">
      <path d="M36 80 V44 a24 24 0 0 1 48 0 V80" {...line} strokeWidth={1.5} />
      <path d="M41 80 V45 a19 19 0 0 1 38 0 V80" {...line} opacity={0.55} />
      <path d="M37 50 q6 10 12 0 t12 0 t12 0 t12 0" {...line} stroke={SAFF} />
      {[37, 49, 61, 73, 85].map((x) => (
        <circle key={x} cx={x} cy="50" r="1.5" fill={SAFF} />
      ))}
      {[43, 55, 67, 79].map((x) => (
        <circle key={x} cx={x} cy="55" r="1.3" fill={ROSE} />
      ))}
      <path d="M60 78 q-6 -8 0 -16 q6 8 0 16 M60 78 q-10 -4 -12 -12 q9 0 12 12 M60 78 q10 -4 12 -12 q-9 0 -12 12" {...line} fill={GOLD} fillOpacity={0.16} />
      <Diya x={27} y={80} />
      <Diya x={93} y={80} />
    </Stage>
  );
}

function FamilyCelebrations() {
  const pts = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 1) / 10;
    const x = (1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * 60 + t * t * 112;
    const y = (1 - t) * (1 - t) * 18 + 2 * (1 - t) * t * 40 + t * t * 18;
    return { x, y, c: [ROSE, GOLD, TEAL][i % 3] };
  });
  return (
    <Stage id="fam" from="#2a1466" to="#4a0f4e" glow="#ff7ac0">
      <path d="M8 18 Q60 40 112 18" {...line} opacity={0.55} strokeWidth={0.8} />
      {pts.map((p, i) => (
        <path key={i} d={`M${p.x - 3.2} ${p.y} h6.4 l-3.2 7z`} fill={p.c} opacity={0.85} />
      ))}
      <path d="M40 80 h40 v-11 h-40z" {...line} fill={ROSE} fillOpacity={0.14} />
      <path d="M46 69 h28 v-10 h-28z" {...line} fill={GOLD} fillOpacity={0.12} />
      <path d="M52 59 h16 v-9 h-16z" {...line} fill={TEAL} fillOpacity={0.12} />
      <path d="M40 73 q4 3 8 0 t8 0 t8 0 t8 0 t8 0" {...line} opacity={0.6} strokeWidth={0.8} />
      <path d="M46 63 q4 3 7 0 t7 0 t7 0 t7 0" {...line} opacity={0.6} strokeWidth={0.8} />
      <path d="M60 50 v-7" {...line} />
      <Flame x={60} y={42} s={1.1} />
    </Stage>
  );
}

function CulturalReligious() {
  const widths = [50, 42, 35, 28, 21, 14];
  return (
    <Stage id="cul" from="#4b1a08" to="#2a0f3d" glow="#ffb347">
      <circle cx="60" cy="46" r="30" fill={SAFF} opacity="0.1" />
      <circle cx="60" cy="46" r="30" {...line} strokeWidth={0.6} strokeDasharray="1 2.4" opacity={0.8} />
      {widths.map((w, k) => {
        const yb = 80 - k * 9;
        return (
          <g key={k}>
            <path d={`M${60 - w / 2} ${yb} h${w} l-2 -8 h${-(w - 4)}z`} {...line} fill={GOLD} fillOpacity={0.1 + k * 0.02} />
            {k < 3 && <path d={`M${60 - 2.6} ${yb} v-4.5 a2.6 2.6 0 0 1 5.2 0 v4.5`} {...line} strokeWidth={0.7} opacity={0.7} />}
          </g>
        );
      })}
      <path d="M60 26 v-6 M57 22 h6" {...line} />
      <circle cx="60" cy="18.5" r="1.6" fill={GOLD} />
      <Diya x={20} y={82} />
      <Diya x={100} y={82} />
    </Stage>
  );
}

function Corporate() {
  const pts: [number, number][] = [
    [14, 72],
    [34, 62],
    [52, 67],
    [72, 46],
    [92, 38],
    [108, 22],
  ];
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
  return (
    <Stage id="corp" from="#08234a" to="#0b1633" glow="#38bdf8">
      {[30, 46, 62].map((y) => (
        <path key={y} d={`M10 ${y} H110`} stroke={GOLD} strokeWidth="0.4" opacity="0.18" />
      ))}
      {[22, 40, 58, 76, 94].map((x, i) => (
        <rect key={x} x={x} y={72 - (i + 1) * 8} width="9" height={(i + 1) * 8} rx="1" fill={TEAL} opacity={0.1 + i * 0.03} />
      ))}
      <path d={`${d} V80 H14 Z`} fill={TEAL} opacity="0.1" />
      <path d={d} {...line} stroke={TEAL} strokeWidth={1.4} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3 : 1.6} fill={i === pts.length - 1 ? GOLD : "#0b1633"} stroke={i === pts.length - 1 ? GOLD : TEAL} strokeWidth="1" />
      ))}
      <circle cx="108" cy="22" r="7" {...line} strokeWidth={0.5} opacity={0.7} />
    </Stage>
  );
}

function Education() {
  return (
    <Stage id="edu" from="#1b1b6b" to="#0f1a3d" glow="#8ea2ff">
      {Array.from({ length: 9 }, (_, i) => {
        const a = (-70 + i * 17.5) * (Math.PI / 180);
        return <path key={i} d={`M60 30 L${60 + Math.sin(a) * 46} ${30 - Math.cos(a) * 46 + 36}`} stroke={GOLD} strokeWidth="0.35" opacity="0.28" />;
      })}
      <path d="M60 22 L94 36 L60 50 L26 36 Z" {...line} fill={GOLD} fillOpacity={0.13} />
      <path d="M42 43 v11 q18 10 36 0 v-11" {...line} />
      <path d="M94 36 v17" {...line} />
      <circle cx="94" cy="55" r="1.8" fill={GOLD} />
      <path d="M32 82 q14 -8 28 0 q14 -8 28 0 v-13 q-14 -8 -28 0 q-14 -8 -28 0z M60 69 v13" {...line} fill={CREAM} fillOpacity={0.08} />
    </Stage>
  );
}

function SocialCommunity() {
  const n = 8;
  const nodes = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [60 + Math.cos(a) * 28, 46 + Math.sin(a) * 28] as [number, number];
  });
  return (
    <Stage id="soc" from="#35125e" to="#0f2d3a" glow="#5eead4">
      <circle cx="60" cy="46" r="28" {...line} strokeWidth={0.6} opacity={0.5} />
      {nodes.map(([x, y], i) => {
        const [x2, y2] = nodes[(i + 3) % n];
        return <path key={i} d={`M${x} ${y} L${x2} ${y2}`} stroke={GOLD} strokeWidth="0.45" opacity="0.4" />;
      })}
      {nodes.map(([x, y], i) => (
        <path key={`s${i}`} d={`M60 46 L${x} ${y}`} stroke={TEAL} strokeWidth="0.5" opacity="0.45" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={`n${i}`} cx={x} cy={y} r="3.6" fill="#16122e" stroke={i % 2 ? GOLD : TEAL} strokeWidth="1.1" />
      ))}
      <circle cx="60" cy="46" r="8" fill={ROSE} opacity="0.18" />
      <path d="M60 52 q-8 -5 -8 -9 a4 4 0 0 1 8 -1 a4 4 0 0 1 8 1 q0 4 -8 9z" fill={ROSE} />
    </Stage>
  );
}

function Entertainment() {
  return (
    <Stage id="ent" from="#3b0f6b" to="#1a0b36" glow="#ff5fb0">
      <path d="M0 0 Q24 34 8 96 H0Z" fill="#8b1a54" opacity="0.55" />
      <path d="M120 0 Q96 34 112 96 H120Z" fill="#8b1a54" opacity="0.55" />
      <path d="M38 0 L12 78 H52Z" fill="#fff" opacity="0.07" />
      <path d="M82 0 L68 78 H108Z" fill="#fff" opacity="0.07" />
      <ellipse cx="60" cy="80" rx="34" ry="5" fill={ROSE} opacity="0.2" />
      <circle cx="60" cy="34" r="6" {...line} fill={GOLD} fillOpacity={0.14} />
      <path d="M56.5 31.5 h7 M55.8 34 h8.4 M56.5 36.5 h7" {...line} strokeWidth={0.5} opacity={0.8} />
      <path d="M60 40 v34 M52 74 h16" {...line} />
      <path d="M52 44 q-4 8 0 14 M68 44 q4 8 0 14" {...line} strokeWidth={0.6} opacity={0.6} />
      <g {...line} stroke={TEAL} strokeWidth={1}>
        <ellipse cx="26" cy="54" rx="3" ry="2.3" fill={TEAL} />
        <path d="M29 54 v-12 q4 1 5 5" />
        <ellipse cx="92" cy="40" rx="3" ry="2.3" fill={TEAL} />
        <path d="M95 40 v-12 q4 1 5 5" />
      </g>
    </Stage>
  );
}

function FoodHospitality() {
  const bowls = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { x: 60 + Math.cos(a) * 18, y: 52 + Math.sin(a) * 18, c: [SAFF, GOLD, ROSE, TEAL, SAFF, GOLD][i] };
  });
  return (
    <Stage id="food" from="#0c3b3a" to="#2b1209" glow="#ffb347">
      <path d="M52 22 q3 -4 0 -8 q-3 -4 0 -8 M60 22 q3 -4 0 -8 q-3 -4 0 -8 M68 22 q3 -4 0 -8 q-3 -4 0 -8" {...line} strokeWidth={0.8} opacity={0.5} />
      <circle cx="60" cy="52" r="30" {...line} strokeWidth={1.4} fill={GOLD} fillOpacity={0.07} />
      <circle cx="60" cy="52" r="25.5" {...line} strokeWidth={0.5} opacity={0.6} />
      {bowls.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r="6" {...line} strokeWidth={0.9} />
          <circle cx={b.x} cy={b.y} r="3.8" fill={b.c} opacity="0.75" />
        </g>
      ))}
      <circle cx="60" cy="52" r="7.5" fill={CREAM} opacity="0.85" />
      {[
        [57, 50],
        [62, 49],
        [60, 54],
        [64, 53],
        [56, 55],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.7" fill="#c9b78f" />
      ))}
    </Stage>
  );
}

function Generic() {
  return (
    <Stage id="gen" from="#2d1b57" to="#1c1033" glow="#ffb347">
      <circle cx="60" cy="46" r="16" {...line} fill={GOLD} fillOpacity={0.12} />
      <path d="M60 36 l3 7 7 .6 -5.4 4.6 1.8 7 -6.4 -4 -6.4 4 1.8 -7 -5.4 -4.6 7 -.6z" fill={GOLD} opacity={0.9} />
    </Stage>
  );
}

// Map category slug -> illustration. Falls back to a generic festive stage.
const ART: Record<string, (p: ArtProps) => JSX.Element> = {
  weddings: Weddings,
  "family-celebrations": FamilyCelebrations,
  "cultural-religious": CulturalReligious,
  corporate: Corporate,
  education: Education,
  "social-community": SocialCommunity,
  entertainment: Entertainment,
  "food-hospitality": FoodHospitality,
};

export function CategoryArt({ slug, className, style }: { slug: string; className?: string; style?: CSSProperties }) {
  const Art = ART[slug] ?? Generic;
  return (
    <div className={className} style={style} aria-hidden="true">
      <Art />
    </div>
  );
}
