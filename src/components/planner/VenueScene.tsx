"use client";

import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import type { PlanObject } from "./types";

type Props = {
  roomWidth: number;
  roomDepth: number;
  objects: PlanObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, z: number) => void;
  cameraPreset: CameraPreset;
};

export type CameraPreset = "orbit" | "top" | "stage" | "entrance";

const COLORS: Record<string, string> = {
  "round-table": "#f7c948",
  "rect-table": "#f5a623",
  chair: "#c9a227",
  stage: "#e23e57",
  "dance-floor": "#2dd4bf",
  buffet: "#7c3aed",
  entrance: "#38bdf8",
  "decor-arch": "#ff9e2c",
  pillar: "#94a3b8",
  service: "#64748b",
};

function ObjectMesh({
  obj,
  selected,
  onSelect,
  onMove,
}: {
  obj: PlanObject;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, z: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const { camera, gl } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const color = COLORS[obj.kind] ?? "#cbd5e1";

  function pointerMove(e: ThreeEvent<PointerEvent>) {
    if (!dragging) return;
    e.stopPropagation();
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, point)) {
      onMove(obj.id, Number(point.x.toFixed(2)), Number(point.z.toFixed(2)));
    }
  }

  const common = {
    position: [obj.posX, obj.posY, obj.posZ] as [number, number, number],
    rotation: [0, obj.rotY, 0] as [number, number, number],
    scale: obj.scale,
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(obj.id);
    },
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onSelect(obj.id);
      setDragging(true);
      (e.target as Element)?.setPointerCapture?.(e.pointerId);
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      setDragging(false);
      (e.target as Element)?.releasePointerCapture?.(e.pointerId);
    },
    onPointerMove: pointerMove,
  };

  const emissive = selected ? "#ffffff" : "#000000";
  const emissiveIntensity = selected ? 0.25 : 0;

  function geometry() {
    switch (obj.kind) {
      case "round-table":
        return (
          <mesh castShadow>
            <cylinderGeometry args={[0.9, 0.9, 0.75, 24]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "rect-table":
        return (
          <mesh castShadow>
            <boxGeometry args={[2.2, 0.75, 1]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "chair":
        return (
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.9, 0.45]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "stage":
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[8, 0.6, 3]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "dance-floor":
        return (
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6, 6]} />
            <meshStandardMaterial color={color} transparent opacity={0.55} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "buffet":
        return (
          <mesh castShadow>
            <boxGeometry args={[4, 0.9, 1]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "entrance":
        return (
          <mesh castShadow>
            <torusGeometry args={[1.4, 0.18, 12, 24, Math.PI]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "decor-arch":
        return (
          <mesh castShadow>
            <torusGeometry args={[1.8, 0.22, 12, 32, Math.PI]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      case "pillar":
        return (
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.4, 4, 16]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      default:
        return (
          <mesh castShadow>
            <boxGeometry args={[1.5, 1, 1]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
    }
  }

  return (
    <group {...common}>
      {geometry()}
      {selected && (
        <Html center distanceFactor={18} position={[0, 2, 0]}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded bg-ink-900/90 px-2 py-0.5 text-[11px] text-white">
            {obj.label || obj.kind}
            {obj.seats > 0 ? ` · ${obj.seats} seats` : ""}
          </div>
        </Html>
      )}
    </group>
  );
}

function Room({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1a1726" />
      </mesh>
      {/* Low perimeter walls to communicate the illustrative room. */}
      {(
        [
          [0, -depth / 2, width, 0],
          [0, depth / 2, width, 0],
          [-width / 2, 0, depth, Math.PI / 2],
          [width / 2, 0, depth, Math.PI / 2],
        ] as [number, number, number, number][]
      ).map(([x, z, len, rot], i) => (
        <mesh key={i} position={[x, 0.6, z]} rotation={[0, rot, 0]}>
          <boxGeometry args={[len, 1.2, 0.15]} />
          <meshStandardMaterial color="#2a2740" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function SceneContents({ roomWidth, roomDepth, objects, selectedId, onSelect, onMove, cameraPreset }: Props) {
  const controls = useRef<any>(null);

  const presets: Record<CameraPreset, [number, number, number]> = {
    orbit: [roomWidth * 0.9, roomWidth * 0.7, roomDepth * 0.9],
    top: [0.01, Math.max(roomWidth, roomDepth) * 1.3, 0.01],
    stage: [0, 6, -roomDepth / 2 + 10],
    entrance: [0, 5, roomDepth / 2 + 6],
  };
  const pos = presets[cameraPreset];

  return (
    <>
      <PerspectiveRig position={pos} controls={controls} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 18, 8]} intensity={1.1} castShadow />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <Grid
        args={[roomWidth, roomDepth]}
        cellSize={1}
        cellColor="#3a3650"
        sectionSize={5}
        sectionColor="#4a4668"
        fadeDistance={60}
        infiniteGrid={false}
        position={[0, 0, 0]}
      />
      <Room width={roomWidth} depth={roomDepth} />

      {/* Click empty floor to deselect. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} onClick={() => onSelect(null)}>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {objects.map((o) => (
        <ObjectMesh key={o.id} obj={o} selected={o.id === selectedId} onSelect={onSelect} onMove={onMove} />
      ))}

      <OrbitControls ref={controls} makeDefault enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

function PerspectiveRig({ position, controls }: { position: [number, number, number]; controls: React.RefObject<any> }) {
  const { camera } = useThree();
  // Apply preset whenever position changes.
  useEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(0, 0, 0);
    if (controls.current) {
      controls.current.target.set(0, 0, 0);
      controls.current.update?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1], position[2]]);
  return null;
}

export default function VenueScene(props: Props) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 50, near: 0.1, far: 500 }} className="h-full w-full">
      <color attach="background" args={["#0b0a14"]} />
      <SceneContents {...props} />
    </Canvas>
  );
}
