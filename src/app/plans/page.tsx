import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { listPlans, type PlanListItem } from "@/lib/plans";
import { formatINR } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function MyPlansPage() {
  let plans: PlanListItem[] = [];
  let dbError = false;
  try {
    plans = await listPlans();
  } catch {
    dbError = true;
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold">My Plans</h1>
            <p className="mt-1 text-white/60">Your saved event plans. Open one to keep planning, or start a new one.</p>
          </div>
          <Link
            href="/plan/new"
            className="w-fit rounded-xl bg-saffron-500 px-5 py-2.5 font-semibold text-ink-900 shadow-glow transition hover:bg-saffron-400"
          >
            Start planning
          </Link>
        </div>

        {dbError && (
          <div className="mt-8 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
            Couldn&apos;t load your plans. If this is a fresh install, run <code className="rounded bg-black/40 px-1">npm run db:setup</code> first.
          </div>
        )}

        {!dbError && plans.length === 0 && (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-white/10 vv-glass px-6 py-16 text-center">
            <div className="text-5xl" aria-hidden>
              🗓️
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">No saved plans yet</h2>
            <p className="mt-2 max-w-md text-white/60">
              You haven&apos;t created any event plans. Start one to pick a venue, design your 3D layout, and get AI-assisted
              themes, menus, and budgets.
            </p>
            <Link
              href="/plan/new"
              className="mt-6 rounded-xl bg-saffron-500 px-6 py-3 font-semibold text-ink-900 shadow-glow transition hover:bg-saffron-400"
            >
              Start planning
            </Link>
          </div>
        )}

        {!dbError && plans.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {plans.map((p) => (
              <Link
                key={p.id}
                href={`/plan/${p.shareToken}`}
                className="group rounded-2xl border border-white/10 vv-glass p-5 transition hover:border-saffron-500/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold group-hover:text-saffron-400">{p.title}</h3>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/60">{p.categoryName}</span>
                </div>
                <p className="mt-1 text-sm text-white/60">
                  {p.eventTypeName} · {p.city} · {p.guestCount} guests
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                  <span>{p.startDate ? new Date(p.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date not set"}</span>
                  {p.budget > 0 && <span>Budget {formatINR(p.budget)}</span>}
                  {p.selectedVenueName && <span className="truncate">Venue: {p.selectedVenueName}</span>}
                </div>
                {p.styles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.styles.map((s) => (
                      <span key={s} className="rounded-full bg-peacock-500/15 px-2 py-0.5 text-[11px] text-peacock-400">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[11px] text-white/35">Updated {new Date(p.updatedAt).toLocaleDateString("en-IN")}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
