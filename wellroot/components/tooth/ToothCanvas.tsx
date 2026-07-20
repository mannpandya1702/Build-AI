"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import {
  EffectComposer,
  SelectiveBloom,
  Selection,
  Select,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HeroTier } from "@/lib/webgl";
import Lights from "./Lights";
import Aura from "./Aura";
import ToothModel from "./ToothModel";

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
      // Settle completes over the first viewport of scrolling.
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
      {/* Local studio-ish environment (no network HDRI) for believable
          clearcoat specular on white. */}
      <Environment resolution={128} environmentIntensity={0.62}>
        <Lightformer
          intensity={2.2}
          position={[0, 2.5, 2]}
          scale={[5, 5, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={0.7}
          position={[-3.5, 0, 2]}
          scale={[3, 4, 1]}
          color="#eaf6f5"
        />
        <Lightformer
          intensity={1.3}
          position={[2.5, 1, -2]}
          scale={[3, 3, 1]}
          color="#12b3ab"
        />
        <Lightformer
          intensity={0.9}
          position={[0, -2.5, 1]}
          scale={[5, 2, 1]}
          color="#ffffff"
        />
      </Environment>

      <Lights
        hoveredRef={hoveredRef}
        scrollDimRef={scrollRef}
        rimRef={rimRef}
      />

      <Aura scrollDimRef={scrollRef} />

      <Selection>
        {full && (
          <EffectComposer autoClear={false} multisampling={4}>
            <SelectiveBloom
              lights={[rimRef as React.RefObject<THREE.Object3D>]}
              luminanceThreshold={0.62}
              luminanceSmoothing={0.5}
              intensity={0.9}
              mipmapBlur
            />
          </EffectComposer>
        )}
        <Select enabled>
          <ToothModel
            hoveredRef={hoveredRef}
            scrollRef={scrollRef}
            reveal={reveal}
          />
        </Select>
      </Selection>

      <ContactShadows
        position={[0, -1.75, 0]}
        opacity={0.32}
        scale={9}
        blur={2.8}
        far={4.2}
        color="#0b6b66"
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
  const reduced = tier === "static"; // static tier never mounts the canvas
  const scrollRef = useScrollProgress(reduced);
  const [reveal, setReveal] = useState(false);

  // Pause the render loop when the hero canvas is off-screen.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? "always" : "never"),
      { threshold: 0.01 },
    );
    io.observe(el);
    // Kick the reveal animation shortly after mount.
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
        camera={{ position: [0, 0, 5.2], fov: 32 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
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
