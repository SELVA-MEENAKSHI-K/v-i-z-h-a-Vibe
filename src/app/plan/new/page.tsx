import { Header } from "@/components/ui/Header";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { CATALOG, CITIES, CULTURAL_STYLES } from "@/data/catalog";

export const dynamic = "force-dynamic";

export default function NewPlanPage() {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Set up your event</h1>
        <p className="mt-2 text-white/70">
          A few details shape your venue search, 3D layout, and AI suggestions. You can change everything later.
        </p>
        <div className="mt-8">
          <SetupWizard
            catalog={CATALOG}
            cities={CITIES as unknown as string[]}
            styles={CULTURAL_STYLES as unknown as { slug: string; name: string }[]}
          />
        </div>
      </main>
    </>
  );
}
