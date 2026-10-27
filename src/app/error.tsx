"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl" aria-hidden>
        ⚠️
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-white/70">An unexpected error occurred while loading this page.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-saffron-500 px-6 py-2 font-semibold text-ink-900 hover:bg-saffron-400"
      >
        Try again
      </button>
    </main>
  );
}
