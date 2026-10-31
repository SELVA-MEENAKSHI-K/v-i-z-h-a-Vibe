"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A stylised, fully articulated 3D person: head, neck, torso, two-bone arms and
 * legs, hair, face, jewellery and regional outfits (saree, veshti, kurta, suit,
 * dress). Animation is procedural (see `applyPose`), so the same figure can
 * dance, sing, strum, clap, kneel, exchange garlands, and so on.
 *
 * Units are metres, the figure faces +Z, and the origin is between the feet.
 */

export type PoseName =
  | "idle"
  | "dance"
  | "dance2"
  | "sing"
  | "guitar"
  | "garland-give"
  | "garland-take"
  | "kneel-propose"
  | "hands-to-face"
  | "clap"
  | "cheer"
  | "blow";

export type Outfit = "saree" | "dress" | "kurta" | "veshti" | "suit";
export type HairStyle = "braid" | "bun" | "long" | "short" | "pigtails";

export type FigureProps = {
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
  gender?: "f" | "m";
  kid?: boolean;
  skin?: string;
  hair?: string;
  hairStyle?: HairStyle;
  outfit?: Outfit;
  /** Top / blouse / shirt colour. */
  c1?: string;
  /** Skirt / saree / trousers colour. */
  c2?: string;
  /** Trim / border / accent colour. */
  c3?: string;
  shoe?: string;
  pose?: PoseName;
  phase?: number;
  speed?: number;
  mustache?: boolean;
  tilak?: boolean;
  /** Held in the right / left hand. */
  propR?: ReactNode;
  propL?: ReactNode;
  /** Extra children attached to the body root (e.g. a guitar). */
  children?: ReactNode;
};

type Joints = {
  root: THREE.Object3D;
  hips: THREE.Object3D;
  chest: THREE.Object3D;
  head: THREE.Object3D;
  mouth: THREE.Object3D;
  braid: THREE.Object3D | null;
  skirt: THREE.Object3D | null;
  shL: THREE.Object3D;
  shR: THREE.Object3D;
  elL: THREE.Object3D;
  elR: THREE.Object3D;
  thL: THREE.Object3D;
  thR: THREE.Object3D;
  knL: THREE.Object3D;
  knR: THREE.Object3D;
};

const S = Math.sin;
const C = Math.cos;
const pos = (v: number) => Math.max(0, v);

function reset(j: Joints) {
  j.root.position.set(0, 0, 0);
  j.root.rotation.set(0, 0, 0);
  j.hips.rotation.set(0, 0, 0);
  j.chest.rotation.set(0, 0, 0);
  j.head.rotation.set(0, 0, 0);
  j.mouth.scale.set(1, 1, 1);
  for (const k of ["shL", "shR", "elL", "elR", "thL", "thR", "knL", "knR"] as const) j[k].rotation.set(0, 0, 0);
}

/** Left side is -X, right side is +X. Positive z-rotation swings an arm toward +X. */
function applyPose(pose: PoseName, t: number, j: Joints) {
  reset(j);
  switch (pose) {
    case "dance": {
      const w = t * 5.4;
      j.root.position.y = Math.abs(S(w)) * 0.07;
      j.hips.rotation.y = S(w * 0.5) * 0.35;
      j.hips.rotation.z = S(w) * 0.06;
      j.chest.rotation.y = -S(w * 0.5) * 0.25;
      j.shL.rotation.z = -(2.45 + S(w) * 0.5);
      j.shR.rotation.z = 2.45 + S(w + Math.PI) * 0.5;
      j.shL.rotation.x = -0.15 + S(w * 0.5) * 0.3;
      j.shR.rotation.x = -0.15 - S(w * 0.5) * 0.3;
      j.elL.rotation.x = -0.35 - pos(S(w)) * 0.5;
      j.elR.rotation.x = -0.35 - pos(-S(w)) * 0.5;
      j.thL.rotation.x = -pos(S(w)) * 0.55;
      j.knL.rotation.x = pos(S(w)) * 0.9;
      j.thR.rotation.x = -pos(-S(w)) * 0.55;
      j.knR.rotation.x = pos(-S(w)) * 0.9;
      j.head.rotation.z = S(w * 0.5) * 0.12;
      j.mouth.scale.y = 1.6;
      break;
    }
    case "dance2": {
      const w = t * 4.6;
      j.root.position.y = Math.abs(S(w)) * 0.09;
      j.hips.rotation.y = S(w) * 0.45;
      j.chest.rotation.y = -S(w) * 0.3;
      j.shL.rotation.z = -(1.1 + S(w) * 0.9);
      j.shR.rotation.z = 1.1 - S(w) * 0.9;
      j.shL.rotation.x = -0.9;
      j.shR.rotation.x = -0.9;
      j.elL.rotation.x = -0.9 - S(w) * 0.5;
      j.elR.rotation.x = -0.9 + S(w) * 0.5;
      j.thL.rotation.x = -pos(S(w + 1)) * 0.5;
      j.knL.rotation.x = pos(S(w + 1)) * 0.8;
      j.thR.rotation.x = -pos(-S(w + 1)) * 0.5;
      j.knR.rotation.x = pos(-S(w + 1)) * 0.8;
      j.head.rotation.y = S(w) * 0.25;
      break;
    }
    case "sing": {
      j.root.rotation.z = S(t * 1.2) * 0.05;
      j.root.position.y = Math.abs(S(t * 2.4)) * 0.015;
      j.shR.rotation.x = -1.3;
      j.shR.rotation.z = 0.25;
      j.elR.rotation.x = -1.55;
      j.shL.rotation.z = -(0.9 + S(t * 1.6) * 0.55);
      j.shL.rotation.x = -0.25 + S(t * 1.6 + 1) * 0.3;
      j.elL.rotation.x = -0.4;
      j.head.rotation.x = -0.08 + S(t * 2) * 0.05;
      j.head.rotation.z = S(t * 1.2) * 0.08;
      j.mouth.scale.y = 0.6 + Math.abs(S(t * 6.5)) * 1.6;
      break;
    }
    case "guitar": {
      j.root.rotation.z = S(t * 1.6) * 0.04;
      j.root.position.y = Math.abs(S(t * 3.2)) * 0.02;
      j.shL.rotation.x = -0.85;
      j.shL.rotation.z = -0.2;
      j.elL.rotation.x = -0.95;
      j.shR.rotation.x = -0.65;
      j.shR.rotation.z = 0.12;
      j.elR.rotation.x = -0.95 + S(t * 9) * 0.26;
      j.head.rotation.x = 0.12 + S(t * 3.2) * 0.07;
      j.head.rotation.y = -0.2;
      j.thR.rotation.x = -0.5 + S(t * 3.2) * 0.06;
      j.knR.rotation.x = 0.5;
      break;
    }
    case "garland-give": {
      // Holding a garland up, then lowering it over the partner's head.
      const u = S(t * 0.7) * 0.5 + 0.5;
      j.root.position.y = Math.abs(S(t * 1.4)) * 0.01;
      j.shL.rotation.x = -1.05 - u * 0.25;
      j.shR.rotation.x = -1.05 - u * 0.25;
      j.shL.rotation.z = -0.35 + u * 0.15;
      j.shR.rotation.z = 0.35 - u * 0.15;
      j.elL.rotation.x = -0.8 - u * 0.4;
      j.elR.rotation.x = -0.8 - u * 0.4;
      j.head.rotation.x = 0.05 + u * 0.12;
      j.chest.rotation.x = u * 0.1;
      break;
    }
    case "garland-take": {
      const u = S(t * 0.7 - 0.5) * 0.5 + 0.5;
      j.root.position.y = Math.abs(S(t * 1.4)) * 0.01;
      j.head.rotation.x = 0.28 * u;
      j.chest.rotation.x = 0.16 * u;
      j.shL.rotation.x = -0.18;
      j.shR.rotation.x = -0.18;
      j.shL.rotation.z = -0.08;
      j.shR.rotation.z = 0.08;
      j.elL.rotation.x = -0.35;
      j.elR.rotation.x = -0.35;
      break;
    }
    case "kneel-propose": {
      j.root.position.y = -0.4;
      j.root.position.z = 0.04;
      j.thL.rotation.x = -1.45;
      j.knL.rotation.x = 1.45;
      j.thR.rotation.x = 0.2;
      j.knR.rotation.x = 1.37;
      j.chest.rotation.x = 0.04;
      j.shR.rotation.x = -1.4 + S(t * 1.4) * 0.05;
      j.shR.rotation.z = 0.12;
      j.elR.rotation.x = -0.15;
      j.shL.rotation.x = -0.55;
      j.elL.rotation.x = -0.9;
      j.head.rotation.x = -0.1;
      j.head.rotation.y = 0.08 * S(t * 0.8);
      break;
    }
    case "hands-to-face": {
      j.root.position.y = Math.abs(S(t * 2.2)) * 0.03;
      j.root.rotation.z = S(t * 1.5) * 0.03;
      j.shL.rotation.x = -0.9;
      j.shR.rotation.x = -0.9;
      j.shL.rotation.z = -0.15;
      j.shR.rotation.z = 0.15;
      j.elL.rotation.x = -2.15;
      j.elR.rotation.x = -2.15;
      j.head.rotation.z = S(t * 1.4) * 0.1;
      j.head.rotation.x = -0.05;
      j.mouth.scale.y = 1.8;
      break;
    }
    case "clap": {
      const w = t * 6.2;
      const apart = S(w) * 0.5 + 0.5;
      j.root.position.y = Math.abs(S(w * 0.5)) * 0.03;
      j.shL.rotation.x = -1.0;
      j.shR.rotation.x = -1.0;
      j.shL.rotation.z = 0.12 - apart * 0.5;
      j.shR.rotation.z = -0.12 + apart * 0.5;
      j.elL.rotation.x = -1.25;
      j.elR.rotation.x = -1.25;
      j.head.rotation.z = S(w * 0.25) * 0.1;
      j.mouth.scale.y = 1.7;
      break;
    }
    case "cheer": {
      const w = t * 5;
      j.root.position.y = Math.abs(S(w)) * 0.1;
      j.shL.rotation.z = -(2.65 + S(w) * 0.25);
      j.shR.rotation.z = 2.65 + S(w + 1) * 0.25;
      j.elL.rotation.x = -0.25;
      j.elR.rotation.x = -0.25;
      j.thL.rotation.x = -pos(S(w)) * 0.3;
      j.knL.rotation.x = pos(S(w)) * 0.5;
      j.head.rotation.x = -0.12;
      j.mouth.scale.y = 1.9;
      break;
    }
    case "blow": {
      j.root.position.y = Math.abs(S(t * 2)) * 0.01;
      j.head.rotation.x = 0.22;
      j.mouth.scale.set(0.8, 1.3, 1);
      j.shL.rotation.x = -0.25;
      j.shR.rotation.x = -0.25;
      j.elL.rotation.x = -0.4;
      j.elR.rotation.x = -0.4;
      break;
    }
    case "idle":
    default: {
      j.root.position.y = S(t * 1.6) * 0.006;
      j.chest.rotation.x = S(t * 1.6) * 0.012;
      j.head.rotation.y = S(t * 0.5) * 0.25;
      j.shL.rotation.x = S(t * 1.1) * 0.05;
      j.shR.rotation.x = -S(t * 1.1) * 0.05;
      j.shL.rotation.z = -0.06;
      j.shR.rotation.z = 0.06;
      j.elL.rotation.x = -0.12;
      j.elR.rotation.x = -0.12;
    }
  }
}

const GOLD = "#f4c542";

function Capsule({ r, len, color, rough = 0.62 }: { r: number; len: number; color: string; rough?: number }) {
  return (
    <mesh castShadow>
      <capsuleGeometry args={[r, len, 6, 12]} />
      <meshStandardMaterial color={color} roughness={rough} />
    </mesh>
  );
}

function Bangles({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      {[0, 0.018, 0.036].map((o) => (
        <mesh key={o} position={[0, o, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.006, 6, 14]} />
          <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} emissive={GOLD} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export function Figure({
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  gender = "f",
  kid = false,
  skin = "#c68a5e",
  hair = "#140d0b",
  hairStyle,
  outfit = "kurta",
  c1 = "#888888",
  c2 = "#444444",
  c3 = GOLD,
  shoe = "#2a1a16",
  pose = "idle",
  phase = 0,
  speed = 1,
  mustache = false,
  tilak = false,
  propR,
  propL,
  children,
}: FigureProps) {
  const fem = gender === "f";
  const hs: HairStyle = hairStyle ?? (fem ? "braid" : "short");
  const refs = useRef<Partial<Record<keyof Joints, THREE.Object3D | null>>>({});
  const set = (k: keyof Joints) => (o: THREE.Object3D | null) => {
    refs.current[k] = o;
  };

  useFrame((state) => {
    const r = refs.current;
    if (!r.root || !r.hips || !r.chest || !r.head || !r.mouth || !r.shL || !r.shR || !r.elL || !r.elR || !r.thL || !r.thR || !r.knL || !r.knR) return;
    applyPose(pose, state.clock.elapsedTime * speed + phase, r as Joints);
    if (r.braid) r.braid.rotation.z = S(state.clock.elapsedTime * 2 * speed + phase) * 0.12;
    if (r.skirt) {
      const k = S(state.clock.elapsedTime * 3 * speed + phase);
      r.skirt.scale.x = 1 + k * 0.025;
      r.skirt.scale.z = 1 - k * 0.025;
    }
  });

  const sh = fem ? 0.2 : 0.235; // shoulder half-width
  const torsoR = fem ? 0.145 : 0.175;
  const long = outfit === "kurta" || outfit === "veshti" || outfit === "suit";
  const skirtOutfit = outfit === "saree" || outfit === "dress";
  const sleeve = outfit === "saree" ? "short" : long ? "long" : "none";
  const trouser = outfit === "kurta" || outfit === "suit";
  const legColor = trouser ? c2 : skin;
  const hemY = outfit === "saree" ? 0.1 : 0.48;
  const hemR = outfit === "saree" ? 0.3 : 0.4;
  const skirtH = 1.03 - hemY;
  const kidScale = kid ? 0.56 : 1;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale * kidScale}>
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.45, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      <group ref={set("root")}>
        {/* ---------- legs ---------- */}
        <group ref={set("hips")} position={[0, 0.92, 0]}>
          {([-1, 1] as const).map((side) => (
            <group key={side} ref={set(side < 0 ? "thL" : "thR")} position={[side * 0.09, 0, 0]}>
              <group position={[0, -0.21, 0]}>
                <Capsule r={0.075} len={0.3} color={legColor} />
              </group>
              <group ref={set(side < 0 ? "knL" : "knR")} position={[0, -0.42, 0]}>
                <group position={[0, -0.2, 0]}>
                  <Capsule r={0.062} len={0.3} color={legColor} />
                </group>
                <mesh position={[0, -0.41, 0.045]} castShadow>
                  <boxGeometry args={[0.1, 0.07, 0.2]} />
                  <meshStandardMaterial color={shoe} roughness={0.5} />
                </mesh>
              </group>
            </group>
          ))}

          {/* ---------- skirt / saree / veshti ---------- */}
          {skirtOutfit && (
            <group ref={set("skirt")} position={[0, 0.11, 0]}>
              <mesh position={[0, -skirtH / 2, 0]} castShadow>
                <cylinderGeometry args={[0.165, hemR, skirtH, 28, 1, true]} />
                <meshStandardMaterial color={c2} roughness={0.55} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -skirtH + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[hemR, 0.02, 6, 28]} />
                <meshStandardMaterial color={c3} roughness={0.35} metalness={0.4} />
              </mesh>
              {outfit === "saree" && (
                <mesh position={[0, -skirtH * 0.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.235, 0.012, 6, 28]} />
                  <meshStandardMaterial color={c3} roughness={0.4} metalness={0.4} />
                </mesh>
              )}
            </group>
          )}
          {outfit === "veshti" && (
            <group position={[0, 0.1, 0]}>
              <mesh position={[0, -0.5, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.25, 1.0, 24, 1, true]} />
                <meshStandardMaterial color={c2} roughness={0.7} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -0.97, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.25, 0.022, 6, 24]} />
                <meshStandardMaterial color={c3} roughness={0.4} metalness={0.4} />
              </mesh>
            </group>
          )}
          {outfit === "kurta" && (
            <mesh position={[0, -0.02, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.235, 0.34, 24, 1, true]} />
              <meshStandardMaterial color={c1} roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          )}
          {outfit === "suit" && (
            <mesh position={[0, -0.02, 0]} castShadow>
              <cylinderGeometry args={[0.205, 0.225, 0.3, 24, 1, true]} />
              <meshStandardMaterial color={c1} roughness={0.55} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* ---------- upper body ---------- */}
          <group ref={set("chest")} position={[0, 0.0, 0]}>
            {/* torso */}
            <group position={[0, 0.3, 0]}>
              <mesh castShadow scale={[1, 1, fem ? 0.82 : 0.88]}>
                <capsuleGeometry args={[torsoR, 0.22, 8, 16]} />
                <meshStandardMaterial color={outfit === "dress" ? c1 : c1} roughness={0.6} />
              </mesh>
            </group>
            {/* saree pallu across the chest */}
            {outfit === "saree" && (
              <>
                <mesh position={[0.02, 0.33, 0.1]} rotation={[0, 0, 0.62]} castShadow>
                  <boxGeometry args={[0.07, 0.62, 0.012]} />
                  <meshStandardMaterial color={c2} roughness={0.5} />
                </mesh>
                <mesh position={[0.02, 0.33, 0.106]} rotation={[0, 0, 0.62]}>
                  <boxGeometry args={[0.012, 0.62, 0.004]} />
                  <meshStandardMaterial color={c3} metalness={0.5} roughness={0.35} />
                </mesh>
                <mesh position={[-0.13, 0.46, -0.02]} rotation={[0.05, 0, 0.1]} castShadow>
                  <boxGeometry args={[0.2, 0.34, 0.2]} />
                  <meshStandardMaterial color={c2} roughness={0.5} />
                </mesh>
              </>
            )}
            {/* veshti: angavastram sash */}
            {outfit === "veshti" && (
              <mesh position={[0.015, 0.34, 0.01]} rotation={[0, 0, -0.62]}>
                <cylinderGeometry args={[0.185, 0.185, 0.07, 16, 1, true]} />
                <meshStandardMaterial color={c3} roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* suit: tie */}
            {outfit === "suit" && (
              <mesh position={[0, 0.36, 0.158]}>
                <boxGeometry args={[0.035, 0.22, 0.012]} />
                <meshStandardMaterial color={c3} roughness={0.4} />
              </mesh>
            )}
            {/* kurta placket + buttons */}
            {(outfit === "kurta" || outfit === "veshti") && (
              <group position={[0, 0.34, torsoR * 0.88]}>
                {[0.12, 0.02, -0.08].map((y) => (
                  <mesh key={y} position={[0, y, 0]}>
                    <sphereGeometry args={[0.01, 6, 6]} />
                    <meshStandardMaterial color={c3} metalness={0.6} roughness={0.3} />
                  </mesh>
                ))}
              </group>
            )}

            {/* neck */}
            <mesh position={[0, 0.58, 0]}>
              <cylinderGeometry args={[0.045, 0.052, 0.12, 12]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            {fem && (
              <mesh position={[0, 0.52, 0.01]} rotation={[Math.PI / 2.2, 0, 0]}>
                <torusGeometry args={[0.075, 0.006, 6, 18]} />
                <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
              </mesh>
            )}

            {/* ---------- arms ---------- */}
            {([-1, 1] as const).map((side) => (
              <group key={side} ref={set(side < 0 ? "shL" : "shR")} position={[side * sh, 0.5, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.062, 12, 10]} />
                  <meshStandardMaterial color={sleeve === "none" ? skin : outfit === "saree" ? c1 : c1} roughness={0.6} />
                </mesh>
                <group position={[0, -0.15, 0]}>
                  <Capsule r={0.05} len={0.2} color={sleeve === "none" ? skin : c1} />
                </group>
                <group ref={set(side < 0 ? "elL" : "elR")} position={[0, -0.3, 0]}>
                  <group position={[0, -0.135, 0]}>
                    <Capsule r={0.042} len={0.19} color={sleeve === "long" ? c1 : skin} />
                  </group>
                  {fem && <Bangles y={-0.2} />}
                  <mesh position={[0, -0.3, 0]} castShadow>
                    <sphereGeometry args={[0.048, 10, 10]} />
                    <meshStandardMaterial color={skin} roughness={0.55} />
                  </mesh>
                  <group position={[0, -0.3, 0.02]}>{side < 0 ? propL : propR}</group>
                </group>
              </group>
            ))}

            {/* ---------- head ---------- */}
            <group ref={set("head")} position={[0, 0.72, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.118, 24, 20]} />
                <meshStandardMaterial color={skin} roughness={0.55} />
              </mesh>
              {/* ears */}
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.115, -0.005, 0]}>
                  <sphereGeometry args={[0.024, 8, 8]} />
                  <meshStandardMaterial color={skin} roughness={0.6} />
                </mesh>
              ))}
              {/* eyes */}
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.043, 0.012, 0.104]}>
                  <mesh>
                    <sphereGeometry args={[0.02, 10, 10]} />
                    <meshStandardMaterial color="#fffaf2" roughness={0.3} />
                  </mesh>
                  <mesh position={[0, 0, 0.012]}>
                    <sphereGeometry args={[0.0125, 8, 8]} />
                    <meshStandardMaterial color="#1d0f0a" roughness={0.2} />
                  </mesh>
                  <mesh position={[0, 0.032, 0.002]} rotation={[0, 0, s * 0.1]}>
                    <boxGeometry args={[0.04, fem ? 0.007 : 0.011, 0.008]} />
                    <meshStandardMaterial color={hair} roughness={0.8} />
                  </mesh>
                </group>
              ))}
              {/* nose */}
              <mesh position={[0, -0.012, 0.118]}>
                <sphereGeometry args={[0.014, 8, 8]} />
                <meshStandardMaterial color={skin} roughness={0.6} />
              </mesh>
              {/* cheeks */}
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.07, -0.04, 0.093]} rotation={[0, s * -0.5, 0]}>
                  <circleGeometry args={[0.02, 10]} />
                  <meshBasicMaterial color="#e0556b" transparent opacity={fem ? 0.35 : 0.2} />
                </mesh>
              ))}
              {/* mouth */}
              <group ref={set("mouth")} position={[0, -0.06, 0.1]}>
                <mesh rotation={[0, 0, Math.PI]}>
                  <torusGeometry args={[0.024, 0.0065, 6, 12, Math.PI]} />
                  <meshStandardMaterial color={fem ? "#b0304a" : "#5e2323"} roughness={0.5} />
                </mesh>
              </group>
              {/* bindi / tilak */}
              {fem && (
                <mesh position={[0, 0.058, 0.113]}>
                  <circleGeometry args={[0.009, 10]} />
                  <meshBasicMaterial color="#c4143a" />
                </mesh>
              )}
              {tilak && (
                <>
                  <mesh position={[0, 0.062, 0.112]}>
                    <circleGeometry args={[0.008, 10]} />
                    <meshBasicMaterial color="#c4143a" />
                  </mesh>
                  {[0.07, 0.054, 0.086].map((y, i) => (
                    <mesh key={i} position={[0, y, 0.108]}>
                      <boxGeometry args={[0.06, 0.005, 0.004]} />
                      <meshBasicMaterial color="#fff6e6" />
                    </mesh>
                  ))}
                </>
              )}
              {mustache && (
                <mesh position={[0, -0.036, 0.108]}>
                  <boxGeometry args={[0.07, 0.012, 0.012]} />
                  <meshStandardMaterial color={hair} roughness={0.8} />
                </mesh>
              )}
              {fem &&
                [-1, 1].map((s) => (
                  <mesh key={s} position={[s * 0.118, -0.04, 0.005]}>
                    <sphereGeometry args={[0.012, 8, 8]} />
                    <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
                  </mesh>
                ))}

              {/* ---------- hair ---------- */}
              <mesh position={[0, 0.012, -0.012]} rotation={[-0.25, 0, 0]} castShadow>
                <sphereGeometry args={[0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
                <meshStandardMaterial color={hair} roughness={0.55} />
              </mesh>
              {(hs === "braid" || hs === "bun" || hs === "long" || hs === "pigtails") && (
                <mesh position={[0, -0.01, -0.045]} scale={[1, hs === "long" ? 1.9 : 1.1, 0.8]}>
                  <sphereGeometry args={[0.122, 18, 14]} />
                  <meshStandardMaterial color={hair} roughness={0.55} />
                </mesh>
              )}
              {hs === "bun" && (
                <mesh position={[0, 0.115, -0.07]}>
                  <sphereGeometry args={[0.058, 14, 12]} />
                  <meshStandardMaterial color={hair} roughness={0.55} />
                </mesh>
              )}
              {hs === "pigtails" &&
                [-1, 1].map((s) => (
                  <group key={s} position={[s * 0.14, 0.04, -0.01]}>
                    <mesh>
                      <sphereGeometry args={[0.045, 10, 10]} />
                      <meshStandardMaterial color={hair} roughness={0.55} />
                    </mesh>
                    <mesh position={[s * 0.01, -0.07, 0]}>
                      <sphereGeometry args={[0.04, 10, 10]} />
                      <meshStandardMaterial color={hair} roughness={0.55} />
                    </mesh>
                    <mesh position={[0, 0.0, 0]}>
                      <torusGeometry args={[0.04, 0.008, 6, 12]} />
                      <meshStandardMaterial color={c3} roughness={0.4} />
                    </mesh>
                  </group>
                ))}
              {hs === "braid" && (
                <group ref={set("braid")} position={[0, -0.06, -0.12]}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <mesh key={i} position={[0, -0.04 - i * 0.075, -0.012 - i * 0.003]} scale={[1, 1.15, 1]}>
                      <sphereGeometry args={[0.033 - i * 0.0014, 8, 8]} />
                      <meshStandardMaterial color={hair} roughness={0.5} />
                    </mesh>
                  ))}
                  {/* jasmine strand along the plait */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <mesh key={`j${i}`} position={[0.015, -0.05 - i * 0.12, -0.04 - i * 0.003]}>
                      <sphereGeometry args={[0.014, 6, 6]} />
                      <meshStandardMaterial color="#fffdf2" roughness={0.4} emissive="#fffdf2" emissiveIntensity={0.15} />
                    </mesh>
                  ))}
                </group>
              )}
              {hs === "short" && (
                <mesh position={[0, 0.07, 0.045]} rotation={[0.15, 0, 0]}>
                  <boxGeometry args={[0.18, 0.04, 0.07]} />
                  <meshStandardMaterial color={hair} roughness={0.6} />
                </mesh>
              )}
              {fem && hs !== "short" && (
                <>
                  {[-0.07, -0.025, 0.02, 0.065].map((x, i) => (
                    <mesh key={i} position={[x, 0.1 - Math.abs(x) * 0.3, 0.02]}>
                      <sphereGeometry args={[0.012, 6, 6]} />
                      <meshStandardMaterial color="#fffdf2" roughness={0.4} />
                    </mesh>
                  ))}
                </>
              )}
            </group>
          </group>
        </group>
        {children}
      </group>
    </group>
  );
}
