"use client";

import { Suspense } from "react";
import { Environment, Html } from "@react-three/drei";
import type { EventEnvironment } from "@/lib/eventEnvironment";
import type { ShowcaseArrangement } from "@/lib/showcaseSeating";
import { Stage3D } from "./Stage3D";
import { DiningArea3D } from "./DiningArea3D";
import { SeatingArrangement3D } from "./SeatingArrangement3D";
import { EventDecoration3D } from "./EventDecoration3D";

// Isometric cutaway room: floor, back + left walls (so the interior is always
// visible, like the reference), doors, windows, a central carpet runner, and
// visible dimension labels. All colours come from the resolved environment.

function Walls({ roomWidth, roomDepth, wallColor }: { roomWidth: number; roomDepth: number; wallColor: string }) {
  const h = 5;
  const t = 0.2;
  return (
    <group>
      {/* Back wall (-Z) with two windows */}
      <mesh position={[0, h / 2, -roomDepth / 2]} receiveShadow>
        <boxGeometry args={[roomWidth, h, t]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Left wall (-X) with a door */}
      <mesh position={[-roomWidth / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[t, h, roomDepth]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Windows on the back wall */}
      {[-roomWidth / 4, roomWidth / 4].map((x, i) => (
        <group key={i} position={[x, 2.6, -roomDepth / 2 + t / 2 + 0.02]}>
          <mesh>
            <boxGeometry args={[1.8, 1.6, 0.06]} />
            <meshStandardMaterial color="#bfe3ff" emissive="#9cc6ff" emissiveIntensity={0.25} roughness={0.2} metalness={0.1} />
          </mesh>
          {/* frame */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[1.9, 1.7, 0.04]} />
            <meshStandardMaterial color="#ffffff" wireframe />
          </mesh>
        </group>
      ))}

      {/* Door on the left wall */}
      <group position={[-roomWidth / 2 + t / 2 + 0.02, 1.4, roomDepth / 3]}>
        <mesh>
          <boxGeometry args={[0.06, 2.8, 1.4]} />
          <meshStandardMaterial color="#5a3a24" roughness={0.6} />
        </mesh>
        <mesh position={[0.05, 0, 0.45]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#d9b24a" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function CarpetRunner({ roomDepth, color, aisle }: { roomDepth: number; color: string; aisle: boolean }) {
  const width = aisle ? 1.6 : 2.2;
  return (
    <mesh position={[0, 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, roomDepth - 2]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function DimensionLabels({ roomWidth, roomDepth }: { roomWidth: number; roomDepth: number }) {
  const chip = "rounded bg-ink-900/85 px-2 py-0.5 text-[11px] font-medium text-white ring-1 ring-white/15";
  return (
    <group>
      <Html position={[0, 0.1, roomDepth / 2 + 1]} center distanceFactor={26}>
        <div className={chip}>{roomWidth} m</div>
      </Html>
      <Html position={[roomWidth / 2 + 1, 0.1, 0]} center distanceFactor={26}>
        <div className={chip}>{roomDepth} m</div>
      </Html>
    </group>
  );
}

export function EventVenue3D({
  env,
  arrangement,
  roomWidth,
  roomDepth,
}: {
  env: EventEnvironment;
  arrangement: ShowcaseArrangement;
  roomWidth: number;
  roomDepth: number;
}) {
  const L = env.lighting;

  return (
    <group>
      {/* Lighting rig from the environment mood */}
      <ambientLight color={L.ambient} intensity={L.ambientIntensity} />
      <hemisphereLight color={L.key} groundColor={env.floorColor} intensity={0.4} />
      <directionalLight color={L.key} position={[roomWidth * 0.6, 16, roomDepth * 0.5]} intensity={L.keyIntensity} castShadow shadow-mapSize={[1024, 1024]} />
      {/* Warm accent spotlight on the stage */}
      <spotLight
        color={L.accent}
        position={[0, 9, arrangement.stage.z + 4]}
        target-position={[0, 1, arrangement.stage.z]}
        angle={0.6}
        penumbra={0.5}
        intensity={L.accentIntensity * 2}
        distance={30}
        castShadow
      />

      <Suspense fallback={null}>
        <Environment preset="apartment" />
      </Suspense>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshStandardMaterial color={env.floorColor} roughness={0.85} />
      </mesh>

      <Walls roomWidth={roomWidth} roomDepth={roomDepth} wallColor={env.wallColor} />
      <CarpetRunner roomDepth={roomDepth} color={env.carpetColor} aisle={!!arrangement.aisle} />

      {/* Stage */}
      <Stage3D stage={arrangement.stage} stageColor={env.stageColor} accentColor={env.accentColor} backdropColor={env.wallColor} />

      {/* Dance floor (if any) */}
      {arrangement.danceFloor && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[arrangement.danceFloor.x, 0.03, arrangement.danceFloor.z]}
          receiveShadow
        >
          <planeGeometry args={[arrangement.danceFloor.width, arrangement.danceFloor.depth]} />
          <meshStandardMaterial color={env.accentColor} transparent opacity={0.55} roughness={0.3} metalness={0.3} />
        </mesh>
      )}

      {/* Seating */}
      <DiningArea3D tables={arrangement.tables} clothColor={env.stageColor} chairColor={env.accentColor} accentColor={env.accentColor} />
      <SeatingArrangement3D rows={arrangement.chairRows} chairColor={env.accentColor} />

      {/* Decorations */}
      <EventDecoration3D env={env} stage={arrangement.stage} roomWidth={roomWidth} roomDepth={roomDepth} />

      <DimensionLabels roomWidth={roomWidth} roomDepth={roomDepth} />
    </group>
  );
}
