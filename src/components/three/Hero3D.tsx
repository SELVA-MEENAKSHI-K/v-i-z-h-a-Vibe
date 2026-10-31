"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Figure } from "./Figure";
import {
  Beam,
  Bunting,
  Cake,
  Crowd,
  DiscoBall,
  Diya,
  EqualizerWall,
  FairyLights,
  Falling,
  Fireworks,
  Flame,
  FlowerRing,
  GarlandCycle,
  Gift,
  Glow,
  Gopuram,
  Guitar,
  KuthuVilakku,
  Mandap,
  Mic,
  Platform,
  RingBox,
  RisingHearts,
  RisingNotes,
  Speaker,
  Balloon,
} from "./props";

/**
 * Hero 3D showcase. Five floating dioramas sit in a row; the camera glides
 * between them (with an arc and a little roll while it travels), drifts slowly
 * on its own, and parallaxes with the pointer. Sky, fog and key light take the
 * colour of the active scene. Everything is procedural: no model or texture
 * downloads.
 */

export type Quality = "high" | "low";

const SPACING = 30;

type CamPreset = { pos: [number, number, number]; look: [number, number, number]; fov: number };
const CAMS: CamPreset[] = [
  { pos: [0, 2.7, 8.8], look: [0, 1.7, 0], fov: 50 }, // dance
  { pos: [0.2, 2.7, 9.4], look: [0, 2.0, -0.6], fov: 50 }, // music
  { pos: [0, 2.3, 7.9], look: [0, 1.7, -0.1], fov: 50 }, // wedding
  { pos: [-0.3, 2.1, 6.9], look: [0, 1.55, 0.5], fov: 50 }, // proposal
  { pos: [0, 2.6, 8.4], look: [0, 1.55, 0.4], fov: 50 }, // birthday
];

const LOOK = {
  sky: ["#2b0720", "#0e0a3a", "#2e0710", "#04101a", "#7c2f10"],
  fog: ["#3a0a2b", "#171056", "#3d0b14", "#071a29", "#a2441a"],
  key: ["#ffd9ec", "#cfd2ff", "#ffe2b8", "#cfe8ff", "#fff0dc"],
  glowA: ["#ffd23f", "#7dffb2", "#ffc23d", "#ff7f96", "#0fd5c0"],
  glowB: ["#4df0e0", "#ff5fa2", "#ff8a3d", "#ffd98a", "#ffd23f"],
  ring: ["#ffd23f", "#7dffb2", "#ffc23d", "#ff7f96", "#0fd5c0"],
  top: ["#2a0a30", "#171046", "#3a0c16", "#0b1c2a", "#a8421a"],
  side: ["#14061c", "#0a0726", "#1d060c", "#050d16", "#5a2108"],
};

/* ---------------------------------------------------------------- camera */

function CameraRig({ scene }: { scene: number }) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(...CAMS[0].pos));
  const look = useRef(new THREE.Vector3(...CAMS[0].look));
  const cx = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const p = CAMS[scene];
    const px = state.pointer.x;
    const py = state.pointer.y;
    const targetX = scene * SPACING;
    cx.current = THREE.MathUtils.damp(cx.current, targetX, 2.1, d);
    const dist = Math.abs(targetX - cx.current);
    const flight = Math.min(dist / SPACING, 1);
    const lift = Math.sin(flight * Math.PI) * 3.4;

    const drift = Math.sin(t * 0.22) * 1.3;
    const want = tmp.set(
      p.pos[0] + drift + px * 1.8,
      p.pos[1] + py * 0.55 + Math.sin(t * 0.31) * 0.25,
      p.pos[2] + Math.cos(t * 0.17) * 0.5,
    );
    pos.current.x = THREE.MathUtils.damp(pos.current.x, want.x, 2.4, d);
    pos.current.y = THREE.MathUtils.damp(pos.current.y, want.y, 2.4, d);
    pos.current.z = THREE.MathUtils.damp(pos.current.z, want.z, 2.4, d);
    look.current.x = THREE.MathUtils.damp(look.current.x, p.look[0] + px * 0.4, 2.8, d);
    look.current.y = THREE.MathUtils.damp(look.current.y, p.look[1], 2.8, d);
    look.current.z = THREE.MathUtils.damp(look.current.z, p.look[2], 2.8, d);

    camera.position.set(cx.current + pos.current.x, pos.current.y + lift, pos.current.z + flight * 4);
    camera.lookAt(cx.current + look.current.x, look.current.y, look.current.z);
    // a touch of roll while travelling
    camera.rotateZ(Math.sin(flight * Math.PI) * Math.sign(targetX - cx.current) * -0.045);
    const cam = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.damp(cam.fov, p.fov + flight * 6, 3, d);
    if (Math.abs(fov - cam.fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

/** Sky, fog and light colours ease toward the active scene. */
function Atmosphere({ scene, quality }: { scene: number; quality: Quality }) {
  const { scene: three } = useThree();
  const key = useRef<THREE.DirectionalLight>(null);
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  const colors = useMemo(
    () => ({
      sky: LOOK.sky.map((c) => new THREE.Color(c)),
      fog: LOOK.fog.map((c) => new THREE.Color(c)),
      key: LOOK.key.map((c) => new THREE.Color(c)),
      a: LOOK.glowA.map((c) => new THREE.Color(c)),
      b: LOOK.glowB.map((c) => new THREE.Color(c)),
    }),
    [],
  );
  const target = useRef(new THREE.Vector3());
  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 2.2);
    if (!(three.background instanceof THREE.Color)) three.background = new THREE.Color(LOOK.sky[0]);
    three.background.lerp(colors.sky[scene], k);
    if (!three.fog) three.fog = new THREE.Fog(LOOK.fog[0], 22, 80);
    (three.fog as THREE.Fog).color.lerp(colors.fog[scene], k);
    key.current?.color.lerp(colors.key[scene], k);
    a.current?.color.lerp(colors.a[scene], k);
    b.current?.color.lerp(colors.b[scene], k);
    const cx = state.camera.position.x;
    const fx = THREE.MathUtils.damp(target.current.x, scene * SPACING, 2.1, Math.min(dt, 0.05));
    target.current.x = fx;
    if (key.current) {
      key.current.position.set(fx + 8, 14, 10);
      key.current.target.position.set(fx, 0, 0);
      key.current.target.updateMatrixWorld();
    }
    if (a.current) a.current.position.set(fx - 5, 3.2, 4);
    if (b.current) b.current.position.set(fx + 5, 3.8, 3);
    void cx;
  });
  return (
    <>
      <hemisphereLight args={["#ffffff", "#2a1840", 0.55]} />
      <directionalLight
        ref={key}
        intensity={1.25}
        castShadow={quality === "high"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0006}
      />
      <pointLight ref={a} intensity={55} distance={26} decay={2} />
      <pointLight ref={b} intensity={45} distance={26} decay={2} />
    </>
  );
}

/* --------------------------------------------------------------- stations */

function Tiles({ colors }: { colors: string[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cells = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    const n = 11;
    const s = 0.82;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x = (i - (n - 1) / 2) * s;
        const z = (j - (n - 1) / 2) * s;
        if (Math.hypot(x, z) < 4.2) out.push({ x, z });
      }
    return out;
  }, []);
  const cols = useMemo(() => colors.map((c) => new THREE.Color(c)), [colors]);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame((s) => {
    const m = ref.current;
    if (!m) return;
    const t = s.clock.elapsedTime * 1.6;
    cells.forEach((c, i) => {
      dummy.position.set(c.x, 0.015, c.z);
      dummy.scale.set(0.76, 0.03, 0.76);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const w = 0.5 + 0.5 * Math.sin(t + Math.hypot(c.x, c.z) * 1.1 + c.x * 0.6);
      const ci = Math.floor((t * 0.5 + Math.hypot(c.x, c.z) * 0.35) % cols.length);
      tmp.copy(cols[ci]).multiplyScalar(0.18 + w * 1.5);
      m.setColorAt(i, tmp);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
}

function DanceStation({ q }: { q: Quality }) {
  const hi = q === "high";
  return (
    <Platform ring={LOOK.ring[0]} top={LOOK.top[0]} side={LOOK.side[0]}>
      <Tiles colors={["#ffd23f", "#4df0e0", "#ff5fa2", "#a78bff"]} />
      <DiscoBall position={[0, 5.4, 0]} radius={0.75} />
      <Beam position={[0, 5.4, 0]} color="#4df0e0" length={6} spread={1.6} speed={0.55} phase={0} tilt={0.55} />
      <Beam position={[0, 5.4, 0]} color="#ffd23f" length={6} spread={1.4} speed={0.7} phase={2} tilt={0.5} />
      <Beam position={[0, 5.4, 0]} color="#ff5fa2" length={6} spread={1.5} speed={0.45} phase={4} tilt={0.6} />
      <Figure gender="f" position={[-1.35, 0, 0.5]} rotationY={0.3} outfit="dress" hairStyle="long" skin="#c98f63" hair="#150d0b" c1="#ffd23f" c2="#12c9bb" c3="#fff4fa" shoe="#ffd23f" pose="dance" speed={1} />
      <Figure gender="m" position={[1.35, 0, 0.2]} rotationY={-0.3} outfit="kurta" skin="#a8693f" hair="#120c0a" c1="#fff4fa" c2="#2a0a1c" c3="#ffd23f" shoe="#fff4fa" mustache pose="dance2" phase={1.3} />
      <Figure gender="f" position={[-2.7, 0, -1.4]} rotationY={0.5} outfit="saree" skin="#b9784c" hair="#0f0a0a" c1="#ff5fa2" c2="#6d28d9" c3="#ffd23f" shoe="#ffd23f" pose="cheer" phase={0.6} />
      <Figure gender="m" position={[2.7, 0, -1.6]} rotationY={-0.5} outfit="suit" skin="#9a603a" hair="#0d0807" c1="#1a1033" c2="#1a1033" c3="#ff5fa2" shoe="#111" pose="dance" phase={2.1} speed={0.9} />
      <Speaker position={[-4.4, 0, -2.4]} rotationY={0.7} scale={1.1} />
      <Speaker position={[4.4, 0, -2.4]} rotationY={-0.7} scale={1.1} />
      <Crowd count={hi ? 16 : 9} seed={3} tint="#2a1048" />
      <Sparkles count={hi ? 60 : 24} scale={[12, 6, 8]} position={[0, 3, 0]} size={4} speed={0.5} color="#fff4fa" />
    </Platform>
  );
}

function MusicStation({ q }: { q: Quality }) {
  const hi = q === "high";
  return (
    <Platform ring={LOOK.ring[1]} top={LOOK.top[1]} side={LOOK.side[1]}>
      {/* raised stage */}
      <mesh position={[0, 0.25, -0.4]} receiveShadow castShadow>
        <cylinderGeometry args={[5.2, 5.4, 0.5, 48]} />
        <meshStandardMaterial color="#120b3a" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.51, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.6, 4.72, 64]} />
        <Glow color="#ff5fa2" intensity={2.2} />
      </mesh>
      <EqualizerWall position={[0, 3.4, -4.6]} width={6.6} height={4} />
      {[-3.4, -1.7, 0, 1.7, 3.4].map((x, i) => (
        <Beam key={i} position={[x, 6.4, -2]} color={i % 2 ? "#ff5fa2" : "#7dffb2"} length={6.2} spread={0.9} speed={0.6 + i * 0.1} phase={i * 1.3} tilt={0.4} opacity={0.13} />
      ))}
      <mesh position={[0, 6.4, -2]}>
        <boxGeometry args={[9, 0.12, 0.12]} />
        <meshStandardMaterial color="#2a2450" metalness={0.8} roughness={0.3} />
      </mesh>
      <Speaker position={[-3.9, 0.5, -1.8]} rotationY={0.5} scale={1.05} />
      <Speaker position={[3.9, 0.5, -1.8]} rotationY={-0.5} scale={1.05} />
      <Figure gender="f" position={[-1.3, 0.5, 0.2]} rotationY={0.35} outfit="dress" hairStyle="long" skin="#b9784c" hair="#0f0a0a" c1="#101028" c2="#7dffb2" c3="#ff5fa2" shoe="#ff5fa2" pose="sing" propR={<Mic />} />
      <Figure gender="m" position={[1.5, 0.5, -0.2]} rotationY={-0.4} outfit="kurta" skin="#9a603a" hair="#0d0807" c1="#f1eeff" c2="#1a1440" c3="#7dffb2" shoe="#7dffb2" mustache pose="guitar" phase={0.4}>
        <Guitar />
      </Figure>
      <RisingNotes position={[0, 1.6, 0.6]} count={7} spread={5} height={4.2} color="#e6fff0" />
      <Crowd count={hi ? 20 : 10} seed={9} tint="#1a1260" arms />
      <Sparkles count={hi ? 50 : 20} scale={[12, 6, 8]} position={[0, 3, 0]} size={4} speed={0.4} color="#bfffe0" />
    </Platform>
  );
}

function WeddingStation({ q }: { q: Quality }) {
  const hi = q === "high";
  const petals = useMemo(() => ["#ffb020", "#ff6a3d", "#fff1dd", "#ff9ab0"], []);
  const rangoli = useMemo(() => {
    const out: { x: number; z: number; c: string; r: number }[] = [];
    const cols = ["#ffd23f", "#ff5a8a", "#fff6e6", "#4df0e0"];
    for (let ring = 0; ring < 3; ring++) {
      const n = 10 + ring * 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = 0.7 + ring * 0.55;
        out.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, c: cols[(i + ring) % cols.length], r: 0.09 - ring * 0.012 });
      }
    }
    return out;
  }, []);
  return (
    <Platform ring={LOOK.ring[2]} top={LOOK.top[2]} side={LOOK.side[2]}>
      <group position={[0, 0, -0.9]} scale={0.74}>
        <Mandap />
      </group>
      <Figure gender="f" position={[-0.55, 0.2, 0.3]} rotationY={1.15} outfit="saree" hairStyle="braid" skin="#c68a5e" hair="#120b0a" c1="#c2185b" c2="#0f8f6b" c3="#ffc23d" shoe="#ffc23d" pose="garland-give" />
      <Figure gender="m" position={[0.55, 0.2, 0.3]} rotationY={-1.15} outfit="veshti" skin="#a8693f" hair="#120c0a" c1="#fff1dd" c2="#fffaf0" c3="#ffc23d" shoe="#7a3b12" mustache tilak pose="garland-take" phase={0.3} />
      <group position={[-0.55, 1.63, 0.3]}>
        <FlowerRing radius={0.2} />
      </group>
      <GarlandCycle position={[0.55, 1.65, 0.3]} />
      <KuthuVilakku position={[-2.9, 0, 2.2]} scale={1.0} seed={1} />
      <KuthuVilakku position={[2.9, 0, 2.2]} scale={1.0} seed={9} />
      <Figure gender="f" position={[-2.5, 0, 3.4]} rotationY={0.45} outfit="saree" hairStyle="bun" skin="#b9784c" hair="#2a1a14" c1="#ffd23f" c2="#7c3aed" c3="#fff1dd" shoe="#ffc23d" pose="clap" phase={0.5} />
      <Figure gender="m" position={[2.5, 0, 3.4]} rotationY={-0.45} outfit="kurta" skin="#a8693f" hair="#120c0a" c1="#fff1dd" c2="#fff1dd" c3="#ffc23d" shoe="#7a3b12" pose="clap" phase={1.7} />
      {/* rangoli */}
      <group position={[0, 0.02, 3.6]}>
        {rangoli.map((d, i) => (
          <mesh key={i} position={[d.x, 0, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[d.r, 10]} />
            <meshStandardMaterial color={d.c} emissive={d.c} emissiveIntensity={0.35} />
          </mesh>
        ))}
      </group>
      <Diya position={[-1.2, 0.02, 4.6]} seed={2} />
      <Diya position={[1.2, 0.02, 4.6]} seed={5} />
      <Falling count={hi ? 70 : 30} radius={6} height={8} colors={petals} size={0.09} seed={11} />
      <Sparkles count={hi ? 36 : 16} scale={[10, 5, 8]} position={[0, 3, 0]} size={5} speed={0.35} color="#ffe2a0" />
    </Platform>
  );
}

function HeartOfCandles() {
  const pts = useMemo(() => {
    const out: [number, number][] = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      out.push([x * 0.2, -y * 0.2]);
    }
    return out;
  }, []);
  return (
    <group position={[0, 0, 0.8]}>
      {pts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.18, 8]} />
            <meshStandardMaterial color="#fff4e0" roughness={0.6} />
          </mesh>
          <Flame position={[0, 0.18, 0]} size={0.8} seed={i} />
        </group>
      ))}
    </group>
  );
}

function ProposalStation({ q }: { q: Quality }) {
  const hi = q === "high";
  return (
    <Platform ring={LOOK.ring[3]} top={LOOK.top[3]} side={LOOK.side[3]}>
      {/* city silhouette */}
      <Gopuram position={[0, -1, -18]} scale={1.15} />
      <Gopuram position={[-11, -1, -16]} scale={0.7} />
      <Gopuram position={[10, -1, -15]} scale={0.55} />
      <mesh position={[9, 9, -20]}>
        <sphereGeometry args={[2.2, 24, 20]} />
        <Glow color="#ffe3a0" intensity={1.6} />
      </mesh>
      <Fireworks colors={["#ff7f96", "#ffd98a", "#e8f4ff"]} />
      <FairyLights from={[-5.6, 5.4, -2]} to={[5.6, 5.4, -2]} sag={1.5} count={26} colors={["#ffd98a", "#ff9ab0"]} />
      <FairyLights from={[-5.6, 4.2, 3.0]} to={[5.6, 4.2, 3.0]} sag={1.1} count={26} colors={["#ff9ab0", "#ffd98a"]} />
      <HeartOfCandles />
      <Figure gender="m" position={[-1.2, 0, 0.9]} rotationY={1.3} outfit="suit" skin="#b0764a" hair="#0e0a09" c1="#eee7da" c2="#1a1f2e" c3="#ff7f96" shoe="#111" mustache pose="kneel-propose" propR={<RingBox />} />
      <Figure gender="f" position={[1.35, 0, 0.9]} rotationY={-1.35} outfit="dress" hairStyle="long" skin="#c98f63" hair="#140c0b" c1="#ff7f96" c2="#ffb3c1" c3="#ffd98a" shoe="#ffd98a" pose="hands-to-face" />
      <RisingHearts position={[0.2, 0.8, 0.6]} count={9} spread={3} height={5} />
      <Sparkles count={hi ? 60 : 24} scale={[14, 7, 10]} position={[0, 3, 0]} size={5} speed={0.3} color="#ffe6c0" />
    </Platform>
  );
}

function BirthdayStation({ q }: { q: Quality }) {
  const hi = q === "high";
  const conf = useMemo(() => ["#ffffff", "#0fd5c0", "#ffd23f", "#ff3d7f", "#fff4e8"], []);
  const balloons: { p: [number, number, number]; c: string; s: number; ph: number }[] = [
    { p: [-3.5, 0, -0.5], c: "#0fd5c0", s: 2.6, ph: 0 },
    { p: [-3.0, 0, 1.5], c: "#fff4e8", s: 3.1, ph: 1.2 },
    { p: [-3.9, 0, 2.1], c: "#ffd23f", s: 2.2, ph: 2 },
    { p: [3.5, 0, -0.4], c: "#ff3d7f", s: 2.8, ph: 0.6 },
    { p: [3.0, 0, 1.6], c: "#0fd5c0", s: 2.3, ph: 1.8 },
    { p: [3.9, 0, 2.2], c: "#fff4e8", s: 3.2, ph: 2.7 },
  ];
  return (
    <Platform ring={LOOK.ring[4]} top={LOOK.top[4]} side={LOOK.side[4]}>
      <Bunting from={[-5.2, 5.2, -2.5]} to={[5.2, 5.2, -2.5]} sag={1.0} count={13} colors={["#fff4e8", "#0fd5c0", "#ffd23f", "#ff3d7f"]} />
      <Bunting from={[-5.4, 4.3, 2.6]} to={[5.4, 4.3, 2.6]} sag={0.8} count={13} colors={["#ffd23f", "#ff3d7f", "#fff4e8", "#0fd5c0"]} />
      {/* table */}
      <group position={[0, 0, -0.3]}>
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.7, 1.7, 0.1, 40]} />
          <meshStandardMaterial color="#fff4e8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.5, 0.8, 16]} />
          <meshStandardMaterial color="#fff4e8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.76, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.7, 0.05, 8, 40]} />
          <meshStandardMaterial color="#0fd5c0" roughness={0.5} />
        </mesh>
        <Cake position={[0, 0.85, 0]} accent="#ff3d7f" candles={3} />
      </group>
      <Gift position={[-1.9, 0, 2.6]} size={0.5} color="#0fd5c0" rotY={0.4} />
      <Gift position={[2.0, 0, 2.7]} size={0.6} color="#ffd23f" ribbon="#ff3d7f" rotY={-0.3} />
      <Gift position={[2.7, 0, 3.4]} size={0.38} color="#ff3d7f" rotY={0.7} />
      {balloons.map((b, i) => (
        <Balloon key={i} position={b.p} color={b.c} string={b.s} phase={b.ph} />
      ))}
      <Figure gender="f" kid position={[-0.95, 0, 1.5]} rotationY={0.5} outfit="dress" hairStyle="pigtails" skin="#d49a6e" hair="#120b0a" c1="#ff3d7f" c2="#ffd23f" c3="#fff4e8" shoe="#fff4e8" pose="blow" />
      <Figure gender="f" position={[-2.15, 0, 0.7]} rotationY={0.6} outfit="saree" hairStyle="braid" skin="#c68a5e" hair="#120b0a" c1="#ffd23f" c2="#0a8f86" c3="#fff4e8" shoe="#fff4e8" pose="clap" phase={0.3} />
      <Figure gender="m" position={[2.15, 0, 0.7]} rotationY={-0.6} outfit="kurta" skin="#a8693f" hair="#120c0a" c1="#fff4e8" c2="#1a1033" c3="#0fd5c0" shoe="#1a1033" mustache pose="clap" phase={1.1} />
      <Falling count={hi ? 70 : 30} radius={6.5} height={9} colors={conf} size={0.12} shape="confetti" seed={4} speed={0.9} />
      <Sparkles count={hi ? 40 : 16} scale={[12, 6, 8]} position={[0, 3, 0]} size={5} speed={0.4} color="#fff4e8" />
    </Platform>
  );
}

/* ------------------------------------------------------------------ root */

function World({ scene, quality }: { scene: number; quality: Quality }) {
  return (
    <>
      <CameraRig scene={scene} />
      <Atmosphere scene={scene} quality={quality} />
      <Stars radius={110} depth={50} count={quality === "high" ? 900 : 400} factor={4} saturation={0} fade speed={0.6} />
      {[DanceStation, MusicStation, WeddingStation, ProposalStation, BirthdayStation].map((S, i) => (
        <group key={i} position={[i * SPACING, 0, 0]}>
          <S q={quality} />
        </group>
      ))}
    </>
  );
}

export type Hero3DProps = {
  scene: number;
  paused?: boolean;
  quality?: Quality;
  onReady?: () => void;
};

export default function Hero3D({ scene, paused = false, quality = "high", onReady }: Hero3DProps) {
  return (
    <Canvas
      className="!h-full !w-full"
      frameloop={paused ? "never" : "always"}
      shadows={quality === "high"}
      dpr={quality === "high" ? [1, 1.6] : [1, 1.2]}
      camera={{ fov: 50, near: 0.1, far: 220, position: [0, 3.1, 10.2] }}
      gl={{ antialias: quality === "high", powerPreference: "high-performance", alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
        // wait one frame so the first paint already has content
        requestAnimationFrame(() => onReady?.());
      }}
    >
      <color attach="background" args={[LOOK.sky[0]]} />
      <fog attach="fog" args={[LOOK.fog[0], 22, 80]} />
      <Suspense fallback={null}>
        <World scene={scene} quality={quality} />
      </Suspense>
      {quality === "high" && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.82} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette offset={0.25} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
