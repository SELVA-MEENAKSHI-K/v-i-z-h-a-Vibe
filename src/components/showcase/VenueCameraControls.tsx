"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

export type CameraView = "iso" | "front" | "top";

// Smoothly animates the camera to a target position/look-at when `view` or
// `resetSignal` changes, then hands control back to OrbitControls so users can
// rotate / zoom freely. Isometric default matches the reference look.
export function VenueCameraControls({
  roomWidth,
  roomDepth,
  view,
  resetSignal,
}: {
  roomWidth: number;
  roomDepth: number;
  view: CameraView;
  resetSignal: number;
}) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();

  // Respect the user's reduced-motion preference: snap instead of tween.
  const reducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    const onChange = () => (reducedMotion.current = mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const anim = useRef<{
    active: boolean;
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
  }>({
    active: false,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    t: 0,
  });

  const span = Math.max(roomWidth, roomDepth);

  function targetFor(v: CameraView): { pos: THREE.Vector3; look: THREE.Vector3 } {
    switch (v) {
      case "top":
        return { pos: new THREE.Vector3(0.01, span * 1.5, 0.01), look: new THREE.Vector3(0, 0, 0) };
      case "front":
        return { pos: new THREE.Vector3(0, span * 0.5, roomDepth * 0.95), look: new THREE.Vector3(0, 1, -roomDepth / 3) };
      case "iso":
      default:
        return { pos: new THREE.Vector3(roomWidth * 0.85, span * 0.75, roomDepth * 0.95), look: new THREE.Vector3(0, 0.5, 0) };
    }
  }

  // Kick off an animation whenever the view or reset signal changes.
  useEffect(() => {
    const { pos, look } = targetFor(view);
    const a = anim.current;
    a.from.copy(camera.position);
    a.to.copy(pos);
    a.fromTarget.copy(controls.current ? controls.current.target : new THREE.Vector3());
    a.toTarget.copy(look);
    a.t = 0;
    a.active = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, resetSignal, roomWidth, roomDepth]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a.active) return;
    // Reduced motion: jump straight to the target, no tween.
    if (reducedMotion.current) {
      camera.position.copy(a.to);
      if (controls.current) {
        controls.current.target.copy(a.toTarget);
        controls.current.update();
      } else {
        camera.lookAt(a.toTarget);
      }
      a.active = false;
      return;
    }
    a.t = Math.min(1, a.t + delta * 1.6);
    // easeInOutCubic
    const e = a.t < 0.5 ? 4 * a.t * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 3) / 2;
    camera.position.lerpVectors(a.from, a.to, e);
    if (controls.current) {
      controls.current.target.lerpVectors(a.fromTarget, a.toTarget, e);
      controls.current.update();
    } else {
      camera.lookAt(a.toTarget);
    }
    if (a.t >= 1) a.active = false;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={span * 0.4}
      maxDistance={span * 2.2}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
}
