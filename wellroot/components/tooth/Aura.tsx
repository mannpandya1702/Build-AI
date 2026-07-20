"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { colors } from "@/lib/tokens";
import { useHeartbeat } from "./useHeartbeat";

/**
 * A soft teal radial glow sitting BEHIND the tooth that breathes with the
 * heartbeat. On a white page a glow must stay teal (not additive-white, which
 * greys the page), so this uses normal blending with a transparent radial
 * gradient texture. Scale + opacity ride the pulse.
 */
export default function Aura({
  scrollDimRef,
}: {
  scrollDimRef: RefObject<number>;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const { sample } = useHeartbeat();

  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    const [r, gr, b] = [0x12, 0xb3, 0xab];
    g.addColorStop(0, `rgba(${r},${gr},${b},0.55)`);
    g.addColorStop(0.4, `rgba(${r},${gr},${b},0.22)`);
    g.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const p = sample(clock.elapsedTime);
    const dim = 1 - 0.6 * (scrollDimRef.current ?? 0);
    if (mesh.current) {
      const s = 5.2 * (1 + p * 0.1);
      mesh.current.scale.setScalar(s);
    }
    if (mat.current) {
      mat.current.opacity = (0.18 + p * 0.32) * dim;
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0.1, -1.2]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={mat}
        map={texture}
        transparent
        depthWrite={false}
        color={colors.teal}
        opacity={0.25}
        toneMapped={false}
      />
    </mesh>
  );
}
