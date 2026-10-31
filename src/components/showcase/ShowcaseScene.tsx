"use client";

import { Canvas } from "@react-three/fiber";
import type { EventEnvironment } from "@/lib/eventEnvironment";
import type { ShowcaseArrangement } from "@/lib/showcaseSeating";
import { EventVenue3D } from "./EventVenue3D";
import { VenueCameraControls, type CameraView } from "./VenueCameraControls";

// The R3F <Canvas> for the showcase. Kept as its own default-exported module so
// the heavy 3D code can be dynamically imported (ssr:false) and never bloats the
// server bundle.
export default function ShowcaseScene({
  env,
  arrangement,
  roomWidth,
  roomDepth,
  view,
  resetSignal,
}: {
  env: EventEnvironment;
  arrangement: ShowcaseArrangement;
  roomWidth: number;
  roomDepth: number;
  view: CameraView;
  resetSignal: number;
}) {
  const span = Math.max(roomWidth, roomDepth);
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ fov: 42, near: 0.1, far: 500, position: [roomWidth * 0.85, span * 0.75, roomDepth * 0.95] }}
      className="h-full w-full"
    >
      <color attach="background" args={[env.lighting.background]} />
      <fog attach="fog" args={[env.lighting.background, span * 1.4, span * 3]} />
      <EventVenue3D env={env} arrangement={arrangement} roomWidth={roomWidth} roomDepth={roomDepth} />
      <VenueCameraControls roomWidth={roomWidth} roomDepth={roomDepth} view={view} resetSignal={resetSignal} />
    </Canvas>
  );
}
