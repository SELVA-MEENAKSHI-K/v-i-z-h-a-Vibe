export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-white/60">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-saffron-500" />
        <p className="text-sm">Loading VizhaVibe…</p>
      </div>
    </div>
  );
}
