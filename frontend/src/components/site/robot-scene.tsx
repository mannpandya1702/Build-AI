"use client";

/**
 * Maana's voice agent, embodied. This is the robot-hero character reskinned for
 * the brand: dark chrome chassis, a single violet rim light, a violet screen and
 * eyes — calmed down and stripped of the retail chrome (no navbar, no shopping
 * bag, no background wordmark). It is the one deliberate 3D beat on the page and
 * is lazy-mounted only when it scrolls into view. Respects reduced-motion.
 *
 * Click the robot and its eyes turn to hearts. Some delight is allowed.
 */

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, ContactShadows, Lightformer } from "@react-three/drei";
import * as THREE from "three";

const ACCENT = "#7b5cff";

class HeartCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    t = t * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return optionalTarget.set(x * 0.002, (y + 6) * 0.002, 0);
  }
}
const sharedHeartCurve = new HeartCurve();

function ResponsiveGroup({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree();
  const scale = Math.min(1.15, viewport.width / 3.2);
  return <group scale={scale}>{children}</group>;
}

/* Violet fresnel screen behind the face */
function GlassCapsule() {
  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(ACCENT) },
      power: { value: 2.2 },
      intensity: { value: 0.9 },
    }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry args={[0.3, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          uniform float power;
          uniform float intensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
            fresnel = pow(fresnel, power);
            gl_FragColor = vec4(color, fresnel * intensity);
          }
        `}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* Dark-chrome shared materials */
const chromeMat = new THREE.MeshStandardMaterial({
  color: "#1c1c26",
  roughness: 0.24,
  metalness: 0.9,
  envMapIntensity: 1.15,
});
const darkMat = new THREE.MeshStandardMaterial({
  color: "#0b0b12",
  roughness: 0.5,
  metalness: 0.3,
});
const ringMat = new THREE.MeshStandardMaterial({
  color: "#2a2a38",
  roughness: 0.2,
  metalness: 1.0,
});
const antennaStickMat = new THREE.MeshStandardMaterial({
  color: "#3a3a48",
  roughness: 0.35,
  metalness: 0.8,
});
const antennaTipMat = new THREE.MeshStandardMaterial({
  color: ACCENT,
  emissive: new THREE.Color(ACCENT),
  emissiveIntensity: 2.2,
  roughness: 0.3,
  toneMapped: false,
});
const eyeMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(ACCENT).multiplyScalar(2.2),
  toneMapped: false,
});
const heartMat = new THREE.MeshBasicMaterial({ color: ACCENT, toneMapped: false });

function RobotEar({
  position,
  scale = 1,
  isLeft = false,
}: {
  position: [number, number, number];
  scale?: number;
  isLeft?: boolean;
}) {
  const dir = isLeft ? -1 : 1;
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={chromeMat}>
        <cylinderGeometry args={[0.04, 0.04, 0.025, 32]} />
      </mesh>
      <mesh position={[dir * 0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={ringMat}>
        <torusGeometry args={[0.032, 0.008, 16, 32]} />
      </mesh>
      <mesh position={[dir * 0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={darkMat}>
        <cylinderGeometry args={[0.03, 0.03, 0.005, 32]} />
      </mesh>
      <group position={[dir * 0.015, 0.035, 0]} rotation={[-0.4, 0, 0]}>
        <mesh position={[0, 0.01, 0]} material={antennaStickMat}>
          <cylinderGeometry args={[0.006, 0.008, 0.02, 16]} />
        </mesh>
        <mesh position={[0, 0.06, 0]} material={antennaStickMat}>
          <cylinderGeometry args={[0.003, 0.003, 0.1, 8]} />
        </mesh>
        <mesh position={[0, 0.11, 0]} material={antennaTipMat}>
          <sphereGeometry args={[0.007, 16, 16]} />
        </mesh>
      </group>
    </group>
  );
}

function RobotEye({
  position,
  rotation,
  scale = 1,
  blinkDuration = 0.45,
  blinkCycle = 3.6,
  isLovedRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  blinkDuration?: number;
  blinkCycle?: number;
  isLovedRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const normalEyesRef = useRef<THREE.Group>(null);
  const heartEyeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !normalEyesRef.current || !heartEyeRef.current) return;
    const isHeart = isLovedRef.current;
    normalEyesRef.current.visible = !isHeart;
    heartEyeRef.current.visible = isHeart;

    const cycle = clock.getElapsedTime() % blinkCycle;
    let targetScaleY = 1;
    if (cycle < blinkDuration && !isHeart) {
      const progress = cycle / blinkDuration;
      const blinkClose = Math.sin(progress * Math.PI);
      targetScaleY = Math.max(0.05, 1.0 - blinkClose);
    }
    groupRef.current.scale.set(scale, scale * targetScaleY, scale);
  });

  const { topPath, bottomPath } = useMemo(() => {
    const w = 0.025;
    const h = 0.035;
    const r = 0.02;
    const g = 0.005;
    const tPath = new THREE.CurvePath<THREE.Vector3>();
    tPath.add(new THREE.LineCurve3(new THREE.Vector3(-w, g, 0), new THREE.Vector3(-w, h - r, 0)));
    tPath.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-w, h - r, 0), new THREE.Vector3(-w, h, 0), new THREE.Vector3(-w + r, h, 0)));
    tPath.add(new THREE.LineCurve3(new THREE.Vector3(-w + r, h, 0), new THREE.Vector3(w - r, h, 0)));
    tPath.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(w - r, h, 0), new THREE.Vector3(w, h, 0), new THREE.Vector3(w, h - r, 0)));
    tPath.add(new THREE.LineCurve3(new THREE.Vector3(w, h - r, 0), new THREE.Vector3(w, g, 0)));

    const bPath = new THREE.CurvePath<THREE.Vector3>();
    bPath.add(new THREE.LineCurve3(new THREE.Vector3(-w, -g, 0), new THREE.Vector3(-w, -(h - r), 0)));
    bPath.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-w, -(h - r), 0), new THREE.Vector3(-w, -h, 0), new THREE.Vector3(-w + r, -h, 0)));
    bPath.add(new THREE.LineCurve3(new THREE.Vector3(-w + r, -h, 0), new THREE.Vector3(w - r, -h, 0)));
    bPath.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(w - r, -h, 0), new THREE.Vector3(w, -h, 0), new THREE.Vector3(w, -(h - r), 0)));
    bPath.add(new THREE.LineCurve3(new THREE.Vector3(w, -(h - r), 0), new THREE.Vector3(w, -g, 0)));
    return { topPath: tPath, bottomPath: bPath };
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh ref={heartEyeRef} visible={false} material={heartMat}>
        <tubeGeometry args={[sharedHeartCurve, 64, 0.0035, 8, true]} />
      </mesh>
      <group ref={normalEyesRef}>
        <mesh material={eyeMat}>
          <tubeGeometry args={[topPath, 20, 0.0035, 8, false]} />
        </mesh>
        <mesh material={eyeMat}>
          <tubeGeometry args={[bottomPath, 20, 0.0035, 8, false]} />
        </mesh>
      </group>
    </group>
  );
}

function RobotPrototype({ reduced }: { reduced: boolean }) {
  const isLovedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const design = {
    separacionOjos: 0.07,
    tamañoOrejas: 1.3,
    escalaOjos: 1.1,
    alturaCabeza: 0.6,
  };

  // Calmer than the original: softer look, gentler tracking.
  const config = {
    moveSpeed: 0.28,
    bodyRotSpeed: 7.0,
    headRotSpeed: 12.0,
    bodyTiltY: 0.7,
    headLookX: 0.22,
    headLookY: 1.3,
  };

  const neckProfile = useMemo(() => {
    const p = {
      baseR: 0.215, baseH: -0.05, midR: 0.28, midH: 0.02,
      lipBottomR: 0.295, lipBottomH: 0.045, lipTopR: 0.27, lipTopH: 0.055,
      innerR: 0.1, innerDropH: 0.0,
    };
    return [
      new THREE.Vector2(p.innerR, p.baseH),
      new THREE.Vector2(p.baseR, p.baseH),
      new THREE.Vector2(p.midR, p.midH),
      new THREE.Vector2(p.lipBottomR, p.lipBottomH),
      new THREE.Vector2(p.lipTopR, p.lipTopH),
      new THREE.Vector2(p.innerR, p.lipTopH),
      new THREE.Vector2(p.innerR, p.lipTopH - p.innerDropH),
    ];
  }, []);

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;
    const dt = Math.min(delta, 0.1);

    if (reduced) {
      // idle: a slow breathing sway, no pointer coupling
      const t = state.clock.getElapsedTime();
      bodyRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.1;
      headRef.current.rotation.x = Math.sin(t * 0.6) * 0.03;
      return;
    }

    const tx = state.pointer.x;
    const ty = state.pointer.y;
    const relativeX = tx;

    const bodyTargetRotY = -relativeX * config.bodyTiltY;
    const bodyTargetRotX = -ty * 0.18;
    const bodyTargetRotZ = -relativeX * 0.1;
    bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, bodyTargetRotY, config.bodyRotSpeed * dt);
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, bodyTargetRotX, config.bodyRotSpeed * dt);
    bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, bodyTargetRotZ, config.bodyRotSpeed * dt);

    headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, relativeX * config.headLookY, config.headRotSpeed * dt);
    headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -ty * config.headLookX, config.headRotSpeed * dt);
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isLovedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isLovedRef.current = false;
    }, 2000);
  };

  return (
    <group
      ref={bodyRef}
      position={[0, -0.3, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {/* body */}
      <mesh castShadow receiveShadow material={chromeMat}>
        <sphereGeometry args={[0.43, 64, 64, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.85]} />
      </mesh>
      {/* bevel ring */}
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={ringMat}>
        <torusGeometry args={[0.235, 0.025, 32, 64]} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.38, 0]} castShadow material={chromeMat}>
        <latheGeometry args={[neckProfile, 64]} />
      </mesh>

      {/* head */}
      <group ref={headRef} position={[0, design.alturaCabeza, 0]}>
        <mesh material={darkMat} castShadow>
          <sphereGeometry args={[0.28, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
        </mesh>
        <GlassCapsule />
        <group position={[0, -0.02, 0.29]}>
          <RobotEye position={[-design.separacionOjos, 0, 0]} rotation={[0, -0.2, 0]} scale={design.escalaOjos} isLovedRef={isLovedRef} />
          <RobotEye position={[design.separacionOjos, 0, 0]} rotation={[0, 0.2, 0]} scale={design.escalaOjos} isLovedRef={isLovedRef} />
        </group>
        <RobotEar position={[-0.29, 0, 0]} isLeft scale={design.tamañoOrejas} />
        <RobotEar position={[0.29, 0, 0]} scale={design.tamañoOrejas} />
      </group>
    </group>
  );
}

export default function RobotScene() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.2, 6], fov: 40 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      {/* dark, moody base */}
      <ambientLight intensity={0.35} />
      {/* key */}
      <directionalLight position={[3, 5, 4]} intensity={0.8} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}>
        <orthographicCamera attach="shadow-camera" args={[-1.5, 1.5, 1.5, -1.5, 0.1, 20]} />
      </directionalLight>
      {/* violet rim light from behind */}
      <directionalLight position={[-4, 2, -5]} intensity={3.2} color={ACCENT} />
      <pointLight position={[0, 1.5, -2]} intensity={6} color={ACCENT} distance={8} />

      <Suspense fallback={null}>
        {/* Procedural reflections for the chrome — Lightformers build the env map
            in-engine, so nothing is fetched over the network. */}
        <Environment resolution={256} environmentIntensity={0.55}>
          <Lightformer intensity={2.4} color={ACCENT} position={[-3, 1, -4]} scale={[5, 5, 1]} />
          <Lightformer intensity={1.4} color="#ffffff" position={[3, 3, 2]} scale={[3, 3, 1]} />
          <Lightformer intensity={0.7} color="#5a5a7a" position={[0, -3, 3]} scale={[8, 3, 1]} />
          <Lightformer intensity={1.1} color="#9b84ff" position={[0, 3, -3]} scale={[6, 2, 1]} />
        </Environment>

        <ResponsiveGroup>
          <ContactShadows position={[0, -0.8, 0]} opacity={0.6} scale={12} resolution={1024} blur={2.2} far={2.5} color="#000000" />
          <RobotPrototype reduced={reduced} />
        </ResponsiveGroup>
      </Suspense>
    </Canvas>
  );
}
