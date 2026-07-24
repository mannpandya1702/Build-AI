"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { spineStore } from "@/lib/spineStore";
import { useHeartbeat } from "./useHeartbeat";
import { buildMolarGeometry, buildRoughnessTexture } from "./toothGeometry";

/* --------------------------------------------------------------------------
   SWAP POINT — real model vs procedural placeholder.
   Drop a clean molar at public/models/tooth.glb, then flip this to true.
   The material, lighting, heartbeat and scroll morph all drive the real mesh.
-------------------------------------------------------------------------- */
const HAS_GLB = false;
const GLB_PATH = "/models/tooth.glb";

// Warm ivory enamel. Kept off-teal on purpose: the teal brand accent comes from
// the rim light + aura around the tooth, never from tinting the enamel green.
function useEnamelMaterial() {
  const fresnel = useRef({
    uFresnelStrength: { value: 0.0 },
    uFresnelColor: { value: new THREE.Color("#d6f2ec") },
  });

  const roughnessMap = useMemo(() => buildRoughnessTexture(), []);

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f6f1e7"),
      roughness: 0.2,
      roughnessMap,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transmission: 0.12,
      thickness: 2.5,
      ior: 1.6,
      attenuationColor: new THREE.Color("#e8dcc8"),
      attenuationDistance: 4,
      sheen: 0.3,
      sheenColor: new THREE.Color("#ffffff"),
      sheenRoughness: 0.5,
      envMapIntensity: 1.1,
    });

    // Heartbeat fresnel edge glow, added to emissive at the silhouette only.
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uFresnelStrength = fresnel.current.uFresnelStrength;
      shader.uniforms.uFresnelColor = fresnel.current.uFresnelColor;
      shader.fragmentShader =
        "uniform float uFresnelStrength;\nuniform vec3 uFresnelColor;\n" +
        shader.fragmentShader.replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           float wrFres = pow(1.0 - saturate(dot(normalize(normal), normalize(vViewPosition))), 3.2);
           totalEmissiveRadiance += uFresnelColor * wrFres * uFresnelStrength;`,
        );
    };
    m.customProgramCacheKey = () => "wr-enamel-ivory";
    return m;
  }, [roughnessMap]);

  useEffect(
    () => () => {
      material.dispose();
      roughnessMap.dispose();
    },
    [material, roughnessMap],
  );

  return { material, fresnel };
}

function ProceduralTooth({ material }: { material: THREE.MeshPhysicalMaterial }) {
  const geometry = useMemo(() => buildMolarGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow />;
}

function GlbTooth({ material }: { material: THREE.MeshPhysicalMaterial }) {
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

// Base 3/4 pose: turned and tilted so it never reads as a flat, symmetric decal.
const BASE_ROT_Y = -0.42;
const BASE_ROT_X = 0.2;
const BASE_ROT_Z = 0.04;

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
  const { sample, reduced } = useHeartbeat();
  const { camera, gl } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const spin = useRef(BASE_ROT_Y); // continuous idle rotation, seeded at the 3/4 pose
  const paraY = useRef(0);
  const paraX = useRef(0);

  // Project the root apex to document coordinates for FlowSpine.
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
    const t = state.clock.elapsedTime;
    const p = sample(t);

    // Heartbeat -> whisper-white fresnel edge (no body tint), pushed up so the
    // beat clearly reads on white.
    fresnel.current.uFresnelStrength.value = (0.1 + p * 0.85) * (1 - 0.5 * s);

    if (reduced) {
      // Static single pose.
      g.rotation.set(BASE_ROT_X, BASE_ROT_Y, BASE_ROT_Z);
      const rs = reveal ? 1 : 0.94;
      g.scale.setScalar(rs);
      return;
    }

    // Continuous slow spin (~one turn / 20s), easing to a stop and tipping the
    // roots downward as the hero settles into the scroll. Damped cursor
    // parallax rides on top.
    const px = THREE.MathUtils.clamp(state.pointer.x, -1, 1);
    const py = THREE.MathUtils.clamp(state.pointer.y, -1, 1);
    spin.current += delta * 0.32 * (1 - 0.92 * s);
    paraY.current = THREE.MathUtils.damp(paraY.current, px * 0.16 * (1 - s), 4, delta);
    paraX.current = THREE.MathUtils.damp(paraX.current, -py * 0.12 * (1 - s), 4, delta);
    g.rotation.y = spin.current + paraY.current;
    g.rotation.x = BASE_ROT_X + paraX.current + s * 0.5;
    g.rotation.z = BASE_ROT_Z;

    // Gentle float + settle drift + hover + reveal.
    const float = Math.sin(t * 0.5) * 0.05;
    g.position.y = THREE.MathUtils.damp(
      g.position.y,
      float + s * 0.5,
      4,
      delta,
    );
    const revealScale = reveal ? 1 : 0.94;
    const hover = hoveredRef.current ? 1.04 : 1.0;
    const targetScale = revealScale * hover * (1 - s * 0.2);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 5, delta));
  });

  return (
    <group
      ref={group}
      rotation={[BASE_ROT_X, BASE_ROT_Y, BASE_ROT_Z]}
      scale={0.94}
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
      <object3D ref={rootMarker} position={[0, -1.5, 0]} />
    </group>
  );
}

if (HAS_GLB) useGLTF.preload(GLB_PATH);
