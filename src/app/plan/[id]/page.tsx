import { notFound } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { Workspace } from "@/components/planner/Workspace";
import { serializePlan } from "@/lib/plans";
import type { Plan } from "@/components/planner/types";

export const dynamic = "force-dynamic";

export default async function PlanPage({ params }: { params: { id: string } }) {
  let plan: Plan | null = null;
  try {
    plan = (await serializePlan(params.id)) as Plan | null;
  } catch {
    // DB not migrated/seeded — show a helpful state below.
    plan = null;
  }

  if (!plan) {
    return (
      <>
        <Header />
        <main id="main" className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-semibold">Plan not found</h1>
          <p className="mt-3 text-white/70">
            We couldn&apos;t load this plan. If this is a fresh install, run the database setup and seed first:
          </p>
          <pre className="mx-auto mt-4 w-fit rounded-lg bg-black/40 px-4 py-3 text-left text-sm text-peacock-400">
            npm run db:setup
          </pre>
          <a href="/plan/new" className="mt-6 inline-block rounded-lg bg-saffron-500 px-6 py-2 font-semibold text-ink-900">
            Start a new plan
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main">
        <Workspace initialPlan={plan} />
      </main>
    </>
  );
}
