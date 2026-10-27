import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl" aria-hidden>
        🪔
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-white/70">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-lg bg-saffron-500 px-6 py-2 font-semibold text-ink-900 hover:bg-saffron-400">
          Back home
        </Link>
        <Link href="/plan/new" className="rounded-lg border border-white/15 px-6 py-2 font-semibold text-white/90 hover:bg-white/5">
          Start planning
        </Link>
      </div>
    </main>
  );
}
