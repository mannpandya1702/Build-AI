/**
 * RoofScene.tsx
 * -----------------------------------------------------------------------------
 * The R3F Canvas: camera rig, lighting, and the procedural roof.
 *
 * This is the single component that owns the scroll-driven 3D visual. The rest
 * of the page (overlay, sections) knows nothing about Three.js, so a
 * pre-rendered frame-sequence hero could drop in here later without touching
 * anything else.
 *
 * Performance:
 *  - dpr capped to [1, 1.75]
 *  - frameloop switches to "never" when the hero scrolls out of view
 *  - camera + lights read progress via getProgress() inside useFrame (no React
 *    re-render per frame)
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
  ty: number // target height
}

// Camera choreography: wide -> dolly in -> arc to show the slope -> settle.
const DESKTOP_KEYS: Keyframe[] = [
  { p: 0.0, radius: 10.6, theta: 0.26, phi: 1.16, ty: 0.5 },
  { p: 0.15, radius: 9.6, theta: 0.31, phi: 1.1, ty: 0.6 },
  { p: 0.4, radius: 7.3, theta: 0.56, phi: 1.02, ty: 0.78 },
  { p: 0.65, radius: 6.7, theta: 1.0, phi: 0.92, ty: 0.88 },
  { p: 0.9, radius: 6.8, theta: 0.75, phi: 0.95, ty: 0.88 },
  { p: 1.0, radius: 7.0, theta: 0.71, phi: 0.97, ty: 0.88 },
]

// Mobile: keep it simple. A gentle vertical pan, almost no orbit.
const MOBILE_KEYS: Keyframe[] = [
  { p: 0.0, radius: 11.6, theta: 0.12, phi: 1.2, ty: 0.5 },
  { p: 0.4, radius: 10.2, theta: 0.16, phi: 1.05, ty: 0.75 },
  { p: 0.7, radius: 9.6, theta: 0.2, phi: 0.96, ty: 0.9 },
  { p: 1.0, radius: 9.6, theta: 0.18, phi: 0.98, ty: 0.9 },
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
  const target = useRef(new THREE.Vector3(0, 0.6, 0))
  const desired = useRef(new THREE.Vector3())

  useFrame((state) => {
    const p = getProgress()
    const k = interpKeys(keys, p)
    const sinPhi = Math.sin(k.phi)
    desired.current.set(
      k.radius * sinPhi * Math.sin(k.theta),
      k.radius * Math.cos(k.phi),
      k.radius * sinPhi * Math.cos(k.theta),
    )
    // Weighted follow for a slow, non-jittery feel.
    state.camera.position.lerp(desired.current, 0.06)
    target.current.lerp(new THREE.Vector3(0, k.ty, 0), 0.06)
    state.camera.lookAt(target.current)
  })

  return null
}

/**
 * Lighting shifts from cool dawn blue to warm daylight as scroll progresses,
 * plus a copper glint light that sweeps across during the shingle phase.
 */
function Lights() {
  const keyLight = useRef<THREE.DirectionalLight>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const glint = useRef<THREE.PointLight>(null)

  const dawn = useMemo(() => new THREE.Color('#6f86b8'), [])
  const day = useMemo(() => new THREE.Color('#ffe2b8'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    const p = getProgress()
    if (keyLight.current) {
      tmp.copy(dawn).lerp(day, p)
      keyLight.current.color.copy(tmp)
      keyLight.current.intensity = lerp(0.55, 1.5, p)
    }
    if (ambient.current) {
      tmp.copy(dawn).lerp(day, p)
      ambient.current.color.copy(tmp)
      ambient.current.intensity = lerp(0.35, 0.65, p)
    }
    if (glint.current) {
      const g = Math.sin(Math.PI * clamp01(range(p, 0.65, 0.92)))
      glint.current.intensity = g * 3.2
      glint.current.position.x = lerp(-3.2, 3.2, clamp01(range(p, 0.65, 0.92)))
    }
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.35} />
      <directionalLight
        ref={keyLight}
        position={[4, 6, 3]}
        intensity={0.55}
        castShadow={false}
      />
      {/* cool rim from behind to separate the frame from the dark canvas */}
      <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#5a6f9c" />
      {/* copper glint that sweeps across during the shingle phase */}
      <pointLight
        ref={glint}
        position={[0, 2.2, 1.4]}
        intensity={0}
        color="#ffb066"
        distance={9}
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
      camera={{ position: [0, 4, 10], fov: 42, near: 0.1, far: 100 }}
    >
      <color attach="background" args={['#0e0f12']} />
      <fog attach="fog" args={['#0e0f12', 12, 26]} />
      <Lights />
      <CameraRig simplified={simplified} />
      <RoofModel rafterCount={rafterCount} />
    </Canvas>
  )
}
