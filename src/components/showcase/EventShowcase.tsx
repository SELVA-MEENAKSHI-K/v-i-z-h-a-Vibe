"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Plan } from "../planner/types";
import { resolveEventEnvironment } from "@/lib/eventEnvironment";
import { generateShowcaseArrangement, computeSeatingStats } from "@/lib/showcaseSeating";
import { deriveVenueDimensions } from "@/lib/venueDimensions";
import { SeatingStatsPanel } from "./SeatingStatsPanel";
import { AISeatingVoiceAssistant } from "./AISeatingVoiceAssistant";
import type { CameraView } from "./VenueCameraControls";

// Lazily load the Canvas; it must never run on the server.
const ShowcaseScene = dynamic(() => import("./ShowcaseScene"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

function SceneSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/60">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-saffron-500" />
        <p className="text-sm">Building the 3D event showcase…</p>
      </div>
    </div>
  );
}

const VIEWS: { id: CameraView; label: string }[] = [
  { id: "iso", label: "Isometric" },
  { id: "front", label: "Front" },
  { id: "top", label: "Top" },
];

export function EventShowcase({ plan }: { plan: Plan }) {
  const [view, setView] = useState<CameraView>("iso");
  const [resetSignal, setResetSignal] = useState(0);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  // Dimensions: prefer a real selected-venue size; otherwise a labelled sample.
  const dims = useMemo(() => deriveVenueDimensions(plan), [plan]);

  const env = useMemo(
    () =>
      resolveEventEnvironment({
        eventTypeSlug: plan.eventType.slug,
        categorySlug: plan.eventType.categoryName,
        styles: plan.styles,
        themeStageColor: (plan.preferences?.["themeStageColor"] as string | undefined) ?? null,
        themeAccentColor: (plan.preferences?.["themeAccentColor"] as string | undefined) ?? null,
      }),
    [plan.eventType.slug, plan.eventType.categoryName, plan.styles, plan.preferences],
  );

  const arrangement = useMemo(
    () =>
      generateShowcaseArrangement({
        guestCount: plan.guestCount,
        roomWidth: dims.width,
        roomDepth: dims.depth,
        arrangement: env.arrangement,
        hasDanceFloor: env.hasDanceFloor,
      }),
    [plan.guestCount, dims.width, dims.depth, env.arrangement, env.hasDanceFloor],
  );

  const stats = useMemo(
    // No real reservation data exists, so occupancy is intentionally omitted.
    () => computeSeatingStats(plan.guestCount, dims.width, dims.depth, arrangement),
    [plan.guestCount, dims.width, dims.depth, arrangement],
  );

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* Viewport — the main area, but a balanced height so the camera controls
          stay visible at the top and the scene doesn't leave a large empty
          band below it. Scales gently with the screen; usable on mobile. */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900"
        style={{ height: "clamp(440px, 56vh, 660px)" }}
      >
        {/* Camera controls — kept to the left; constrained so they don't run
            into the event badge on a narrow phone. */}
        <div className="absolute left-3 top-3 z-10 flex max-w-[65%] flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/10 vv-glass text-sm">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-2 sm:px-3.5 ${view === v.id ? "bg-saffron-500 text-ink-900" : "text-white/80 hover:bg-white/10"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setView("iso");
              setResetSignal((s) => s + 1);
            }}
            className="rounded-lg border border-white/10 vv-glass px-3 py-2 text-sm text-white/80 hover:bg-white/10 sm:px-3.5"
            title="Reset camera"
          >
            {/* Full label on larger screens; compact on phones to save width. */}
            <span className="hidden sm:inline">⟳ Reset camera</span>
            <span className="sm:hidden" aria-label="Reset camera">⟳</span>
          </button>
        </div>

        {/* Event badge — hidden on the smallest screens (the name + seat count
            are shown in the summary panel just below the viewport on mobile). */}
        <div className="absolute right-3 top-3 z-10 hidden max-w-[45%] rounded-lg border border-white/10 vv-glass px-3 py-2 text-sm sm:block">
          <div className="truncate font-medium text-white">{env.displayName}</div>
          <div className="text-white/60">
            {stats.seatsArranged} of {stats.totalCapacity} seats arranged
          </div>
        </div>

        {webglOk ? (
          <ShowcaseScene
            env={env}
            arrangement={arrangement}
            roomWidth={dims.width}
            roomDepth={dims.depth}
            view={view}
            resetSignal={resetSignal}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-8 text-center">
            <div>
              <p className="text-white/80">3D isn&apos;t supported on this device.</p>
              <p className="mt-1 text-sm text-white/55">
                The seating statistics beside this panel are still accurate for your event.
              </p>
            </div>
          </div>
        )}

        {/* Drag hint */}
        <div className="absolute bottom-2 left-3 z-10 text-[10px] text-white/40">
          Drag to rotate · scroll to zoom · showcase preview, not an architectural replica.
        </div>
      </div>

      {/* Right column: AI Voice Guide first (so its heading + controls sit near
          the top, level with the 3D viewport), then the seating stats. On
          desktop it sticks just under the sticky header; on smaller screens the
          grid collapses to one column and everything stacks and scrolls
          naturally under the 3D model. On desktop the column is sticky and, if
          its content is taller than the screen, it scrolls INTERNALLY (capped
          to the viewport height) so the AI guide + full summary are always
          reachable and never clipped by the sticky positioning. */}
      <div className="vv-scroll space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        <AISeatingVoiceAssistant
          eventName={plan.title}
          env={env}
          stats={stats}
          arrangement={arrangement}
          dims={dims}
        />
        <SeatingStatsPanel
          env={env}
          stats={stats}
          eventName={plan.title}
          eventTypeName={plan.eventType.name}
          guestCount={plan.guestCount}
          roomWidth={dims.width}
          roomDepth={dims.depth}
          isSampleVenue={dims.isSample}
        />
      </div>
    </div>
  );
}
