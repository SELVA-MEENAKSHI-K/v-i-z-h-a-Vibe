"use client";

import type { StagePlacement } from "@/lib/showcaseSeating";

// A realistic raised stage: platform, skirt, two steps, a backdrop panel and a
// pair of floral/decor pedestals. Colours come from the resolved environment.
export function Stage3D({
  stage,
  stageColor,
  accentColor,
  backdropColor,
}: {
  stage: StagePlacement;
  stageColor: string;
  accentColor: string;
  backdropColor: string;
}) {
  const { x, z, width, depth, height } = stage;

  return (
    <group position={[x, 0, z]}>
      {/* Platform */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={stageColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Carpet top */}
      <mesh position={[0, height + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width - 0.3, depth - 0.3]} />
        <meshStandardMaterial color={accentColor} roughness={0.9} />
      </mesh>
      {/* Front steps */}
      <mesh position={[0, 0.1, depth / 2 + 0.25]} castShadow>
        <boxGeometry args={[width * 0.5, 0.2, 0.5]} />
        <meshStandardMaterial color={stageColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, depth / 2 + 0.05]} castShadow>
        <boxGeometry args={[width * 0.5, 0.2, 0.3]} />
        <meshStandardMaterial color={stageColor} roughness={0.7} />
      </mesh>

      {/* Backdrop panel */}
      <mesh position={[0, height + 1.9, -depth / 2 + 0.1]} castShadow>
        <boxGeometry args={[width, 3.6, 0.15]} />
        <meshStandardMaterial color={backdropColor} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Backdrop accent band */}
      <mesh position={[0, height + 3.0, -depth / 2 + 0.2]}>
        <boxGeometry args={[width, 0.5, 0.16]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.25} />
      </mesh>

      {/* Two decorative pedestals flanking the couple/speaker */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(width / 2 - 0.9) * s, height, -depth / 4]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.3, 1.0, 16]} />
            <meshStandardMaterial color={accentColor} metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Floral top */}
          <mesh position={[0, 1.15, 0]} castShadow>
            <icosahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial color={stageColor} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
