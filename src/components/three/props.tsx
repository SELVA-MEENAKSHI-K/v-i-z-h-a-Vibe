"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Shared scenery pieces for the hero dioramas. All procedural, no assets. */

const rand = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Glowing material that ignores tone mapping so bloom picks it up. */
export function Glow({ color, intensity = 2.2, opacity = 1 }: { color: string; intensity?: number; opacity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={intensity}
      toneMapped={false}
      transparent={opacity < 1}
      opacity={opacity}
      roughness={0.4}
    />
  );
}

/* ---------- fire ---------- */

export function Flame({ position = [0, 0, 0], size = 1, seed = 0, color = "#ffb347" }: { position?: [number, number, number]; size?: number; seed?: number; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * 11 + seed * 7;
    const k = 1 + Math.sin(t) * 0.12 + Math.sin(t * 2.3) * 0.07;
    ref.current.scale.set(1 / k, k, 1 / k);
    ref.current.rotation.z = Math.sin(t * 0.7) * 0.12;
  });
  return (
    <group position={position} scale={size}>
      <group ref={ref}>
        <mesh position={[0, 0.07, 0]}>
          <coneGeometry args={[0.045, 0.16, 10]} />
          <Glow color={color} intensity={3} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.038, 10, 8]} />
          <Glow color="#fff1b8" intensity={3.4} />
        </mesh>
      </group>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Diya({ position = [0, 0, 0], scale = 1, seed = 0 }: { position?: [number, number, number]; scale?: number; seed?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.03, 0]} scale={[1, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#b45a1c" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Flame position={[0, 0.05, 0]} size={0.9} seed={seed} />
    </group>
  );
}

/** Tall brass kuthuvilakku (traditional lamp). */
export function KuthuVilakku({ position = [0, 0, 0], scale = 1, seed = 0 }: { position?: [number, number, number]; scale?: number; seed?: number }) {
  const brass = <meshStandardMaterial color="#e0a526" metalness={0.85} roughness={0.28} emissive="#8a5a00" emissiveIntensity={0.25} />;
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 0.14, 20]} />
        {brass}
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.0, 12]} />
        {brass}
      </mesh>
      {[0.35, 0.65, 0.95].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.07, 0.022, 8, 16]} />
          {brass}
        </mesh>
      ))}
      <mesh position={[0, 1.12, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.06, 0.09, 20]} />
        {brass}
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return <Flame key={i} position={[Math.cos(a) * 0.15, 1.17, Math.sin(a) * 0.15]} size={0.85} seed={seed + i} />;
      })}
    </group>
  );
}

/* ---------- garlands, strings, bunting ---------- */

/** A loop of marigold/rose flowers, e.g. around a neck. */
export function FlowerRing({ radius = 0.24, color1 = "#ffb020", color2 = "#ff6a3d", count = 26 }: { radius?: number; color1?: string; color2?: string; count?: number }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.012, 6, 32]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.7} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, (i % 2 ? 0.014 : -0.014), Math.sin(a) * radius]} castShadow>
            <sphereGeometry args={[0.036, 8, 8]} />
            <meshStandardMaterial color={i % 3 === 0 ? color2 : color1} roughness={0.5} emissive={i % 3 === 0 ? color2 : color1} emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Garland that cycles above, then down over the head of the receiver. */
export function GarlandCycle({ position = [0, 0, 0], period = 7 }: { position?: [number, number, number]; period?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const u = (s.clock.elapsedTime % period) / period;
    // 0-.35 held up, .35-.55 lowers over the head, .55-.9 rests on shoulders, then resets.
    let y = 0.5;
    if (u > 0.35 && u <= 0.55) y = 0.5 - ((u - 0.35) / 0.2) * 0.5;
    else if (u > 0.55 && u <= 0.9) y = 0;
    else if (u > 0.9) y = ((u - 0.9) / 0.1) * 0.5;
    ref.current.position.y = y;
    ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 2) * 0.03;
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <FlowerRing radius={0.26} />
      </group>
    </group>
  );
}

/** Fairy-light string along a quadratic curve. */
export function FairyLights({
  from,
  to,
  sag = 1.2,
  count = 22,
  colors = ["#ffd98a", "#ff9ab0"],
}: {
  from: [number, number, number];
  to: [number, number, number];
  sag?: number;
  count?: number;
  colors?: string[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pts = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const m = a.clone().add(b).multiplyScalar(0.5);
    m.y -= sag;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return new THREE.Vector3()
        .copy(a)
        .multiplyScalar((1 - t) * (1 - t))
        .addScaledVector(m, 2 * (1 - t) * t)
        .addScaledVector(b, t * t);
    });
  }, [from, to, sag, count]);

  useMemo(() => undefined, []);
  useFrame((s) => {
    const m = ref.current;
    if (!m) return;
    pts.forEach((p, i) => {
      const tw = 0.65 + 0.35 * Math.sin(s.clock.elapsedTime * 2.2 + i * 1.7);
      dummy.position.copy(p);
      dummy.scale.setScalar(tw);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, new THREE.Color(colors[i % colors.length]).multiplyScalar(2));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts), [pts]);
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 40, 0.008, 4, false]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** Triangular flags along a curve. */
export function Bunting({ from, to, sag = 0.9, count = 11, colors }: { from: [number, number, number]; to: [number, number, number]; sag?: number; count?: number; colors: string[] }) {
  const flags = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const m = a.clone().add(b).multiplyScalar(0.5);
    m.y -= sag;
    return Array.from({ length: count }, (_, i) => {
      const t = (i + 0.5) / count;
      const p = new THREE.Vector3()
        .copy(a)
        .multiplyScalar((1 - t) * (1 - t))
        .addScaledVector(m, 2 * (1 - t) * t)
        .addScaledVector(b, t * t);
      return { p, i };
    });
  }, [from, to, sag, count]);
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    ref.current?.children.forEach((c, i) => {
      c.rotation.z = Math.sin(s.clock.elapsedTime * 1.6 + i * 0.9) * 0.12;
    });
  });
  const shape = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.17, 0);
    sh.lineTo(0.17, 0);
    sh.lineTo(0, -0.34);
    sh.closePath();
    return sh;
  }, []);
  return (
    <group ref={ref}>
      {flags.map(({ p, i }) => (
        <mesh key={i} position={p}>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color={colors[i % colors.length]} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- balloons, cake, gifts ---------- */

export function Balloon({ position, color, string = 2.2, phase = 0 }: { position: [number, number, number]; color: string; string?: number; phase?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime + phase;
    ref.current.rotation.z = Math.sin(t * 1.1) * 0.07;
    ref.current.rotation.x = Math.cos(t * 0.9) * 0.05;
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh position={[0, string / 2, 0]}>
          <cylinderGeometry args={[0.004, 0.004, string, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
        <group position={[0, string + 0.42, 0]}>
          <mesh scale={[1, 1.22, 1]} castShadow>
            <sphereGeometry args={[0.38, 24, 18]} />
            <meshStandardMaterial color={color} roughness={0.25} metalness={0.1} emissive={color} emissiveIntensity={0.18} />
          </mesh>
          <mesh position={[-0.12, 0.16, 0.3]} scale={[1, 1.5, 0.5]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshBasicMaterial color="#fff" transparent opacity={0.45} />
          </mesh>
          <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.05, 0.1, 8]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function Cake({ position = [0, 0, 0], accent = "#ff3d7f", cream = "#fff4e8", candles = 3 }: { position?: [number, number, number]; accent?: string; cream?: string; candles?: number }) {
  const tiers: [number, number, string][] = [
    [0.46, 0.22, cream],
    [0.34, 0.2, accent],
    [0.22, 0.17, cream],
  ];
  let y = 0;
  return (
    <group position={position}>
      {tiers.map(([r, h, c], i) => {
        const py = y + h / 2;
        y += h;
        return (
          <group key={i}>
            <mesh position={[0, py, 0]} castShadow>
              <cylinderGeometry args={[r, r, h, 32]} />
              <meshStandardMaterial color={c} roughness={0.5} />
            </mesh>
            <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.022, 8, 32]} />
              <meshStandardMaterial color={i % 2 ? cream : "#ffffff"} roughness={0.4} />
            </mesh>
            {Array.from({ length: 10 }).map((_, k) => {
              const a = (k / 10) * Math.PI * 2;
              return (
                <mesh key={k} position={[Math.cos(a) * r, y - 0.04, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.03, 6, 6]} />
                  <meshStandardMaterial color={i % 2 ? cream : "#ffffff"} roughness={0.4} />
                </mesh>
              );
            })}
          </group>
        );
      })}
      {Array.from({ length: candles }).map((_, i) => {
        const a = (i / candles) * Math.PI * 2;
        const r = candles > 1 ? 0.1 : 0;
        return (
          <group key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
              <meshStandardMaterial color={i % 2 ? "#4dd8c8" : "#ffd23f"} roughness={0.5} />
            </mesh>
            <Flame position={[0, 0.14, 0]} size={0.8} seed={i} />
          </group>
        );
      })}
    </group>
  );
}

export function Gift({ position, size = 0.4, color, ribbon = "#fff4e8", rotY = 0 }: { position: [number, number, number]; size?: number; color: string; ribbon?: string; rotY?: number }) {
  return (
    <group position={[position[0], position[1] + size / 2, position[2]]} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 1.02, size * 1.02, size * 0.14]} />
        <meshStandardMaterial color={ribbon} roughness={0.4} />
      </mesh>
      <mesh>
        <boxGeometry args={[size * 0.14, size * 1.02, size * 1.02]} />
        <meshStandardMaterial color={ribbon} roughness={0.4} />
      </mesh>
      <mesh position={[0, size / 2 + 0.04, 0]}>
        <torusKnotGeometry args={[size * 0.1, size * 0.03, 40, 6]} />
        <meshStandardMaterial color={ribbon} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------- music gear ---------- */

export function Speaker({ position, rotationY = 0, scale = 1, color = "#14101f" }: { position: [number, number, number]; rotationY?: number; scale?: number; color?: string }) {
  const cone = useRef<THREE.Mesh>(null);
  const cone2 = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    const k = 1 + Math.max(0, Math.sin(s.clock.elapsedTime * 8)) * 0.08;
    cone.current?.scale.set(k, k, 1);
    cone2.current?.scale.set(1 + (k - 1) * 0.5, 1 + (k - 1) * 0.5, 1);
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.8, 1.8, 0.65]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh ref={cone} position={[0, 0.55, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.27, 0.22, 0.05, 24]} />
        <meshStandardMaterial color="#26223a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.55, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.27, 0.018, 8, 24]} />
        <Glow color="#7dffb2" intensity={1.8} />
      </mesh>
      <mesh ref={cone2} position={[0, 1.38, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.05, 20]} />
        <meshStandardMaterial color="#26223a" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Guitar() {
  const wood = <meshStandardMaterial color="#c47a35" roughness={0.45} />;
  return (
    <group position={[0.1, 1.05, 0.2]} rotation={[0, 0, 0.32]}>
      <mesh scale={[1, 0.9, 0.35]} position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.2, 20, 16]} />
        {wood}
      </mesh>
      <mesh scale={[1, 0.9, 0.35]} position={[-0.2, 0.03, 0]} castShadow>
        <sphereGeometry args={[0.15, 20, 16]} />
        {wood}
      </mesh>
      <mesh position={[-0.12, 0.01, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
        <meshStandardMaterial color="#1a0d06" roughness={0.9} />
      </mesh>
      <mesh position={[-0.68, 0.03, 0]} castShadow>
        <boxGeometry args={[0.8, 0.045, 0.04]} />
        <meshStandardMaterial color="#3a200d" roughness={0.6} />
      </mesh>
      <mesh position={[-1.12, 0.03, 0]}>
        <boxGeometry args={[0.14, 0.08, 0.04]} />
        <meshStandardMaterial color="#3a200d" roughness={0.6} />
      </mesh>
      <mesh position={[-0.5, 0.03, 0.025]}>
        <boxGeometry args={[1.1, 0.008, 0.004]} />
        <meshStandardMaterial color="#e8e8f5" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function Mic() {
  return (
    <group position={[0, -0.04, 0]}>
      <mesh>
        <cylinderGeometry args={[0.014, 0.017, 0.17, 10]} />
        <meshStandardMaterial color="#2d2d38" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <sphereGeometry args={[0.036, 14, 12]} />
        <meshStandardMaterial color="#c3c6d2" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function RingBox() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 2;
      const k = 1 + Math.sin(s.clock.elapsedTime * 5) * 0.2;
      ref.current.scale.setScalar(k);
    }
  });
  return (
    <group position={[0, -0.05, 0]} rotation={[0.2, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#7a1230" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.026, 0.006, 8, 20]} />
        <meshStandardMaterial color="#ffd98a" metalness={1} roughness={0.15} emissive="#ffb347" emissiveIntensity={0.7} />
      </mesh>
      <mesh ref={ref} position={[0, 0.095, 0]}>
        <octahedronGeometry args={[0.024, 0]} />
        <Glow color="#ffffff" intensity={4} />
      </mesh>
    </group>
  );
}

export function DiscoBall({ position = [0, 5, 0], radius = 0.7 }: { position?: [number, number, number]; radius?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.8;
  });
  return (
    <group position={position}>
      <mesh position={[0, radius + 1.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 2.4, 4]} />
        <meshBasicMaterial color="#aaa" />
      </mesh>
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[radius, 2]} />
        <meshStandardMaterial color="#d9f7ff" metalness={1} roughness={0.08} flatShading emissive="#6fdcff" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

/** Rotating translucent light cone. */
export function Beam({ position, color, length = 7, spread = 1.3, speed = 0.5, phase = 0, tilt = 0.5, opacity = 0.1 }: { position: [number, number, number]; color: string; length?: number; spread?: number; speed?: number; phase?: number; tilt?: number; opacity?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * speed + phase;
    ref.current.rotation.z = Math.sin(t) * tilt;
    ref.current.rotation.x = Math.cos(t * 1.3) * tilt;
  });
  return (
    <group position={position}>
      <group ref={ref}>
        <mesh position={[0, -length / 2, 0]}>
          <coneGeometry args={[spread, length, 24, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** LED wall of equalizer bars. */
export function EqualizerWall({ position, width = 7, height = 3.2, colors = ["#7dffb2", "#ff5fa2"] }: { position: [number, number, number]; width?: number; height?: number; colors?: string[] }) {
  const n = 26;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useMemo(() => undefined, []);
  useFrame((s) => {
    const m = ref.current;
    if (!m) return;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < n; i++) {
      const h = 0.15 + (0.5 + 0.5 * Math.sin(t * (3 + rand(i) * 4) + i * 1.3)) * 0.85;
      dummy.position.set(-width / 2 + (i + 0.5) * (width / n), -height / 2 + (h * height) / 2, 0);
      dummy.scale.set(width / n - 0.05, h * height, 0.05);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, new THREE.Color(colors[i % 2]).multiplyScalar(1.5));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[width + 0.3, height + 0.3, 0.1]} />
        <meshStandardMaterial color="#0c0a18" roughness={0.6} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, n]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ---------- architecture ---------- */

/** Four-pillar wedding mandap with a tiered canopy and hanging jasmine strands. */
export function Mandap({ position = [0, 0, 0], accent = "#ffc23d", cloth = "#b3122e", flowers = "#ffb020" }: { position?: [number, number, number]; accent?: string; cloth?: string; flowers?: string }) {
  const strands = useRef<THREE.Group>(null);
  useFrame((s) => {
    strands.current?.children.forEach((c, i) => {
      c.rotation.z = Math.sin(s.clock.elapsedTime * 1.4 + i * 0.8) * 0.05;
      c.rotation.x = Math.cos(s.clock.elapsedTime * 1.1 + i) * 0.04;
    });
  });
  const H = 3.6;
  const W = 2.6;
  const gold = <meshStandardMaterial color={accent} metalness={0.7} roughness={0.3} emissive={accent} emissiveIntensity={0.15} />;
  return (
    <group position={position}>
      {/* raised platform */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[W * 2 + 0.6, 0.24, W * 2 + 0.6]} />
        <meshStandardMaterial color="#5b1020" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[W * 2 + 0.2, 0.03, W * 2 + 0.2]} />
        <meshStandardMaterial color="#f7d9a1" roughness={0.6} />
      </mesh>
      {/* pillars */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <group key={i} position={[sx * W, 0, sz * W]}>
          <mesh position={[0, H / 2 + 0.24, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.16, H, 16]} />
            {gold}
          </mesh>
          {[0.7, 1.5, 2.3, 3.1].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <torusGeometry args={[0.16, 0.03, 8, 16]} />
              <meshStandardMaterial color={flowers} roughness={0.5} emissive={flowers} emissiveIntensity={0.3} />
            </mesh>
          ))}
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.2, 16]} />
            {gold}
          </mesh>
        </group>
      ))}
      {/* canopy */}
      <mesh position={[0, H + 0.34, 0]}>
        <boxGeometry args={[W * 2 + 0.5, 0.18, W * 2 + 0.5]} />
        <meshStandardMaterial color={cloth} roughness={0.55} />
      </mesh>
      <mesh position={[0, H + 0.45, 0]}>
        <boxGeometry args={[W * 2 + 0.55, 0.035, W * 2 + 0.55]} />
        {gold}
      </mesh>
      <mesh position={[0, H + 0.86, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[W * 1.1, 0.9, 4]} />
        <meshStandardMaterial color={cloth} roughness={0.55} />
      </mesh>
      <mesh position={[0, H + 1.5, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.35, 12]} />
        {gold}
      </mesh>
      <mesh position={[0, H + 1.78, 0]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <Glow color={accent} intensity={1.6} />
      </mesh>
      {/* hanging strands along the front and back edge */}
      <group ref={strands} position={[0, H + 0.25, 0]}>
        {Array.from({ length: 14 }).map((_, i) => {
          const x = -W + 0.15 + (i % 7) * ((W * 2 - 0.3) / 6);
          const z = i < 7 ? W : -W;
          const n = 3 + Math.floor(rand(i + 3) * 4);
          return (
            <group key={i} position={[x, 0, z]}>
              {Array.from({ length: n }).map((_, k) => (
                <mesh key={k} position={[0, -0.12 - k * 0.14, 0]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshStandardMaterial color={k % 2 ? "#fffdf2" : flowers} emissive={k % 2 ? "#fffdf2" : flowers} emissiveIntensity={0.35} roughness={0.5} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>
    </group>
  );
}

/** Temple gopuram silhouette with lit windows. */
export function Gopuram({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const tiers = 8;
  return (
    <group position={position} scale={scale}>
      {Array.from({ length: tiers }).map((_, i) => {
        const w = 8 * (1 - i * 0.1);
        const d = 3.2 * (1 - i * 0.06);
        const y = i * 1.25 + 0.62;
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh castShadow>
              <boxGeometry args={[w, 1.15, d]} />
              <meshStandardMaterial color="#0c1722" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.62, 0]}>
              <boxGeometry args={[w + 0.25, 0.1, d + 0.2]} />
              <meshStandardMaterial color="#14283a" roughness={0.8} />
            </mesh>
            {Array.from({ length: Math.max(2, 6 - i) }).map((_, k, arr) => (
              <mesh key={k} position={[-w / 2 + (w / (arr.length + 1)) * (k + 1), 0.05, d / 2 + 0.01]}>
                <planeGeometry args={[0.28, 0.5]} />
                <Glow color={k % 2 ? "#ffd98a" : "#ffb347"} intensity={1.3} />
              </mesh>
            ))}
          </group>
        );
      })}
      <mesh position={[0, tiers * 1.25 + 0.7, 0]}>
        <cylinderGeometry args={[0.1, 2.4, 1.6, 4]} />
        <meshStandardMaterial color="#0c1722" roughness={0.9} />
      </mesh>
      {[-1.3, -0.45, 0.45, 1.3].map((x, i) => (
        <mesh key={i} position={[x, tiers * 1.25 + 1.65, 0]}>
          <coneGeometry args={[0.12, 0.45, 6]} />
          <meshStandardMaterial color="#14283a" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- particles ---------- */

type FallProps = {
  count?: number;
  radius?: number;
  height?: number;
  speed?: number;
  colors: string[];
  size?: number;
  shape?: "petal" | "confetti";
  seed?: number;
  position?: [number, number, number];
};

/** Instanced falling petals / confetti. */
export function Falling({ count = 80, radius = 6, height = 8, speed = 0.7, colors, size = 0.1, shape = "petal", seed = 0, position = [0, 0, 0] }: FallProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (rand(i + seed) - 0.5) * 2 * radius,
        z: (rand(i + seed + 40) - 0.5) * 2 * radius,
        o: rand(i + seed + 80),
        sp: 0.6 + rand(i + seed + 120) * 0.8,
        sw: 0.3 + rand(i + seed + 160) * 0.9,
        r: rand(i + seed + 200) * 6,
        c: new THREE.Color(colors[i % colors.length]),
      })),
    [count, radius, seed, colors],
  );
  useFrame((s) => {
    const m = ref.current;
    if (!m) return;
    const t = s.clock.elapsedTime;
    data.forEach((d, i) => {
      const u = (d.o + (t * speed * d.sp) / height) % 1;
      dummy.position.set(d.x + Math.sin(t * d.sw + d.r) * 0.5, height * (1 - u), d.z + Math.cos(t * d.sw + d.r) * 0.5);
      dummy.rotation.set(t * d.sw * 2 + d.r, t * d.sw * 1.5, t * d.sw + d.r);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, d.c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <group position={position}>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
        {shape === "petal" ? <sphereGeometry args={[size, 6, 4]} /> : <boxGeometry args={[size * 1.2, size * 0.1, size * 0.7]} />}
        <meshStandardMaterial color="#fff" roughness={0.5} side={THREE.DoubleSide} emissive="#ffffff" emissiveIntensity={0.12} />
      </instancedMesh>
    </group>
  );
}

const heartShape = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(-0.95, 0.05, -0.55, 0.85, 0, 0.35);
  s.bezierCurveTo(0.55, 0.85, 0.95, 0.05, 0, -0.5);
  return s;
})();

/** Hearts rising and fading. */
export function RisingHearts({ position = [0, 0, 0], count = 9, spread = 2, height = 4.5, colors = ["#ff5fa2", "#ffd98a", "#ffffff"] }: { position?: [number, number, number]; count?: number; spread?: number; height?: number; colors?: string[] }) {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: (rand(i) - 0.5) * spread, z: (rand(i + 9) - 0.5) * spread, o: rand(i + 20), sp: 0.5 + rand(i + 30) * 0.5, s: 0.18 + rand(i + 40) * 0.2, c: colors[i % colors.length] })), [count, spread, colors]);
  useFrame((s) => {
    ref.current?.children.forEach((ch, i) => {
      const it = items[i];
      const u = (it.o + (s.clock.elapsedTime * it.sp) / height) % 1;
      ch.position.set(it.x + Math.sin(s.clock.elapsedTime + i) * 0.25, u * height, it.z);
      const k = Math.sin(Math.PI * u);
      ch.scale.setScalar(it.s * k * 1.4);
      ch.rotation.y = s.clock.elapsedTime * 1.2 + i;
    });
  });
  return (
    <group position={position} ref={ref}>
      {items.map((it, i) => (
        <mesh key={i}>
          <extrudeGeometry args={[heartShape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }]} />
          <Glow color={it.c} intensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Rising musical notes. */
export function RisingNotes({ position = [0, 0, 0], count = 7, spread = 3, height = 4.5, color = "#ffffff" }: { position?: [number, number, number]; count?: number; spread?: number; height?: number; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: (rand(i + 2) - 0.5) * spread, o: rand(i + 7), sp: 0.4 + rand(i + 11) * 0.4 })), [count, spread]);
  useFrame((s) => {
    ref.current?.children.forEach((ch, i) => {
      const it = items[i];
      const u = (it.o + (s.clock.elapsedTime * it.sp) / height) % 1;
      ch.position.set(it.x + Math.sin(s.clock.elapsedTime * 1.2 + i) * 0.4, u * height, 0);
      ch.scale.setScalar(Math.sin(Math.PI * u) * 1.2);
      ch.rotation.y = Math.sin(s.clock.elapsedTime + i) * 0.5;
    });
  });
  return (
    <group position={position} ref={ref}>
      {items.map((_, i) => (
        <group key={i}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, -0.35]} scale={[1.3, 1, 0.8]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <Glow color={color} intensity={1.8} />
          </mesh>
          <mesh position={[0.1, 0.2, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.42, 5]} />
            <Glow color={color} intensity={1.8} />
          </mesh>
          {i % 2 === 0 && (
            <mesh position={[0.17, 0.38, 0]} rotation={[0, 0, -0.6]}>
              <boxGeometry args={[0.14, 0.04, 0.02]} />
              <Glow color={color} intensity={1.8} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Firework bursts: expanding rings of spark points that loop. */
export function Fireworks({ position = [0, 0, 0], colors = ["#ff7f96", "#ffd98a", "#ffffff"] }: { position?: [number, number, number]; colors?: string[] }) {
  const bursts = useMemo(
    () => [
      { c: [-6, 9, -8], o: 0, col: colors[0] },
      { c: [5, 11, -10], o: 1.3, col: colors[1] },
      { c: [0, 8, -12], o: 2.6, col: colors[2] },
    ],
    [colors],
  );
  const N = 46;
  const dirs = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.399963;
      out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    return out;
  }, []);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((s) => {
    bursts.forEach((b, bi) => {
      const m = refs.current[bi];
      if (!m) return;
      const u = ((s.clock.elapsedTime + b.o) % 3.9) / 3.9;
      const r = u < 0.08 ? 0 : (1 - Math.pow(1 - (u - 0.08) / 0.92, 2.2)) * 3.4;
      const fade = u < 0.08 ? 0 : Math.max(0, 1 - Math.pow((u - 0.08) / 0.92, 1.6));
      dirs.forEach((d, i) => {
        dummy.position.set(d.x * r, d.y * r - u * u * 1.4, d.z * r);
        dummy.scale.setScalar(Math.max(0.0001, fade * (0.8 + Math.sin(s.clock.elapsedTime * 20 + i) * 0.2)));
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    });
  });
  return (
    <group position={position}>
      {bursts.map((b, i) => (
        <group key={i} position={b.c as [number, number, number]}>
          <instancedMesh ref={(el) => {
            refs.current[i] = el;
          }} args={[undefined, undefined, N]} frustumCulled={false}>
            <sphereGeometry args={[0.09, 6, 6]} />
            <Glow color={b.col} intensity={3} />
          </instancedMesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- crowd ---------- */

/** Instanced silhouette crowd with raised arms and glowing phones. */
export function Crowd({ radius = 6.2, inner = 4.2, count = 22, arc = [Math.PI * 0.12, Math.PI * 0.88], tint = "#140a24", seed = 0, phones = true, arms = true }: { radius?: number; inner?: number; count?: number; arc?: [number, number]; tint?: string; seed?: number; phones?: boolean; arms?: boolean }) {
  const body = useRef<THREE.InstancedMesh | null>(null);
  const head = useRef<THREE.InstancedMesh | null>(null);
  const armL = useRef<THREE.InstancedMesh | null>(null);
  const armR = useRef<THREE.InstancedMesh | null>(null);
  const phone = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const people = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = arc[0] + (arc[1] - arc[0]) * ((i + rand(i + seed) * 0.6) / count);
        const r = inner + rand(i + seed + 3) * (radius - inner);
        return {
          x: Math.cos(a) * r * 1.0,
          z: Math.sin(a) * r * 0.3 + 1.6,
          s: 0.78 + rand(i + seed + 6) * 0.2,
          o: rand(i + seed + 9) * 6,
          sp: 3 + rand(i + seed + 12) * 3,
          armL: arms && rand(i + seed + 15) > 0.3,
          armR: arms && rand(i + seed + 18) > 0.3,
          phone: phones && rand(i + seed + 21) > 0.55,
          shade: 0.7 + rand(i + seed + 24) * 0.6,
        };
      }),
    [count, arc, radius, inner, seed, phones, arms],
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    people.forEach((p, i) => {
      const bob = Math.abs(Math.sin(t * p.sp * 0.5 + p.o)) * 0.08;
      const yaw = Math.atan2(-p.x, -p.z + 6) * 0.2;
      const set = (m: THREE.InstancedMesh | null, px: number, py: number, pz: number, rx: number, rz: number, sx: number, sy: number, sz: number) => {
        if (!m) return;
        dummy.position.set(p.x + px * p.s, py * p.s + bob, p.z + pz);
        dummy.rotation.set(rx, yaw, rz);
        dummy.scale.set(sx * p.s, sy * p.s, sz * p.s);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
      };
      set(body.current, 0, 0.62, 0, 0, 0, 1, 1, 0.75);
      set(head.current, 0, 1.35, 0, 0, 0, 1, 1, 1);
      const w = Math.sin(t * p.sp + p.o);
      set(armL.current, -0.3, p.armL ? 1.3 : 0.7, 0, 0, p.armL ? 0.35 + w * 0.3 : 0.1, 1, p.armL ? 1 : 0.8, 1);
      set(armR.current, 0.3, p.armR ? 1.3 : 0.7, 0, 0, p.armR ? -0.35 - w * 0.3 : -0.1, 1, p.armR ? 1 : 0.8, 1);
      set(phone.current, p.phone ? 0.42 : 0, p.phone ? 1.85 : -5, 0.05, 0, 0, 1, 1, 1);
    });
    [body, head, armL, armR, phone].forEach((m) => {
      if (m.current) m.current.instanceMatrix.needsUpdate = true;
    });
  });
  useMemo(() => undefined, []);
  const col = (i: number) => new THREE.Color(tint).multiplyScalar(people[i].shade);
  const setColors = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    people.forEach((_, i) => m.setColorAt(i, col(i)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };
  return (
    <group>
      <instancedMesh ref={(m) => { body.current = m; setColors(m); }} args={[undefined, undefined, count]} frustumCulled={false}>
        <capsuleGeometry args={[0.2, 0.7, 4, 10]} />
        <meshStandardMaterial color="#fff" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={(m) => { head.current = m; setColors(m); }} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.15, 12, 10]} />
        <meshStandardMaterial color="#fff" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={(m) => { armL.current = m; setColors(m); }} args={[undefined, undefined, count]} frustumCulled={false}>
        <capsuleGeometry args={[0.055, 0.55, 3, 6]} />
        <meshStandardMaterial color="#fff" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={(m) => { armR.current = m; setColors(m); }} args={[undefined, undefined, count]} frustumCulled={false}>
        <capsuleGeometry args={[0.055, 0.55, 3, 6]} />
        <meshStandardMaterial color="#fff" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={phone} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[0.09, 0.16, 0.02]} />
        <meshStandardMaterial color="#fff6c8" emissive="#fff6c8" emissiveIntensity={2.4} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** Convenience wrapper: round floating platform used by every diorama. */
export function Platform({ radius = 8, ring = "#ffd23f", top = "#1a1030", side = "#0d0820", children }: { radius?: number; ring?: string; top?: string; side?: string; children?: ReactNode }) {
  return (
    <group>
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.7, 64]} />
        <meshStandardMaterial color={top} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, -1.9, 0]}>
        <cylinderGeometry args={[radius * 0.98, radius * 0.45, 2.4, 48]} />
        <meshStandardMaterial color={side} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.07, 10, 96]} />
        <Glow color={ring} intensity={2.2} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.72, radius * 0.725, 96]} />
        <meshBasicMaterial color={ring} transparent opacity={0.35} />
      </mesh>
      {children}
    </group>
  );
}
