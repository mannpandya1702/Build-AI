/**
 * RoofScene.tsx
 * -----------------------------------------------------------------------------
 * The R3F Canvas: camera rig, golden-hour lighting, and the procedural house.
 *
 * The canvas is TRANSPARENT: the golden-hour sky is a CSS gradient behind it
 * (HeroPoster), which keeps the sky perfectly smooth at any resolution and
 * doubles as the lazy-load poster. Warm fog fades the ground plane into the
 * horizon so the 3D blends seamlessly into the gradient.
 *
 * This is the single component that owns the scroll-driven 3D visual; the rest
 * of the page knows nothing about Three.js.
 *
 * Performance: dpr capped [1, 1.75]; frameloop "never" when the hero is out of
 * view; camera + lights read progress via getProgress() inside useFrame.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
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
// Radii are generous on purpose: the WHOLE house must stay in frame with
// margin at every phase (fov 42). House spans roughly y -1.35..1.85, x ±2.8.
const DESKTOP_KEYS: Keyframe[] = [
  { p: 0.0, radius: 13.6, theta: 0.3, phi: 1.22, ty: 0.15 },
  { p: 0.15, radius: 12.4, theta: 0.36, phi: 1.16, ty: 0.2 },
  { p: 0.4, radius: 11.2, theta: 0.62, phi: 1.12, ty: 0.3 },
  { p: 0.65, radius: 10.8, theta: 1.05, phi: 1.08, ty: 0.35 },
  { p: 0.9, radius: 11.3, theta: 0.78, phi: 1.12, ty: 0.32 },
  { p: 1.0, radius: 11.5, theta: 0.74, phi: 1.13, ty: 0.32 },
]

// Mobile: gentle vertical pan, almost no orbit, extra distance for the
// narrow viewport.
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
    // Weighted follow for a slow, non-jittery feel.
    state.camera.position.lerp(desired.current, 0.06)
    target.current.lerp(desiredTarget.current, 0.06)
    state.camera.lookAt(target.current)
  })

  return null
}

/**
 * Golden-hour lighting: a warm low sun, a soft blue-sky hemisphere fill, and
 * a copper glint that sweeps the roof during the shingle phase. Scroll warms
 * the sun slightly further; the scene is bright from the very start.
 */
function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const glint = useRef<THREE.PointLight>(null)

  const sunEarly = useMemo(() => new THREE.Color('#ffe4b8'), [])
  const sunLate = useMemo(() => new THREE.Color('#ffcf94'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    const p = getProgress()
    if (sun.current) {
      tmp.copy(sunEarly).lerp(sunLate, p)
      sun.current.color.copy(tmp)
      sun.current.intensity = lerp(1.7, 2.1, p)
    }
    if (glint.current) {
      const g = Math.sin(Math.PI * clamp01(range(p, 0.65, 0.92)))
      glint.current.intensity = g * 2.6
      glint.current.position.x = lerp(-3.2, 3.2, clamp01(range(p, 0.65, 0.92)))
    }
  })

  return (
    <>
      {/* blue sky above, warm bounce from the ground below */}
      <hemisphereLight args={['#cfe0f0', '#e8cfa4', 0.85]} />
      {/* low warm sun */}
      <directionalLight
        ref={sun}
        position={[6, 5, 4]}
        intensity={1.7}
        castShadow={false}
      />
      {/* soft cool fill from the opposite side so shadows stay readable */}
      <directionalLight position={[-6, 3, -4]} intensity={0.5} color="#bcd0e6" />
      {/* copper glint that sweeps across during the shingle phase */}
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
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [4, 3, 13], fov: 42, near: 0.1, far: 120 }}
    >
      {/* No scene background: the CSS golden sky shows through. Warm haze
          fades the ground disc into the horizon gradient. */}
      <fog attach="fog" args={['#eed7b0', 16, 44]} />
      <Lights />
      <CameraRig simplified={simplified} />
      <RoofModel rafterCount={rafterCount} />
    </Canvas>
  )
}
