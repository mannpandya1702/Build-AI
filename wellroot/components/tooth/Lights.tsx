"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { colors } from "@/lib/tokens";
import { useHeartbeat } from "./useHeartbeat";

/**
 * Explicit three-point rig on a white stage:
 *  - soft KEY from top-front (the main form light)
 *  - low FILL from lower-left (opens the shadows so nothing reads clinical)
 *  - teal RIM/back light — the branded edge-shine, and the main visible
 *    heartbeat: its intensity rides the pulse waveform each frame.
 * A gentle hemisphere adds believable ambient bounce off the white room.
 */
export default function Lights({
  hoveredRef,
  scrollDimRef,
  rimRef,
}: {
  hoveredRef: RefObject<boolean>;
  scrollDimRef: RefObject<number>;
  // Shared with SelectiveBloom so the teal beat also blooms.
  rimRef?: RefObject<THREE.PointLight | null>;
}) {
  const internal = useRef<THREE.PointLight>(null);
  const rim = rimRef ?? internal;
  const { sample } = useHeartbeat();

  const RIM_BASE = 0.55;
  const RIM_PULSE = 1.7;

  useFrame(({ clock }) => {
    if (!rim.current) return;
    const p = sample(clock.elapsedTime);
    const hoverBoost = hoveredRef.current ? 0.7 : 0;
    // scrollDim: 0 at rest, up to 1 as the hero settles away -> dim the pulse.
    const dim = 1 - 0.55 * (scrollDimRef.current ?? 0);
    rim.current.intensity = (RIM_BASE + p * RIM_PULSE + hoverBoost) * dim;
  });

  return (
    <>
      <hemisphereLight
        args={["#ffffff", colors.mist, 0.55]}
      />
      {/* Key */}
      <directionalLight
        position={[2.6, 4.2, 3.2]}
        intensity={1.45}
        color="#ffffff"
      />
      {/* Fill */}
      <directionalLight
        position={[-3.4, -0.6, 2.2]}
        intensity={0.32}
        color="#eaf6f5"
      />
      {/* Teal rim / back light — heartbeat-driven */}
      <pointLight
        ref={rim}
        position={[-1.4, 2.4, -3.0]}
        intensity={RIM_BASE}
        color={colors.teal}
        distance={12}
        decay={1.4}
      />
    </>
  );
}
