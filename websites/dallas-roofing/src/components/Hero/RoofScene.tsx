/**
 * RoofScene.tsx
 * -----------------------------------------------------------------------------
 * The R3F Canvas: camera rig, golden-hour lighting, image-based environment,
 * and the procedural house.
 *
 * Toward photoreal (all procedural, no external asset files):
 *   - Image-based lighting from a procedural <Environment> built out of
 *     <Lightformer> planes (sky, warm sun, ground bounce). This gives the
 *     glass/ridge real reflections and the whole model soft ambient light.
 *   - Real soft shadow maps from the sun. Shadow casting is toggled on only
 *     once the house is solid, so the blueprint phase stays clean.
 *   - ACES tone mapping with tuned exposure for a cinematic, bright look.
 *
 * The canvas is TRANSPARENT: the golden-hour sky is a CSS gradient behind it
 * (HeroPoster), which keeps the sky perfectly smooth at any resolution.
 *
 * Performance: dpr capped [1, 2]; frameloop "never" when the hero is out of
 * view; camera + lights read progress via getProgress() inside useFrame.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA, N8AO } from '@react-three/postprocessing'
import * as THREE from 'three'
import { getProgress } from '../../store/useScrollStore'
import { clamp01, lerp, range } from '../../lib/math'
import RoofModel from './RoofModel'

interface Keyframe {
  p: number
  radius: number
  theta: number // azimuth around Y
  phi: number // polar from +Y
  ty: number // look-at height (world)
}

// Camera choreography: wide -> dolly in -> arc to show the slope -> settle.
// Radii keep the WHOLE house in frame with margin at every phase (fov 42).
const DESKTOP_KEYS: Keyframe[] = [
  { p: 0.0, radius: 13.6, theta: 0.3, phi: 1.22, ty: 0.15 },
  { p: 0.15, radius: 12.4, theta: 0.36, phi: 1.16, ty: 0.2 },
  { p: 0.4, radius: 11.2, theta: 0.62, phi: 1.12, ty: 0.3 },
  { p: 0.65, radius: 10.8, theta: 1.05, phi: 1.08, ty: 0.35 },
  { p: 0.9, radius: 11.3, theta: 0.78, phi: 1.12, ty: 0.32 },
  { p: 1.0, radius: 11.5, theta: 0.74, phi: 1.13, ty: 0.32 },
]

// Mobile: gentle vertical pan, almost no orbit, extra distance.
const MOBILE_KEYS: Keyframe[] = [
  { p: 0.0, radius: 16.4, theta: 0.14, phi: 1.24, ty: 0.15 },
  { p: 0.4, radius: 14.6, theta: 0.18, phi: 1.12, ty: 0.25 },
  { p: 0.7, radius: 13.8, theta: 0.22, phi: 1.04, ty: 0.32 },
  { p: 1.0, radius: 13.8, theta: 0.2, phi: 1.06, ty: 0.3 },
]

function interpKeys(keys: Keyframe[], p: number): Keyframe {
  if (p <= keys[0].p) return keys[0]
  if (p >= keys[keys.length - 1].p) return keys[keys.length - 1]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (p >= a.p && p <= b.p) {
      const t = (p - a.p) / (b.p - a.p)
      const e = t * t * (3 - 2 * t) // smoothstep
      return {
        p,
        radius: lerp(a.radius, b.radius, e),
        theta: lerp(a.theta, b.theta, e),
        phi: lerp(a.phi, b.phi, e),
        ty: lerp(a.ty, b.ty, e),
      }
    }
  }
  return keys[keys.length - 1]
}

function CameraRig({ simplified }: { simplified: boolean }) {
  const keys = simplified ? MOBILE_KEYS : DESKTOP_KEYS
  const target = useRef(new THREE.Vector3(0, 0.2, 0))
  const desired = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())

  useFrame((state) => {
    const p = getProgress()
    const k = interpKeys(keys, p)
    const sinPhi = Math.sin(k.phi)
    desired.current.set(
      k.radius * sinPhi * Math.sin(k.theta),
      k.radius * Math.cos(k.phi),
      k.radius * sinPhi * Math.cos(k.theta),
    )
    desiredTarget.current.set(0, k.ty, 0)
    state.camera.position.lerp(desired.current, 0.06)
    target.current.lerp(desiredTarget.current, 0.06)
    state.camera.lookAt(target.current)
  })

  return null
}

/**
 * Golden-hour lighting. A warm low sun casts real soft shadows (enabled only
 * once the house is solid), a cool fill keeps shadows readable, and a copper
 * glint sweeps the roof during the shingle phase.
 */
function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const glint = useRef<THREE.PointLight>(null)

  const sunEarly = useMemo(() => new THREE.Color('#ffe6bc'), [])
  const sunLate = useMemo(() => new THREE.Color('#ffcf94'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    const p = getProgress()
    if (sun.current) {
      tmp.copy(sunEarly).lerp(sunLate, p)
      sun.current.color.copy(tmp)
      sun.current.intensity = lerp(2.4, 3.4, p)
      // Shadows only once the house is solid enough to cast a real one.
      sun.current.castShadow = p > 0.45
    }
    if (glint.current) {
      const g = Math.sin(Math.PI * clamp01(range(p, 0.65, 0.92)))
      glint.current.intensity = g * 2.4
      glint.current.position.x = lerp(-3.2, 3.2, clamp01(range(p, 0.65, 0.92)))
    }
  })

  return (
    <>
      <hemisphereLight args={['#cfe0f0', '#e6cfa2', 0.38]} />
      <directionalLight
        ref={sun}
        position={[8, 5.5, 3.5]}
        intensity={2.4}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.028}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-7, 7, 7, -7, 0.1, 36]}
        />
      </directionalLight>
      <directionalLight position={[-6, 3, -4]} intensity={0.3} color="#bcd0e6" />
      <pointLight
        ref={glint}
        position={[0, 3.2, 1.6]}
        intensity={0}
        color="#ffb066"
        distance={10}
        decay={1.4}
      />
    </>
  )
}

/**
 * Procedural environment for image-based lighting. Built from emissive
 * Lightformer planes (rendered to a cubemap once), so the glass and copper
 * ridge get believable reflections with zero external HDRI files.
 */
function ProceduralEnv() {
  return (
    <Environment resolution={256} frames={1}>
      {/* warm sky dome */}
      <color attach="background" args={['#a9c4dc']} />
      {/* broad sky light from above */}
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#dce8f2"
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[20, 20, 1]}
      />
      {/* warm low sun */}
      <Lightformer
        form="circle"
        intensity={5}
        color="#ffd9a0"
        position={[7, 4, 5]}
        scale={[5, 5, 1]}
      />
      {/* warm ground bounce (kept low so the sun's shadow reads) */}
      <Lightformer
        form="rect"
        intensity={0.35}
        color="#e8c98f"
        position={[0, -4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[20, 20, 1]}
      />
    </Environment>
  )
}

interface RoofSceneProps {
  active: boolean
  simplified: boolean
  rafterCount: number
}

export default function RoofScene({
  active,
  simplified,
  rafterCount,
}: RoofSceneProps) {
  return (
    <Canvas
      className="h-full w-full"
      dpr={simplified ? [1, 1.5] : [1, 2]}
      shadows={!simplified}
      frameloop={active ? 'always' : 'never'}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [4, 3, 13], fov: 42, near: 0.1, far: 120 }}
    >
      {/* No scene background: the CSS golden sky shows through. Warm haze
          fades the ground disc into the horizon gradient. */}
      <fog attach="fog" args={['#ecd6ae', 16, 44]} />
      <ProceduralEnv />
      <Lights />
      <CameraRig simplified={simplified} />
      <RoofModel rafterCount={rafterCount} />
      {/* Postprocessing (desktop only): contact AO in the creases (under
          eaves, window reveals), a whisper of bloom on the sun/glint, and a
          soft vignette. Mobile runs the lighter scene to stay smooth. */}
      {!simplified && (
        <EffectComposer multisampling={0} enableNormalPass>
          <N8AO aoRadius={0.35} intensity={2.2} distanceFalloff={1} quality="medium" />
          <Bloom intensity={0.28} luminanceThreshold={0.75} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette offset={0.28} darkness={0.42} eskil={false} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}
