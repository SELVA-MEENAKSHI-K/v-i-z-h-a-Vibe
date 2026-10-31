"use client";

// Premium two-column authentication shell matching the VizhaVibe reference:
// a rounded, glowing container with a left "welcome" panel (logo, gradient
// heading, glassmorphism feature cards, a real cultural-event hero photo with
// gopuram silhouettes + "Events Make Memories" script) and a right light card
// that hosts the form (passed as children). Fully responsive: on small screens
// the left panel collapses and the card stacks full-width.

import type { ReactNode } from "react";
import { SmartImage } from "@/components/ui/SmartImage";

/** The V star-burst logo mark (purple→pink gradient), matching the reference. */
export function VizhaMark({ size = 40, idSuffix = "" }: { size?: number; idSuffix?: string }) {
  const gid = `vv-mark-grad${idSuffix}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="55%" stopColor="#d6409f" />
          <stop offset="100%" stopColor="#ff9e2c" />
        </linearGradient>
      </defs>
      {/* V shape */}
      <path d="M11 13 L24 39 L37 13 L31 13 L24 28 L17 13 Z" fill={`url(#${gid})`} />
      {/* sparkle */}
      <path d="M33 8 l1.6 4.2 L39 14 l-4.4 1.8 L33 20 l-1.6-4.2 L27 14 l4.4-1.8 Z" fill="#ffd24c" />
      <circle cx="20" cy="9" r="1.6" fill="#d6409f" />
    </svg>
  );
}

/** "VIZHAVIBE" wordmark — white "VIZHA" + gradient "VIBE". */
export function VizhaWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-wide ${className}`}>
      <span className="text-white">VIZHA</span>
      <span className="bg-gradient-to-r from-plum-500 via-kumkum-500 to-saffron-500 bg-clip-text text-transparent">VIBE</span>
    </span>
  );
}

const FEATURES: { label: string; icon: ReactNode; from: string; to: string }[] = [
  {
    label: "Explore\nEvents",
    from: "#7c3aed",
    to: "#9333ea",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Connect\nPeople",
    from: "#db2777",
    to: "#be185d",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Book &\nParticipate",
    from: "#d97706",
    to: "#b45309",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v4a2 2 0 0 1 0 2v4h18v-4a2 2 0 0 1 0-2V7Z" />
        <path d="M13 5v2M13 11v2M13 17v2" />
      </svg>
    ),
  },
  {
    label: "Stay\nUpdated",
    from: "#0d9488",
    to: "#0f766e",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.9 6 6.6.5-5 4.3 1.6 6.4L12 16.9 5.9 19.2 7.5 12.8l-5-4.3L9.1 8 12 2z" />
      </svg>
    ),
  },
];

export function AuthShell({
  heading,
  headingAccent,
  subtitle,
  children,
}: {
  heading: string; // e.g. "Welcome"
  headingAccent: string; // e.g. "Back!" (gets the gradient)
  subtitle: string;
  children: ReactNode; // the right-side card contents (form)
}) {
  return (
    <div className="vv-auth-page relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* ambient page glow */}
      <div className="vv-auth-glow" aria-hidden="true" />

      <div className="vv-auth-shell relative grid w-full max-w-6xl overflow-hidden rounded-[28px] lg:grid-cols-[52%_48%]">
        {/* ============ LEFT: welcome ============ */}
        <section className="relative hidden flex-col justify-between overflow-hidden p-8 lg:flex">
          {/* cultural hero photo + sunset overlays fill the lower half */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2" aria-hidden="true">
            <SmartImage src="/images/themes/south-indian-grand-wedding.jpg" alt="" category="event" sizes="52vw" />
            {/* sunset + purple wash to match the reference tone */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1033]/95 via-kumkum-600/35 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1033] via-transparent to-transparent" />
            {/* gopuram silhouettes */}
            <Gopurams />
          </div>

          {/* decorative leaves + floating particles */}
          <Leaves />

          {/* top: logo */}
          <div className="relative flex items-center gap-3">
            <VizhaMark size={40} idSuffix="-left" />
            <VizhaWordmark className="text-2xl" />
          </div>

          {/* middle: heading + subtitle + feature cards */}
          <div className="relative mt-6">
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-white xl:text-6xl">
              {heading}{" "}
              <span className="bg-gradient-to-r from-kumkum-500 via-plum-500 to-saffron-500 bg-clip-text text-transparent">{headingAccent}</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">{subtitle}</p>

            <div className="mt-7 grid max-w-md grid-cols-4 gap-3">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-2 text-center">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ring-1 ring-white/20 transition hover:-translate-y-0.5"
                    style={{ background: `linear-gradient(140deg, ${f.from}, ${f.to})` }}
                  >
                    {f.icon}
                  </span>
                  <span className="whitespace-pre-line text-[11px] font-medium leading-tight text-white/85">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* handwritten script over the scene */}
          <div className="relative mt-6 self-end pr-2 text-right">
            <span className="vv-script block text-2xl leading-tight text-white/95 drop-shadow">Events</span>
            <span className="vv-script block text-2xl leading-tight text-white/95 drop-shadow">Make Memories</span>
            <span className="mt-1 inline-block text-kumkum-500">♥</span>
          </div>
        </section>

        {/* ============ RIGHT: card ============ */}
        <section className="vv-auth-card relative flex flex-col justify-center overflow-hidden p-7 sm:p-10">
          {/* faint gopuram line-art watermark on the right edge */}
          <GopuramWatermark />

          {/* mobile logo (left panel is hidden on small screens) */}
          <div className="relative mb-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5">
              <VizhaMark size={38} idSuffix="-right" />
              <span className="font-display text-2xl font-extrabold tracking-wide">
                <span className="text-ink-900">VIZHA</span>
                <span className="bg-gradient-to-r from-plum-500 via-kumkum-500 to-saffron-500 bg-clip-text text-transparent">VIBE</span>
              </span>
            </div>
            <p className="mt-1.5 text-[10px] font-semibold tracking-[0.25em] text-ink-900/55">DISCOVER • PARTICIPATE • CELEBRATE</p>
          </div>

          <div className="relative">{children}</div>
        </section>
      </div>

      <AuthShellStyles />
    </div>
  );
}

function Gopurams() {
  return (
    <svg className="absolute bottom-0 left-4 h-2/3 w-40 opacity-80" viewBox="0 0 120 160" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      {/* two tapering temple towers as dark silhouettes */}
      {[0, 46].map((x, i) => (
        <g key={i} fill="#140a24" transform={`translate(${x},0)`}>
          <polygon points="8,160 12,40 30,10 48,40 52,160" />
          {[52, 72, 92, 112, 132].map((y, j) => (
            <rect key={j} x={10 - j} y={y} width={40 + j * 2} height="4" fill="#0d0618" />
          ))}
        </g>
      ))}
    </svg>
  );
}

function GopuramWatermark() {
  return (
    <svg className="pointer-events-none absolute -right-6 top-6 h-56 w-32 opacity-[0.06]" viewBox="0 0 80 200" fill="none" stroke="#5b2a86" strokeWidth="1.5" aria-hidden="true">
      <polygon points="12,200 18,40 40,8 62,40 68,200" />
      {[48, 72, 96, 120, 144, 168].map((y, i) => (
        <line key={i} x1={14 + i} y1={y} x2={66 - i} y2={y} />
      ))}
    </svg>
  );
}

function Leaves() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* corner foliage */}
      <svg className="absolute -left-6 -top-6 h-40 w-40 opacity-40" viewBox="0 0 100 100" fill="#3a1d52">
        <path d="M0 0 C40 10 60 40 55 70 C40 55 20 45 5 50 C20 35 15 15 0 0 Z" />
      </svg>
      {/* floating leaf particles */}
      {[
        { top: "18%", left: "90%", d: "6s" },
        { top: "44%", left: "6%", d: "8s" },
        { top: "60%", left: "40%", d: "7s" },
        { top: "30%", left: "60%", d: "9s" },
      ].map((p, i) => (
        <span key={i} className="vv-leaf absolute text-kumkum-500/70" style={{ top: p.top, left: p.left, ["--d" as string]: p.d }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C7 7 4 12 12 22 20 12 17 7 12 2Z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

function AuthShellStyles() {
  return (
    <style jsx global>{`
      .vv-auth-page {
        background:
          radial-gradient(1200px 700px at 85% -10%, rgba(214, 64, 159, 0.28), transparent 60%),
          radial-gradient(900px 600px at 10% 110%, rgba(124, 58, 237, 0.3), transparent 60%),
          linear-gradient(135deg, #1a1033 0%, #241243 45%, #2a1348 100%);
      }
      .vv-auth-glow {
        position: absolute;
        inset: -2px;
        background: radial-gradient(600px 400px at 90% 0%, rgba(255, 120, 190, 0.25), transparent 70%);
        pointer-events: none;
      }
      .vv-auth-shell {
        border: 1px solid rgba(190, 120, 255, 0.45);
        box-shadow: 0 0 0 1px rgba(190, 120, 255, 0.15), 0 40px 120px -30px rgba(0, 0, 0, 0.75), 0 0 60px -10px rgba(190, 120, 255, 0.35);
        background: linear-gradient(135deg, rgba(30, 18, 54, 0.9), rgba(40, 20, 70, 0.82));
        backdrop-filter: blur(8px);
      }
      .vv-auth-card {
        background: linear-gradient(160deg, #ffffff 0%, #f4f0fb 100%);
        color: #1b1030;
      }
      .vv-script {
        font-family: "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive;
        transform: rotate(-6deg);
      }
      .vv-leaf {
        animation: vv-leaf-float var(--d, 7s) ease-in-out infinite alternate;
      }
      @keyframes vv-leaf-float {
        from {
          transform: translateY(0) rotate(0deg);
          opacity: 0.5;
        }
        to {
          transform: translateY(-14px) rotate(20deg);
          opacity: 0.85;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .vv-leaf {
          animation: none;
        }
      }
    `}</style>
  );
}
