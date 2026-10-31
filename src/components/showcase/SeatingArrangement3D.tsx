"use client";

import type { ShowcaseChairRow } from "@/lib/showcaseSeating";

// Theatre / auditorium chair rows. Each row is a line of chairs facing the
// stage (-Z). Used for community / conference / cultural events.
function TheatreChair({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.44, 0.08, 0.44]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.74, -0.18]} castShadow>
        <boxGeometry args={[0.44, 0.52, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.22, lz]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
}

export function SeatingArrangement3D({ rows, chairColor }: { rows: ShowcaseChairRow[]; chairColor: string }) {
  return (
    <group>
      {rows.map((row) => {
        const startX = row.x - ((row.seats - 1) * row.seatSpacing) / 2;
        return (
          <group key={row.id} position={[0, 0, row.z]} rotation={[0, row.rotY, 0]}>
            {Array.from({ length: row.seats }).map((_, i) => (
              <group key={i} position={[startX + i * row.seatSpacing, 0, 0]}>
                <TheatreChair color={chairColor} />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}
