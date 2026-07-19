/**
 * RoofModel.tsx
 * -----------------------------------------------------------------------------
 * A stylized parametric gable roof, built entirely in code (no external assets).
 *
 * The SAME geometry carries two looks that crossfade as the hero scroll
 * progress `p` advances:
 *   - Blueprint: glowing amber-white edges on the dark canvas (thin, technical).
 *   - Solid: filled decking planes, then a procedural shingle course, with a
 *     copper accent resolving on the ridge.
 *
 * All animation is driven by reading `getProgress()` inside useFrame. This
 * component never re-renders from React state during scroll.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getProgress } from '../../store/useScrollStore'
import { clamp01, lerp, phase, range } from '../../lib/math'

// --- Parametric dimensions (world units) -----------------------------------
const RIDGE_LEN = 5.4 // along X (the ridge / peak)
const HALF_W = 2.0 // center to eave along Z (one slope)
const HEIGHT = 1.7 // ridge height above the eave line
const BEAM = 0.075 // structural member thickness

const SLOPE_LEN = Math.hypot(HALF_W, HEIGHT)
const SLOPE_ANGLE = Math.atan2(HALF_W, HEIGHT) // tilt of a slope about X

// --- Palette ---------------------------------------------------------------
const C_EDGE = new THREE.Color('#ffd9a8') // blueprint amber-white
const C_FRAME = new THREE.Color('#33383f') // solid structural members
const C_UNDERLAY = new THREE.Color('#20242a') // decking / underlayment
const C_RIDGE_COLD = new THREE.Color('#3a3f47')
const C_RIDGE_COPPER = new THREE.Color('#e0863a')
const C_SHINGLE_EMIT = new THREE.Color('#e0863a')

/**
 * Procedurally paints an asphalt shingle course to an offscreen canvas and
 * returns it as a repeating texture. No image files involved.
 */
function createShingleTexture(): THREE.Texture {
  const w = 256
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.Texture()

  // Base course color.
  ctx.fillStyle = '#2b2f35'
  ctx.fillRect(0, 0, w, h)

  const rows = 6
  const rowH = h / rows
  for (let r = 0; r < rows; r++) {
    const y = r * rowH
    // Alternating course shading for depth.
    const shade = r % 2 === 0 ? '#31363d' : '#282c32'
    ctx.fillStyle = shade
    ctx.fillRect(0, y, w, rowH - 2)

    // Shadow line at the butt edge of each course.
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, y + rowH - 3, w, 3)

    // Staggered tab seams.
    const tabs = 8
    const offset = (r % 2) * (w / tabs / 2)
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    for (let t = 0; t <= tabs; t++) {
      const x = t * (w / tabs) + offset
      ctx.fillRect(x, y, 1.5, rowH - 3)
    }
  }

  // Faint granular speckle for a matte asphalt read.
  ctx.fillStyle = 'rgba(255,255,255,0.02)'
  for (let i = 0; i < 900; i++) {
    const x = (i * 97.13) % w
    const y = (i * 53.77) % h
    ctx.fillRect(x, y, 1, 1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(RIDGE_LEN / 0.7, SLOPE_LEN / 0.7)
  tex.anisotropy = 4
  return tex
}

interface RoofModelProps {
  rafterCount: number
}

export default function RoofModel({ rafterCount }: RoofModelProps) {
  // ---- Shared materials (animated once per frame) -------------------------
  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: C_EDGE,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  )
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_FRAME,
        roughness: 0.85,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const underlayMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_UNDERLAY,
        roughness: 0.95,
        metalness: 0.0,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const shingleTex = useMemo(() => createShingleTexture(), [])
  const shingleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: shingleTex,
        color: '#ffffff',
        roughness: 0.9,
        metalness: 0.04,
        transparent: true,
        opacity: 0,
        emissive: C_SHINGLE_EMIT,
        emissiveIntensity: 0,
        side: THREE.DoubleSide,
      }),
    [shingleTex],
  )
  const ridgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_RIDGE_COLD.clone(),
        roughness: 0.5,
        metalness: 0.35,
        transparent: true,
        opacity: 0,
        emissive: C_RIDGE_COPPER,
        emissiveIntensity: 0,
      }),
    [],
  )

  // ---- Geometries (memoized) ----------------------------------------------
  const rafterGeo = useMemo(
    () => new THREE.BoxGeometry(BEAM, SLOPE_LEN, BEAM),
    [],
  )
  const rafterEdges = useMemo(() => new THREE.EdgesGeometry(rafterGeo), [rafterGeo])
  const ridgeGeo = useMemo(
    () => new THREE.BoxGeometry(RIDGE_LEN + BEAM, BEAM * 1.6, BEAM * 1.6),
    [],
  )
  const ridgeEdges = useMemo(() => new THREE.EdgesGeometry(ridgeGeo), [ridgeGeo])
  const deckGeo = useMemo(
    () => new THREE.PlaneGeometry(RIDGE_LEN, SLOPE_LEN, 1, 1),
    [],
  )
  const deckEdges = useMemo(() => new THREE.EdgesGeometry(deckGeo), [deckGeo])
  const triGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // Gable triangle in the local Y-Z plane (normal along X).
    const verts = new Float32Array([
      0, 0, -HALF_W, // eave left
      0, 0, HALF_W, // eave right
      0, HEIGHT, 0, // ridge
    ])
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    g.setIndex([0, 1, 2])
    g.computeVertexNormals()
    return g
  }, [])
  const triEdges = useMemo(() => new THREE.EdgesGeometry(triGeo), [triGeo])
  const wallGeo = useMemo(
    () => new THREE.BoxGeometry(RIDGE_LEN, 1.1, HALF_W * 2),
    [],
  )
  const wallEdges = useMemo(() => new THREE.EdgesGeometry(wallGeo), [wallGeo])

  // ---- Rafter layout ------------------------------------------------------
  const rafters = useMemo(() => {
    const list: {
      x: number
      side: -1 | 1
      pos: [number, number, number]
      rot: [number, number, number]
      stagger: number
    }[] = []
    const n = Math.max(3, rafterCount)
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1)
      const x = lerp(-RIDGE_LEN / 2, RIDGE_LEN / 2, t)
      const stagger = t // 0..1 along the ridge, used to stagger the assemble
      // Left slope
      list.push({
        x,
        side: -1,
        pos: [x, HEIGHT / 2, -HALF_W / 2],
        rot: [SLOPE_ANGLE, 0, 0],
        stagger,
      })
      // Right slope
      list.push({
        x,
        side: 1,
        pos: [x, HEIGHT / 2, HALF_W / 2],
        rot: [-SLOPE_ANGLE, 0, 0],
        stagger,
      })
    }
    return list
  }, [rafterCount])

  // Collar ties: a few horizontal members partway up, spanning the two slopes.
  const collarTies = useMemo(() => {
    const yTie = HEIGHT * 0.52
    const span = HALF_W * 2 * (1 - yTie / HEIGHT)
    const xs = [-RIDGE_LEN * 0.32, 0, RIDGE_LEN * 0.32]
    return { yTie, span, xs }
  }, [])
  const tieGeo = useMemo(
    () => new THREE.BoxGeometry(BEAM, BEAM, collarTies.span),
    [collarTies.span],
  )
  const tieEdges = useMemo(() => new THREE.EdgesGeometry(tieGeo), [tieGeo])

  // ---- Animation refs -----------------------------------------------------
  const rafterRefs = useRef<(THREE.Group | null)[]>([])
  const glintOffset = useRef(0)

  useFrame(() => {
    const p = getProgress()

    // Phase-local drivers.
    const pRafter = range(p, 0.15, 0.4)
    const pDeck = phase(p, 0.4, 0.65)
    const pShingle = phase(p, 0.65, 0.9)

    // Blueprint edges: bright early, settle to faint technical lines.
    edgeMat.opacity = lerp(0.92, 0.16, phase(p, 0.35, 0.7))

    // Structure fills in as the frame completes.
    frameMat.opacity = phase(p, 0.28, 0.6)
    ridgeMat.opacity = phase(p, 0.28, 0.6)

    // Rafters grow into place, staggered along the ridge.
    for (let i = 0; i < rafterRefs.current.length; i++) {
      const g = rafterRefs.current[i]
      if (!g) continue
      const st = rafters[i]?.stagger ?? 0
      // Each rafter starts a little after the previous one.
      const local = clamp01((pRafter - st * 0.35) / 0.65)
      const grow = local * local * (3 - 2 * local) // smoothstep
      g.scale.set(1, grow, 1)
      g.visible = grow > 0.001
    }

    // Decking: underlayment fades in, shingles resolve over it.
    underlayMat.opacity = pDeck * (1 - 0.25 * pShingle)
    shingleMat.opacity = pShingle

    // Copper resolves on the ridge and a warm emissive on the shingles.
    ridgeMat.color.copy(C_RIDGE_COLD).lerp(C_RIDGE_COPPER, pShingle)
    ridgeMat.emissiveIntensity = pShingle * 0.5
    ridgeMat.metalness = lerp(0.35, 0.8, pShingle)

    // A soft glint sweeps across the finished roof during the shingle phase.
    const glint = Math.sin(Math.PI * clamp01(range(p, 0.65, 0.92)))
    glintOffset.current = glint
    shingleMat.emissiveIntensity = glint * 0.14
  })

  return (
    <group position={[0, -0.35, 0]}>
      {/* Ridge beam (copper accent resolves here) */}
      <mesh geometry={ridgeGeo} material={ridgeMat} position={[0, HEIGHT, 0]} />
      <lineSegments
        geometry={ridgeEdges}
        material={edgeMat}
        position={[0, HEIGHT, 0]}
      />

      {/* Rafters (grouped so each can grow independently) */}
      {rafters.map((r, i) => (
        <group
          key={i}
          ref={(el) => {
            rafterRefs.current[i] = el
          }}
          position={r.pos}
          rotation={r.rot}
        >
          <mesh geometry={rafterGeo} material={frameMat} />
          <lineSegments geometry={rafterEdges} material={edgeMat} />
        </group>
      ))}

      {/* Collar ties */}
      {collarTies.xs.map((x, i) => (
        <group key={`tie-${i}`} position={[x, collarTies.yTie, 0]}>
          <mesh geometry={tieGeo} material={frameMat} />
          <lineSegments geometry={tieEdges} material={edgeMat} />
        </group>
      ))}

      {/* Gable-end triangles */}
      {[-1, 1].map((s) => (
        <group key={`gable-${s}`} position={[(s * (RIDGE_LEN + BEAM)) / 2, 0, 0]}>
          <mesh geometry={triGeo} material={underlayMat} />
          <lineSegments geometry={triEdges} material={edgeMat} />
        </group>
      ))}

      {/* Decking planes: underlayment + shingle course, per slope */}
      {[
        { z: -HALF_W / 2, rotX: SLOPE_ANGLE },
        { z: HALF_W / 2, rotX: -SLOPE_ANGLE },
      ].map((slope, i) => (
        <group
          key={`deck-${i}`}
          position={[0, HEIGHT / 2, slope.z]}
          rotation={[slope.rotX, 0, 0]}
        >
          {/* blueprint outline of the deck plane */}
          <lineSegments geometry={deckEdges} material={edgeMat} />
          {/* underlayment */}
          <mesh geometry={deckGeo} material={underlayMat} position={[0, 0, 0.005]} />
          {/* shingle course, sitting a hair proud of the underlayment */}
          <mesh geometry={deckGeo} material={shingleMat} position={[0, 0, 0.02]} />
        </group>
      ))}

      {/* Simple wall box beneath, for grounding */}
      <group position={[0, -0.55, 0]}>
        <mesh geometry={wallGeo} material={underlayMat} />
        <lineSegments geometry={wallEdges} material={edgeMat} />
      </group>
    </group>
  )
}
