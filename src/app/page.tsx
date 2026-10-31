import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { CategoryArt } from "@/components/ui/CategoryArt";
import { HeroStage } from "@/components/ui/HeroStage";
import { CountUp, Magnetic, Reveal, Tilt } from "@/components/ui/motion";
import { CATALOG, totalEventTypeCount } from "@/data/catalog";

// Render on demand to avoid the memory-heavy static-generation step on
// low-memory machines.
export const dynamic = "force-dynamic";

/** Splits a line into words that rise in one after another (pure CSS, SSR-safe). */
function Words({ text, start = 0, className = "" }: { text: string; start?: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={`${w}-${i}`} className={`vv-word ${className}`} style={{ ["--i" as string]: start + i }}>
          {w}
          {"\u00A0"}
        </span>
      ))}
    </>
  );
}

export default function HomePage() {
  const typeCount = totalEventTypeCount();

  return (
    <>
      <Header />
      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="vv-aurora" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 md:pt-24">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="animate-fade-up">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  Madurai · Chennai · Bangalore
                </p>
                <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl" aria-label="Step inside your event, before it happens.">
                  <span aria-hidden="true">
                    <Words text="Step inside your event," />
                    <br />
                    <Words text="before it happens." start={4} className="text-saffron-500" />
                  </span>
                </h1>
                <p className="mt-5 max-w-xl text-lg text-white/75">
                  VizhaVibe is a 3D-first event planner. Arrange seating, stage, and decor in an interactive venue, then let
                  AI shape themes, menus, budgets, and timelines — tuned for Tamil, Kerala, Telugu, Kannada, and North Indian
                  styles.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Magnetic>
                    <Link
                      href="/plan/new"
                      className="vv-shine inline-block rounded-xl bg-saffron-500 px-6 py-3 font-semibold text-ink-900 shadow-glow transition hover:bg-saffron-400"
                    >
                      Start planning
                    </Link>
                  </Magnetic>
                  <Magnetic>
                    <Link
                      href="/plan/demo-tamil-wedding"
                      className="inline-block rounded-xl border border-white/15 px-6 py-3 font-semibold text-white/90 transition hover:bg-white/5"
                    >
                      Explore the sample project →
                    </Link>
                  </Magnetic>
                </div>
                <p className="mt-4 text-xs text-white/50">
                  Works with no account and no API keys. Sample venues and demo AI are clearly labeled.
                </p>
              </div>

              {/* Animated celebrations (dance, music, wedding, proposal, birthday) fill the right side and play by themselves. */}
              <div className="relative animate-fade-up">
                <HeroStage />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 text-center md:grid-cols-4">
            <Stat value="3" label="Cities covered" />
            <Stat value={`${CATALOG.length}`} label="Event categories" />
            <Stat value={`${typeCount}+`} label="Event types" />
            <Stat value="5" label="Cultural styles" />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="font-display text-3xl font-semibold">How planning flows</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1 · Set up", "Pick a category, event type, city, date, guests, budget, and style preferences."],
              ["2 · Discover", "Search real venues via Google Places, or explore clearly-labeled sample venues."],
              ["3 · Design in 3D", "Open the venue explorer. Place tables, stage, decor. Seats auto-count against capacity."],
              ["4 · Get AI help", "Generate themes, menus, budget ranges, and a timeline — all editable and labeled."],
              ["5 · Review", "See a plan summary with location, date, guests, costs, and outstanding tasks."],
              ["6 · Save & share", "Every plan has a shareable link. Revisit and refine anytime."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 90}>
                <div className="vv-glass h-full rounded-2xl p-5 transition hover:border-saffron-500/40">
                  <h3 className="font-semibold text-saffron-400">{t}</h3>
                  <p className="mt-2 text-sm text-white/70">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Categories — choose an event category, each with its own
            colorful illustration on a deep-purple stage. */}
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <h2 className="font-display text-3xl font-semibold">Choose your event category</h2>
          <p className="mt-2 max-w-2xl text-white/60">
            Pick the celebration you&apos;re planning. Each opens the guided setup for that event type.
          </p>
          <ul className="mt-8 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {CATALOG.map((c, i) => (
              <li key={c.slug} className="h-full">
                <Reveal delay={(i % 4) * 80} className="h-full">
                <Tilt className="h-full">
                <Link
                  href={`/plan/new?category=${c.slug}`}
                  aria-label={`Plan a ${c.name} event — ${c.eventTypes.length} event types`}
                  className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60 transition hover:border-saffron-500/50 hover:shadow-glow focus-visible:border-saffron-500/60"
                >
                  {/* Illustration tile (deep purple, colorful artwork) */}
                  <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#1c1033]">
                    <CategoryArt slug={c.slug} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.04]" />
                    <span
                      className="absolute left-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-base leading-none backdrop-blur-sm"
                      aria-hidden="true"
                    >
                      {c.icon}
                    </span>
                  </div>
                  {/* Text label + meta (keeps the card accessible & on-brand) */}
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-saffron-400">{c.name}</h3>
                    <p className="mt-1 text-sm text-white/60">{c.description}</p>
                    <p className="mt-3 text-xs text-saffron-400/80">{c.eventTypes.length} event types →</p>
                  </div>
                </Link>
                </Tilt>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-sm text-white/50">
          <p>
            VizhaVibe · Venue details attributed to their source. AI output is advisory, not confirmed facts.
          </p>
        </footer>
      </main>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <CountUp value={value} className="font-display text-3xl font-semibold text-saffron-500" />
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}
