"use client";

import { useMemo } from "react";
import type { ShowcaseTable } from "@/lib/showcaseSeating";

// A realistic round or rectangular dining table with a draped cloth, a small
// centrepiece, and chairs placed around it.
function Chair({ color }: { color: string }) {
  return (
    <group>
      {/* seat */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.08, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* back */}
      <mesh position={[0, 0.75, -0.17]} castShadow>
        <boxGeometry args={[0.42, 0.55, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* 4 legs */}
      {[
        [-0.17, -0.17],
        [0.17, -0.17],
        [-0.17, 0.17],
        [0.17, 0.17],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.22, lz]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      ))}
    </group>
  );
}

function RoundTable({ table, clothColor, chairColor, accentColor }: { table: ShowcaseTable; clothColor: string; chairColor: string; accentColor: string }) {
  const radius = 0.9;
  const chairRing = radius + 0.55;
  return (
    <group position={[table.x, 0, table.z]}>
      {/* draped cloth (cylinder to the floor) */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius + 0.08, 0.76, 28]} />
        <meshStandardMaterial color={clothColor} roughness={0.85} />
      </mesh>
      {/* table top */}
      <mesh position={[0, 0.77, 0]} castShadow>
        <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.05, 28]} />
        <meshStandardMaterial color="#fbf5ea" roughness={0.6} />
      </mesh>
      {/* centrepiece */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.15} roughness={0.7} />
      </mesh>
      {/* chairs */}
      {table.seatAngles.map((a, i) => (
        <group key={i} position={[Math.cos(a) * chairRing, 0, Math.sin(a) * chairRing]} rotation={[0, -a + Math.PI / 2, 0]}>
          <Chair color={chairColor} />
        </group>
      ))}
    </group>
  );
}

function RectTable({ table, clothColor, chairColor, accentColor }: { table: ShowcaseTable; clothColor: string; chairColor: string; accentColor: string }) {
  const w = 2.4;
  const d = 1.0;
  const perSide = Math.ceil(table.seats / 2);
  return (
    <group position={[table.x, 0, table.z]}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.76, d]} />
        <meshStandardMaterial color={clothColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[w + 0.1, 0.05, d + 0.1]} />
        <meshStandardMaterial color="#fbf5ea" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <boxGeometry args={[0.5, 0.3, 0.3]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.15} />
      </mesh>
      {Array.from({ length: perSide }).map((_, i) => {
        const x = -w / 2 + (w / (perSide + 1)) * (i + 1);
        return (
          <group key={`f${i}`} position={[x, 0, d / 2 + 0.45]} rotation={[0, Math.PI, 0]}>
            <Chair color={chairColor} />
          </group>
        );
      })}
      {Array.from({ length: table.seats - perSide }).map((_, i) => {
        const x = -w / 2 + (w / (perSide + 1)) * (i + 1);
        return (
          <group key={`b${i}`} position={[x, 0, -d / 2 - 0.45]}>
            <Chair color={chairColor} />
          </group>
        );
      })}
    </group>
  );
}

export function DiningArea3D({
  tables,
  clothColor,
  chairColor,
  accentColor,
}: {
  tables: ShowcaseTable[];
  clothColor: string;
  chairColor: string;
  accentColor: string;
}) {
  // Memo not strictly required, but avoids re-creating child arrays on re-render.
  const items = useMemo(() => tables, [tables]);
  return (
    <group>
      {items.map((t) =>
        t.shape === "round" ? (
          <RoundTable key={t.id} table={t} clothColor={clothColor} chairColor={chairColor} accentColor={accentColor} />
        ) : (
          <RectTable key={t.id} table={t} clothColor={clothColor} chairColor={chairColor} accentColor={accentColor} />
        ),
      )}
    </group>
  );
}
