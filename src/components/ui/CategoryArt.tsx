// Playful, colorful event illustrations on a deep-purple stage — inspired by
// the attached "Vizzha Vibe" artwork idea (bold figures, confetti, warm accent
// palette). Each category maps to a consistent, hand-built SVG so the set looks
// like one family. All are decorative (aria-hidden) and always paired with a
// visible text label by the caller, so they stay accessible.

import type { CSSProperties } from "react";

// Shared palette tuned to the attached reference: deep purple ground with
// marigold / peacock / kumkum accents that match VizhaVibe's theme.
const DEEP = "#2d1b57"; // stage background (deep purple)
const DEEP2 = "#1c1033"; // darker purple
const GOLD = "#ffd24c";
const SAFF = "#ff9e2c";
const TEAL = "#2dd4bf";
const PINK = "#ff5fa2";
const CREAM = "#fff4e8";
const PLUM = "#7c3aed";

type ArtProps = { className?: string; style?: CSSProperties };

// A rounded "stage" frame shared by every illustration for visual consistency.
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 120 96"
      className="h-full w-full"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="vvsky" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor={PLUM} stopOpacity="0.55" />
          <stop offset="100%" stopColor={DEEP2} stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="120" height="96" fill={DEEP} />
      <rect x="0" y="0" width="120" height="96" fill="url(#vvsky)" />
      {/* floor line */}
      <rect x="0" y="80" width="120" height="16" fill={DEEP2} opacity="0.7" />
      {children}
    </svg>
  );
}

// Simple confetti helper (deterministic positions).
function Confetti({ seed = 0 }: { seed?: number }) {
  const cols = [GOLD, TEAL, PINK, CREAM, SAFF];
  const dots = Array.from({ length: 10 }).map((_, i) => {
    const x = ((i * 23 + seed * 7) % 112) + 4;
    const y = ((i * 13 + seed * 5) % 40) + 6;
    const c = cols[(i + seed) % cols.length];
    const r = 1.4 + ((i + seed) % 3) * 0.5;
    return <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={0.9} />;
  });
  return <g>{dots}</g>;
}

function Weddings() {
  return (
    <Stage>
      <Confetti seed={1} />
      {/* mandap arch */}
      <path d="M26 80 V44 a34 34 0 0 1 68 0 V80" fill="none" stroke={GOLD} strokeWidth="3" />
      <path d="M26 52 h68" stroke={PINK} strokeWidth="2" opacity="0.8" />
      {/* garland dots */}
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} cx={28 + i * 8} cy={52 + (i % 2 ? 3 : 0)} r="1.8" fill={i % 2 ? TEAL : SAFF} />
      ))}
      {/* two figures */}
      <g>
        <circle cx="52" cy="60" r="5" fill={CREAM} />
        <path d="M52 65 v14 M52 70 l-7 5 M52 70 l7 5 M52 79 l-5 1 M52 79 l5 1" stroke={PINK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
      <g>
        <circle cx="68" cy="60" r="5" fill={GOLD} />
        <path d="M68 65 v14 M68 70 l-7 5 M68 70 l7 5 M68 79 l-5 1 M68 79 l5 1" stroke={TEAL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
      {/* diya */}
      <path d="M57 86 a3 2 0 0 0 6 0 z" fill={SAFF} />
    </Stage>
  );
}

function FamilyCelebrations() {
  return (
    <Stage>
      <Confetti seed={2} />
      {/* balloons */}
      <g stroke={CREAM} strokeWidth="0.8">
        <ellipse cx="34" cy="34" rx="9" ry="11" fill={PINK} />
        <ellipse cx="60" cy="26" rx="9" ry="11" fill={GOLD} />
        <ellipse cx="86" cy="34" rx="9" ry="11" fill={TEAL} />
      </g>
      <path d="M34 45 V58 M60 37 V56 M86 45 V58" stroke={CREAM} strokeWidth="0.8" opacity="0.6" />
      {/* cake */}
      <rect x="46" y="64" width="28" height="14" rx="2" fill={CREAM} />
      <rect x="50" y="58" width="20" height="8" rx="2" fill={SAFF} />
      <rect x="59" y="50" width="2" height="7" fill={PINK} />
      <path d="M60 46 c-2 -2 0 -4 0 -5 c0 1 2 3 0 5 Z" fill={GOLD} />
    </Stage>
  );
}

function CulturalReligious() {
  return (
    <Stage>
      <Confetti seed={3} />
      {/* kolam / mandala */}
      <g transform="translate(60 44)" stroke={GOLD} strokeWidth="1.6" fill="none">
        <circle r="18" strokeDasharray="2 4" />
        <circle r="11" stroke={TEAL} />
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse key={i} rx="3" ry="8" cy="-14" transform={`rotate(${i * 45})`} fill={PINK} fillOpacity="0.5" stroke="none" />
        ))}
      </g>
      {/* row of diyas */}
      {[40, 54, 68, 80].map((x, i) => (
        <g key={i} transform={`translate(${x} 82)`}>
          <path d="M-4 0 a4 2.5 0 0 0 8 0 z" fill={SAFF} />
          <path d="M0 -2 c-2 -3 0 -5 0 -7 c0 2 2 4 0 7 Z" fill={GOLD} />
        </g>
      ))}
    </Stage>
  );
}

function Corporate() {
  return (
    <Stage>
      <Confetti seed={4} />
      {/* stage screen */}
      <rect x="30" y="26" width="60" height="34" rx="3" fill={DEEP2} stroke={TEAL} strokeWidth="2" />
      {/* bar chart on screen */}
      <rect x="40" y="46" width="6" height="10" fill={GOLD} />
      <rect x="50" y="40" width="6" height="16" fill={SAFF} />
      <rect x="60" y="36" width="6" height="20" fill={TEAL} />
      <rect x="70" y="42" width="6" height="14" fill={PINK} />
      {/* podium + speaker */}
      <circle cx="60" cy="66" r="4" fill={CREAM} />
      <path d="M60 70 v8 M60 73 l-6 4 M60 73 l6 4" stroke={GOLD} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <rect x="54" y="80" width="12" height="8" rx="1" fill={PLUM} />
    </Stage>
  );
}

function Education() {
  return (
    <Stage>
      <Confetti seed={5} />
      {/* graduation cap */}
      <g transform="translate(60 40)">
        <path d="M-20 0 L0 -10 L20 0 L0 10 Z" fill={GOLD} />
        <path d="M0 10 V18 a12 6 0 0 0 0 0 Z" fill="none" />
        <path d="M-12 5 V16 a12 6 0 0 0 24 0 V5" fill={SAFF} opacity="0.9" />
        <path d="M18 1 V12" stroke={PINK} strokeWidth="1.6" />
        <circle cx="18" cy="13" r="2" fill={TEAL} />
      </g>
      {/* two grads */}
      <g>
        <circle cx="48" cy="66" r="4" fill={CREAM} />
        <path d="M48 70 v8 M48 73 l-6 3 M48 73 l6 3" stroke={TEAL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
      <g>
        <circle cx="72" cy="66" r="4" fill={CREAM} />
        <path d="M72 70 v8 M72 73 l-6 3 M72 73 l6 3" stroke={PINK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    </Stage>
  );
}

function SocialCommunity() {
  return (
    <Stage>
      <Confetti seed={6} />
      {/* joined hands / circle of people */}
      {[
        { x: 38, c: GOLD },
        { x: 52, c: TEAL },
        { x: 68, c: PINK },
        { x: 82, c: SAFF },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy="52" r="5" fill={p.c} />
          <path d={`M${p.x} 57 v12 M${p.x} 61 l-6 4 M${p.x} 61 l6 4 M${p.x} 69 l-5 2 M${p.x} 69 l5 2`} stroke={CREAM} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* heart above */}
      <path d="M60 34 c-4 -5 -11 -1 -8 4 c2 4 8 7 8 7 c0 0 6 -3 8 -7 c3 -5 -4 -9 -8 -4 Z" fill={PINK} transform="scale(0.7) translate(26 6)" />
    </Stage>
  );
}

function Entertainment() {
  return (
    <Stage>
      <Confetti seed={7} />
      {/* spotlight beams */}
      <path d="M20 10 L8 70 L34 70 Z" fill={GOLD} opacity="0.18" />
      <path d="M100 10 L112 70 L86 70 Z" fill={TEAL} opacity="0.18" />
      {/* equalizer bars */}
      {[42, 50, 58, 66, 74].map((x, i) => (
        <rect key={i} x={x} y={44 - (i % 3) * 6} width="5" height={30 + (i % 3) * 6} rx="2" fill={[PINK, GOLD, TEAL, SAFF, PINK][i]} />
      ))}
      {/* performer with mic */}
      <circle cx="60" cy="40" r="4" fill={CREAM} />
      <path d="M60 44 v8 M60 47 l6 -3 M60 47 l-6 3" stroke={GOLD} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="67" cy="40" r="1.6" fill={PINK} />
      {/* music notes */}
      <g fill={CREAM}>
        <circle cx="30" cy="30" r="2.4" />
        <rect x="31.6" y="22" width="1.2" height="8" />
        <circle cx="92" cy="26" r="2.4" />
        <rect x="93.6" y="18" width="1.2" height="8" />
      </g>
    </Stage>
  );
}

function FoodHospitality() {
  return (
    <Stage>
      <Confetti seed={8} />
      {/* big banana-leaf / plate */}
      <ellipse cx="60" cy="58" rx="34" ry="16" fill={TEAL} opacity="0.35" />
      <ellipse cx="60" cy="58" rx="30" ry="13" fill={CREAM} />
      {/* food mounds */}
      <circle cx="48" cy="56" r="4" fill={SAFF} />
      <circle cx="60" cy="54" r="5" fill={GOLD} />
      <circle cx="72" cy="56" r="4" fill={PINK} />
      <circle cx="54" cy="61" r="3" fill={PLUM} />
      <circle cx="67" cy="61" r="3" fill={TEAL} />
      {/* steam */}
      <path d="M56 44 q3 -4 0 -8 M64 44 q3 -4 0 -8" stroke={CREAM} strokeWidth="1.4" fill="none" opacity="0.6" strokeLinecap="round" />
      {/* cup */}
      <rect x="86" y="62" width="12" height="10" rx="2" fill={SAFF} />
      <path d="M98 64 h3 a3 3 0 0 1 0 6 h-3" fill="none" stroke={SAFF} strokeWidth="2" />
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

function Generic() {
  return (
    <Stage>
      <Confetti seed={9} />
      <circle cx="60" cy="54" r="10" fill={GOLD} />
      <path d="M60 64 v10 M60 68 l-7 5 M60 68 l7 5" stroke={CREAM} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </Stage>
  );
}

export function CategoryArt({ slug, className, style }: { slug: string; className?: string; style?: CSSProperties }) {
  const Art = ART[slug] ?? Generic;
  return (
    <div className={className} style={style} aria-hidden="true">
      <Art />
    </div>
  );
}
