import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { CATALOG, totalEventTypeCount } from "@/data/catalog";

export default function HomePage() {
  const typeCount = totalEventTypeCount();

  return (
    <>
      <Header />
      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 md:pt-24">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="animate-fade-up">
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  Madurai · Chennai · Bangalore
                </p>
                <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">
                  Step inside your event,
                  <br />
                  <span className="text-saffron-500">before it happens.</span>
                </h1>
                <p className="mt-5 max-w-xl text-lg text-white/75">
                  VizhaVibe is a 3D-first event planner. Arrange seating, stage, and decor in an interactive venue, then let
                  AI shape themes, menus, budgets, and timelines — tuned for Tamil, Kerala, Telugu, Kannada, and North Indian
                  styles.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/plan/new"
                    className="rounded-xl bg-saffron-500 px-6 py-3 font-semibold text-ink-900 shadow-glow transition hover:bg-saffron-400"
                  >
                    Start planning
                  </Link>
                  <Link
                    href="/plan/demo-tamil-wedding"
                    className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white/90 transition hover:bg-white/5"
                  >
                    Explore the sample project →
                  </Link>
                </div>
                <p className="mt-4 text-xs text-white/50">
                  Works with no account and no API keys. Sample venues and demo AI are clearly labeled.
                </p>
              </div>

              {/* Decorative 3D-ish preview card (pure CSS, lightweight). */}
              <div className="relative animate-fade-up">
                <div className="vv-glass rounded-3xl p-5 shadow-panel">
                  <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-plum-600/40 via-ink-800 to-saffron-600/30 p-4">
                    <div className="grid h-full grid-cols-6 grid-rows-5 gap-1.5">
                      <div className="col-span-6 row-span-1 rounded-lg bg-kumkum-500/50" title="Stage" />
                      <div className="col-span-6 row-span-1 rounded-lg bg-peacock-500/30" title="Dance floor" />
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="rounded-full bg-marigold-500/70" title="Table" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-white/70">Live seating preview</span>
                    <span className="rounded-full bg-peacock-500/20 px-3 py-1 text-xs text-peacock-400">250 guests · 32 tables</span>
                  </div>
                </div>
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
            ].map(([t, d]) => (
              <div key={t} className="vv-glass rounded-2xl p-5">
                <h3 className="font-semibold text-saffron-400">{t}</h3>
                <p className="mt-2 text-sm text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <h2 className="font-display text-3xl font-semibold">What are you planning?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATALOG.map((c) => (
              <Link
                key={c.slug}
                href={`/plan/new?category=${c.slug}`}
                className="vv-glass group rounded-2xl p-5 transition hover:border-saffron-500/40 hover:bg-white/[0.06]"
              >
                <div className="text-3xl" aria-hidden>
                  {c.icon}
                </div>
                <h3 className="mt-3 font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-white/60">{c.description}</p>
                <p className="mt-3 text-xs text-saffron-400/80">{c.eventTypes.length} event types →</p>
              </Link>
            ))}
          </div>
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
      <div className="font-display text-3xl font-semibold text-saffron-500">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}
