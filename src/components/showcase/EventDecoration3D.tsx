"use client";

import type { DecorationKind, EventEnvironment } from "@/lib/eventEnvironment";
import type { StagePlacement } from "@/lib/showcaseSeating";

// Event-specific decorations rendered from primitive geometry (no external GLB
// required, so it works on a memory-constrained machine). Each kind is a small
// realistic prop. Placement is derived from the stage + room so decor frames
// the scene rather than floating randomly.

function Mandap({ color, accent, x, z }: { color: string; accent: string; x: number; z: number }) {
  const h = 3.4;
  const w = 4.2;
  return (
    <group position={[x, 0, z]}>
      {/* 4 pillars */}
      {[
        [-w / 2, -w / 2],
        [w / 2, -w / 2],
        [-w / 2, w / 2],
        [w / 2, w / 2],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, h / 2, pz]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, h, 14]} />
          <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* canopy */}
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[w + 0.6, 0.25, w + 0.6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* draped dome */}
      <mesh position={[0, h + 0.3, 0]}>
        <coneGeometry args={[w / 2 + 0.3, 1.1, 4]} />
        <meshStandardMaterial color={accent} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* flower garlands along the top edge */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`g${i}`} position={[-w / 2 + (i * w) / 5, h - 0.4, w / 2 + 0.3]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function BrassLamp({ x, z, accent }: { x: number; z: number; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.12, 1.2, 10]} />
        <meshStandardMaterial color={accent} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.28, 0.3, 10]} />
        <meshStandardMaterial color={accent} metalness={0.8} roughness={0.25} />
      </mesh>
      {/* flame glow */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffb347" emissive="#ff9a2c" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, 1.55, 0]} color="#ffb14d" intensity={0.5} distance={4} />
    </group>
  );
}

function KeralaLamp({ x, z, accent }: { x: number; z: number; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.09, 2.2, 10]} />
        <meshStandardMaterial color={accent} metalness={0.85} roughness={0.2} />
      </mesh>
      {/* tiers */}
      {[0.7, 1.2, 1.7].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.26 - i * 0.05, 0.3 - i * 0.05, 0.08, 12]} />
          <meshStandardMaterial color={accent} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 2.3, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffb347" emissive="#ff9a2c" emissiveIntensity={1.3} />
      </mesh>
      <pointLight position={[0, 2.35, 0]} color="#ffcf7a" intensity={0.5} distance={5} />
    </group>
  );
}

function FloralArch({ x, z, color, accent }: { x: number; z: number; color: string; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.16, 12, 24, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* flower clusters */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 6) * Math.PI;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.8, 1.6 + Math.sin(a) * 1.8, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color={i % 2 ? accent : color} />
          </mesh>
        );
      })}
    </group>
  );
}

function BalloonCluster({ x, z, palette }: { x: number; z: number; palette: string[] }) {
  const colors = palette.length ? palette : ["#ff5db1", "#ffd23f", "#3ec1ff"];
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: 9 }).map((_, i) => {
        const bx = (i % 3) * 0.5 - 0.5;
        const by = 1.8 + Math.floor(i / 3) * 0.55 + (i % 2) * 0.15;
        const bz = ((i % 2) - 0.5) * 0.4;
        return (
          <group key={i} position={[bx, by, bz]}>
            <mesh castShadow>
              <sphereGeometry args={[0.32, 12, 12]} />
              <meshStandardMaterial color={colors[i % colors.length]} roughness={0.35} />
            </mesh>
            {/* string */}
            <mesh position={[0, -0.9, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 1.6, 4]} />
              <meshStandardMaterial color="#cccccc" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CakeTable({ x, z, color, accent }: { x: number; z: number; color: string; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      {/* table */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.85, 0.8, 20]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* cake tiers */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 20]} />
        <meshStandardMaterial color="#fff6f0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.26, 20]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
      {/* candle flame */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffb13d" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color="#ffd27a" intensity={0.4} distance={3} />
    </group>
  );
}

function Pedestal({ x, z, color, accent }: { x: number; z: number; color: string; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.1, 14]} />
        <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Podium({ x, z, color, accent }: { x: number; z: number; color: string; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.7, 1.2, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.25, 0.1]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.05]} />
        <meshStandardMaterial color={accent} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Pillar({ x, z, accent }: { x: number; z: number; accent: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 4, 16]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[0.9, 0.3, 0.9]} />
        <meshStandardMaterial color={accent} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function LanternString({ roomWidth, z, accent }: { roomWidth: number; z: number; accent: string }) {
  const count = Math.max(4, Math.floor(roomWidth / 2));
  return (
    <group position={[0, 0, z]}>
      {Array.from({ length: count }).map((_, i) => {
        const x = -roomWidth / 2 + 1 + (i * (roomWidth - 2)) / (count - 1);
        const y = 4.4 + Math.sin(i) * 0.2;
        return (
          <group key={i} position={[x, y, 0]}>
            <mesh>
              <sphereGeometry args={[0.16, 8, 8]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
            </mesh>
            <pointLight color={accent} intensity={0.12} distance={3} />
          </group>
        );
      })}
    </group>
  );
}

function BananaLeafAccent({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.4, 0.7]} />
      <meshStandardMaterial color="#1f6b3a" roughness={0.9} side={2} />
    </mesh>
  );
}

// Renders the environment's decoration set, positioned relative to the stage
// and room. `env.decorations` drives exactly what appears.
export function EventDecoration3D({
  env,
  stage,
  roomWidth,
  roomDepth,
}: {
  env: EventEnvironment;
  stage: StagePlacement;
  roomWidth: number;
  roomDepth: number;
}) {
  const color = env.stageColor;
  const accent = env.accentColor;
  const stageFrontZ = stage.z + stage.depth / 2;

  const nodes: React.ReactNode[] = [];

  for (const kind of env.decorations as DecorationKind[]) {
    switch (kind) {
      case "mandap":
        nodes.push(<Mandap key="mandap" x={stage.x} z={stage.z} color={color} accent={accent} />);
        break;
      case "floral-arch":
        nodes.push(<FloralArch key="arch-entrance" x={0} z={roomDepth / 2 - 1.5} color={color} accent={accent} />);
        break;
      case "brass-lamp":
        nodes.push(<BrassLamp key="lamp-l" x={stage.x - stage.width / 2 - 0.8} z={stageFrontZ + 0.5} accent={accent} />);
        nodes.push(<BrassLamp key="lamp-r" x={stage.x + stage.width / 2 + 0.8} z={stageFrontZ + 0.5} accent={accent} />);
        break;
      case "kerala-lamp":
        nodes.push(<KeralaLamp key="klamp-l" x={stage.x - stage.width / 2 - 0.9} z={stageFrontZ + 0.6} accent={accent} />);
        nodes.push(<KeralaLamp key="klamp-r" x={stage.x + stage.width / 2 + 0.9} z={stageFrontZ + 0.6} accent={accent} />);
        break;
      case "banana-leaf":
        nodes.push(<BananaLeafAccent key="bl-l" x={stage.x - stage.width / 2 - 1.5} z={stageFrontZ + 1.6} />);
        nodes.push(<BananaLeafAccent key="bl-r" x={stage.x + stage.width / 2 + 1.5} z={stageFrontZ + 1.6} />);
        break;
      case "balloon-cluster":
        nodes.push(<BalloonCluster key="balloons-l" x={stage.x - stage.width / 2 - 0.8} z={stageFrontZ} palette={env.palette} />);
        nodes.push(<BalloonCluster key="balloons-r" x={stage.x + stage.width / 2 + 0.8} z={stageFrontZ} palette={env.palette} />);
        break;
      case "cake-table":
        nodes.push(<CakeTable key="cake" x={stage.x} z={stageFrontZ + 1.6} color={color} accent={accent} />);
        break;
      case "backdrop-panel":
        // The stage already includes a backdrop; skip to avoid duplication.
        break;
      case "pedestal-floral":
        nodes.push(<Pedestal key="ped-l" x={stage.x - stage.width / 2 - 0.5} z={stageFrontZ + 0.2} color={color} accent={accent} />);
        nodes.push(<Pedestal key="ped-r" x={stage.x + stage.width / 2 + 0.5} z={stageFrontZ + 0.2} color={color} accent={accent} />);
        break;
      case "lantern-string":
        nodes.push(<LanternString key="lanterns" roomWidth={roomWidth} z={0} accent={accent} />);
        break;
      case "podium":
        nodes.push(<Podium key="podium" x={stage.x + stage.width / 2 - 1} z={stage.z} color={color} accent={accent} />);
        break;
      case "pillar":
        nodes.push(<Pillar key="pillar-l" x={-roomWidth / 2 + 1.2} z={0} accent={accent} />);
        nodes.push(<Pillar key="pillar-r" x={roomWidth / 2 - 1.2} z={0} accent={accent} />);
        break;
    }
  }

  return <group>{nodes}</group>;
}
