"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { colors } from "@/lib/tokens";
import { spineStore } from "@/lib/spineStore";
import { useHeartbeat } from "./useHeartbeat";

/* --------------------------------------------------------------------------
   SWAP POINT — real model vs procedural placeholder.
   Drop a clean molar/incisor at public/models/tooth.glb, then flip this to
   true. Everything below (material, lighting, pulse, scroll morph) is built to
   drive the real mesh, not the placeholder.
-------------------------------------------------------------------------- */
const HAS_GLB = false;
const GLB_PATH = "/models/tooth.glb";

/* ---- the branded wet-enamel material (shared by both paths) ---- */
function useEnamelMaterial() {
  // Uniforms for the heartbeat fresnel edge term. Kept in a ref so useFrame can
  // mutate .value without recompiling the shader.
  const fresnel = useRef({
    uFresnelStrength: { value: 0.15 },
    uFresnelColor: { value: new THREE.Color(colors.teal) },
  });

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colors.enamel),
      roughness: 0.25,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      sheen: 0.5,
      sheenColor: new THREE.Color(colors.sheen),
      sheenRoughness: 0.6,
      transmission: 0.18,
      thickness: 0.8,
      ior: 1.5,
      envMapIntensity: 1.0,
      emissive: new THREE.Color(colors.teal),
      emissiveIntensity: 0.12,
      transparent: true,
    });

    // Inject a fresnel edge glow into the emissive so the silhouette brightens
    // on each beat. `normal` and `vViewPosition` are available after
    // normal_fragment_begin, which precedes emissivemap_fragment.
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uFresnelStrength = fresnel.current.uFresnelStrength;
      shader.uniforms.uFresnelColor = fresnel.current.uFresnelColor;
      shader.fragmentShader =
        "uniform float uFresnelStrength;\nuniform vec3 uFresnelColor;\n" +
        shader.fragmentShader.replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           float wrFres = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 3.0);
           totalEmissiveRadiance += uFresnelColor * wrFres * uFresnelStrength;`,
        );
    };
    m.customProgramCacheKey = () => "wr-enamel-fresnel";
    return m;
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  return { material, fresnel };
}

/* ---- procedural placeholder geometry ----
   A single smooth surface-of-revolution (crown bulge -> cervical waist -> long
   tapered root with a rounded tip), then flattened slightly on Z so it reads as
   a real flattened tooth rather than a bulb. One continuous lathe = no seams,
   which is what keeps a procedural tooth from looking like popcorn. This is a
   PLACEHOLDER: the real model arrives via the HAS_GLB swap point above. */
function useProceduralGeometry() {
  return useMemo(() => {
    // radius vs. height, bottom (root tip) -> top (crown apex).
    const p: [number, number][] = [
      [0.0, -1.7],
      [0.08, -1.62],
      [0.16, -1.36],
      [0.22, -0.98],
      [0.26, -0.52],
      [0.29, -0.14],
      [0.275, 0.05], // cervical waist (neckline)
      [0.35, 0.3],
      [0.47, 0.64],
      [0.53, 0.95],
      [0.51, 1.2],
      [0.4, 1.42],
      [0.24, 1.56],
      [0.11, 1.63],
      [0.04, 1.66],
      [0.0, 1.67],
    ];
    const profile = p.map(([x, y]) => new THREE.Vector2(x, y));
    const geo = new THREE.LatheGeometry(profile, 96);
    geo.computeVertexNormals();
    geo.center();
    // Flatten front-to-back for a believable tooth cross-section, and normalize
    // scale so the placeholder fills the same box the real model should.
    geo.scale(1.05, 1.0, 0.78);
    return geo;
  }, []);
}

function ProceduralTooth({
  material,
}: {
  material: THREE.MeshPhysicalMaterial;
}) {
  const geometry = useProceduralGeometry();
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow />;
}

function GlbTooth({ material }: { material: THREE.MeshPhysicalMaterial }) {
  // Only mounted when HAS_GLB is true, so useGLTF never touches a missing file.
  const { scene } = useGLTF(GLB_PATH);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).material = material;
        (o as THREE.Mesh).castShadow = true;
      }
    });
    return c;
  }, [scene, material]);
  return <primitive object={cloned} />;
}

export default function ToothModel({
  hoveredRef,
  scrollRef,
  reveal,
}: {
  hoveredRef: RefObject<boolean>;
  scrollRef: RefObject<number>;
  reveal: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const rootMarker = useRef<THREE.Object3D>(null);
  const { material, fresnel } = useEnamelMaterial();
  const { sample } = useHeartbeat();
  const { camera, gl } = useThree();

  const idle = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // Project the root tip to document coordinates so FlowSpine can glue the teal
  // line to the roots. Runs on layout events, not per frame.
  useEffect(() => {
    const update = () => {
      const g = group.current;
      const marker = rootMarker.current;
      if (!g || !marker) return;
      g.updateWorldMatrix(true, true);
      marker.getWorldPosition(tmp);
      tmp.project(camera);
      const rect = gl.domElement.getBoundingClientRect();
      const x = rect.left + (tmp.x * 0.5 + 0.5) * rect.width + window.scrollX;
      const y = rect.top + (-tmp.y * 0.5 + 0.5) * rect.height + window.scrollY;
      spineStore.setRootAnchor({ x, y });
    };
    const raf = () => requestAnimationFrame(update);
    ScrollTrigger.addEventListener("refresh", raf);
    window.addEventListener("resize", raf);
    // A couple of delayed passes to catch fonts/layout settling.
    raf();
    const t = setTimeout(raf, 600);
    return () => {
      ScrollTrigger.removeEventListener("refresh", raf);
      window.removeEventListener("resize", raf);
      clearTimeout(t);
    };
  }, [camera, gl, tmp]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const s = THREE.MathUtils.clamp(scrollRef.current ?? 0, 0, 1);
    const p = sample(state.clock.elapsedTime);

    // Heartbeat -> material emissive + fresnel edge.
    const dim = 1 - 0.5 * s;
    material.emissiveIntensity = (0.1 + p * 0.42) * dim;
    fresnel.current.uFresnelStrength.value = (0.12 + p * 0.85) * dim;

    // Idle drift (slows as the hero settles away).
    idle.current += delta * 0.12 * (1 - 0.85 * s);

    // Damped pointer parallax, clamped, fading out as it settles.
    const px = THREE.MathUtils.clamp(state.pointer.x, -1, 1);
    const py = THREE.MathUtils.clamp(state.pointer.y, -1, 1);
    const targetRotY = idle.current + px * 0.45 * (1 - s);
    const targetRotX = -py * 0.26 * (1 - s) + s * 0.7; // roots angle down as it settles
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRotY, 4, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRotX, 4, delta);

    // Reveal pop-in + hover scale + settle shrink + upward drift.
    const revealScale = reveal ? 1 : 0.9;
    const hover = hoveredRef.current ? 1.05 : 1.0;
    const targetScale = revealScale * hover * (1 - s * 0.26);
    const cur = g.scale.x;
    const next = THREE.MathUtils.damp(cur, targetScale, 5, delta);
    g.scale.setScalar(next);

    g.position.y = THREE.MathUtils.damp(g.position.y, s * 0.5, 4, delta);
  });

  return (
    <group
      ref={group}
      scale={0.9}
      onPointerOver={(e) => {
        e.stopPropagation();
        hoveredRef.current = true;
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        hoveredRef.current = false;
        document.body.style.cursor = "";
      }}
    >
      {HAS_GLB ? (
        <GlbTooth material={material} />
      ) : (
        <ProceduralTooth material={material} />
      )}
      {/* Invisible marker at the root tip, projected to screen for the spine. */}
      <object3D ref={rootMarker} position={[0, -1.62, 0]} />
    </group>
  );
}

// Intentionally not preloading — the placeholder path never needs the GLB.
if (HAS_GLB) useGLTF.preload(GLB_PATH);
