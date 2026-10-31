"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client";

type Health = {
  status: string;
  integrations: { places: { live: boolean; provider: string }; ai: { live: boolean; provider: string } };
};

// Small status strip showing whether live Places / AI are configured.
export function ConfigStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const show = process.env.NEXT_PUBLIC_SHOW_CONFIG_STATUS !== "false";

  useEffect(() => {
    apiGet<Health>("/api/health")
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (!show || !health) return null;

  const places = health.integrations.places.live;
  const aiLive = health.integrations.ai.live;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-white/70" role="status" aria-live="polite">
      <Dot ok={places} />
      <span>Venues: {places ? "Live (Geoapify)" : "Sample data"}</span>
      {/* AI status only appears when a live provider is configured — no demo-mode badge. */}
      {aiLive && (
        <>
          <span className="text-white/20">·</span>
          <Dot ok={true} />
          <span>AI: Live</span>
        </>
      )}
    </div>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return <span className={`h-2 w-2 rounded-full ${ok ? "bg-peacock-400" : "bg-amber-400"}`} aria-hidden />;
}
