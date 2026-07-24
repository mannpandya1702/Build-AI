"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HeroTier } from "@/lib/webgl";
import Lights from "./Lights";
import Aura from "./Aura";
import ToothModel from "./ToothModel";

/** Builds an indoor studio IBL from RoomEnvironment via PMREM — fully local, no
 *  network HDRI. This is the single biggest quality win for believable enamel
 *  specular on white. */
function StudioEnvironment({ intensity = 1.1 }: { intensity?: number }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const rt = pmrem.fromScene(room, 0.04);
    scene.environment = rt.texture;
    // three r163+: scene-wide multiplier (per-material envMapIntensity also set).
    (scene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity =
      intensity;
    return () => {
      rt.dispose();
      pmrem.dispose();
      room.dispose?.();
      scene.environment = null;
    };
  }, [gl, scene, intensity]);
  return null;
}

/** Calls onReady once the first real frame has painted (for the crossfade). */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) onReady();
  });
  return null;
}

/** Drives the hero-settle scroll progress ref from a ScrollTrigger scrub. */
function useScrollProgress(reduced: boolean) {
  const ref = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: () => `+=${window.innerHeight}`,
      scrub: true,
      onUpdate: (self) => {
        ref.current = self.progress;
      },
    });
    return () => st.kill();
  }, [reduced]);
  return ref;
}

function Scene({
  tier,
  onReady,
  reveal,
  scrollRef,
}: {
  tier: HeroTier;
  onReady: () => void;
  reveal: boolean;
  scrollRef: React.RefObject<number>;
}) {
  const hoveredRef = useRef(false);
  const rimRef = useRef<THREE.PointLight>(null);
  const full = tier === "full";

  return (
    <>
      <StudioEnvironment intensity={1.1} />
      <Lights hoveredRef={hoveredRef} scrollDimRef={scrollRef} rimRef={rimRef} />
      {full && <Aura scrollDimRef={scrollRef} />}

      <ToothModel
        hoveredRef={hoveredRef}
        scrollRef={scrollRef}
        reveal={reveal}
      />

      <ContactShadows
        position={[0, -1.65, 0]}
        opacity={0.35}
        scale={7}
        blur={2.5}
        far={4}
        color="#6b5b3e"
        resolution={512}
      />

      <FirstFrame onReady={onReady} />
    </>
  );
}

export default function ToothCanvas({
  tier,
  onReady,
}: {
  tier: HeroTier;
  onReady?: () => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [frameloop, setFrameloop] = useState<"always" | "never">("never");
  const reduced = tier === "static";
  const scrollRef = useScrollProgress(reduced);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? "always" : "never"),
      { threshold: 0.01 },
    );
    io.observe(el);
    const t = setTimeout(() => setReveal(true), 60);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  const dpr: [number, number] = tier === "lite" ? [1, 1.5] : [1, 2];

  return (
    <div ref={wrapper} className="absolute inset-0">
      <Canvas
        frameloop={frameloop}
        dpr={dpr}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.2, 9.5], fov: 30 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        style={{ background: "transparent" }}
      >
        <Scene
          tier={tier}
          reveal={reveal}
          scrollRef={scrollRef}
          onReady={() => onReady?.()}
        />
      </Canvas>
    </div>
  );
}
