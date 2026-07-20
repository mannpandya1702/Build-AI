/**
 * RoofModel.tsx
 * -----------------------------------------------------------------------------
 * A stylized parametric HOUSE (walls, windows, door, gable roof), built
 * entirely in code. No external assets.
 *
 * Two looks crossfade as hero scroll progress `p` advances:
 *   - Blueprint: deep bronze technical edges drawn against the bright
 *     golden-hour sky.
 *   - Solid: cream stucco walls with window and door trim, warm timber frame,
 *     then a shingle course resolving with a copper ridge accent.
 *
 * All animation reads `getProgress()` inside useFrame. This component never
 * re-renders from React state during scroll.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getProgress } from '../../store/useScrollStore'
import { clamp01, lerp, phase, range } from '../../lib/math'

// --- Parametric dimensions (world units) -----------------------------------
const RIDGE_LEN = 5.4 // roof length along X
const HALF_W = 2.0 // roof center to eave along Z
const ROOF_H = 1.7 // ridge height above the eave line
const BEAM = 0.075 // structural member thickness

const WALL_H = 1.5 // wall height (ground to eave)
const EAVE = 0.28 // roof overhang beyond the walls
const WALL_LEN = RIDGE_LEN - EAVE * 2 // wall length along X
const WALL_DEP = HALF_W * 2 - EAVE * 2 // wall depth along Z

const SLOPE_LEN = Math.hypot(HALF_W, ROOF_H)
const SLOPE_ANGLE = Math.atan2(HALF_W, ROOF_H)

// --- Palette (golden-hour, bright) -----------------------------------------
const C_EDGE = new THREE.Color('#6e4a22') // blueprint bronze lines
const C_TIMBER = new THREE.Color('#b98a5c') // solid structural members
const C_WALL = new THREE.Color('#ede3d2') // cream stucco
const C_TRIM = new THREE.Color('#4a3a2c') // window/door trim
const C_GLASS = new THREE.Color('#b7d3e0') // window glass
const C_DOOR = new THREE.Color('#8a5a34') // wood door
const C_UNDERLAY = new THREE.Color('#c9b99f') // underlayment tan
const C_RIDGE_COLD = new THREE.Color('#8a8172')
const C_RIDGE_COPPER = new THREE.Color('#c9702a')
const C_SHINGLE_EMIT = new THREE.Color('#e0863a')
const C_GROUND_IN = '#d3bf9c' // ground near the house
const C_GROUND_OUT = '#eed7b0' // fades into the horizon haze

/** Procedural asphalt shingle course texture (bright, warm brown). */
function createShingleTexture(): THREE.Texture {
  const w = 256
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.Texture()

  ctx.fillStyle = '#6f5f50'
  ctx.fillRect(0, 0, w, h)

  const rows = 6
  const rowH = h / rows
  for (let r = 0; r < rows; r++) {
    const y = r * rowH
    const shade = r % 2 === 0 ? '#79695a' : '#65564a'
    ctx.fillStyle = shade
    ctx.fillRect(0, y, w, rowH - 2)

    ctx.fillStyle = 'rgba(43,32,20,0.5)'
    ctx.fillRect(0, y + rowH - 3, w, 3)

    const tabs = 8
    const offset = (r % 2) * (w / tabs / 2)
    ctx.fillStyle = 'rgba(43,32,20,0.3)'
    for (let t = 0; t <= tabs; t++) {
      const x = t * (w / tabs) + offset
      ctx.fillRect(x, y, 1.5, rowH - 3)
    }
  }

  ctx.fillStyle = 'rgba(255,244,220,0.05)'
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

/** Soft radial ground texture: warm earth under the house, haze at the rim. */
function createGroundTexture(): THREE.Texture {
  const s = 512
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.Texture()
  const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, C_GROUND_IN)
  grad.addColorStop(0.55, '#ddc8a2')
  grad.addColorStop(1, C_GROUND_OUT)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(canvas)
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
        opacity: 0.85,
      }),
    [],
  )
  const timberMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_TIMBER,
        roughness: 0.8,
        metalness: 0.05,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_WALL,
        roughness: 0.92,
        metalness: 0,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_TRIM,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_GLASS,
        roughness: 0.15,
        metalness: 0.4,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const doorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_DOOR,
        roughness: 0.75,
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
        metalness: 0,
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
  const groundTex = useMemo(() => createGroundTexture(), [])
  const groundMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: groundTex,
        roughness: 1,
        metalness: 0,
      }),
    [groundTex],
  )

  // ---- Geometries ---------------------------------------------------------
  const rafterGeo = useMemo(
    () => new THREE.BoxGeometry(BEAM, SLOPE_LEN, BEAM),
    [],
  )
  const rafterEdges = useMemo(() => new THREE.EdgesGeometry(rafterGeo), [rafterGeo])
  const ridgeGeo = useMemo(
    () => new THREE.BoxGeometry(RIDGE_LEN + BEAM, BEAM * 1.7, BEAM * 1.7),
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
      0, 0, -HALF_W + EAVE,
      0, 0, HALF_W - EAVE,
      0, ROOF_H * ((HALF_W - EAVE) / HALF_W), 0,
    ])
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    g.setIndex([0, 1, 2])
    g.computeVertexNormals()
    return g
  }, [])
  const triEdges = useMemo(() => new THREE.EdgesGeometry(triGeo), [triGeo])
  const wallGeo = useMemo(
    () => new THREE.BoxGeometry(WALL_LEN, WALL_H, WALL_DEP),
    [],
  )
  const wallEdges = useMemo(() => new THREE.EdgesGeometry(wallGeo), [wallGeo])
  const groundGeo = useMemo(() => new THREE.CircleGeometry(30, 48), [])

  // Window: trim frame + glass pane, applied to both long faces.
  const winFrameGeo = useMemo(() => new THREE.BoxGeometry(0.62, 0.78, 0.06), [])
  const winGlassGeo = useMemo(() => new THREE.PlaneGeometry(0.5, 0.66), [])
  const doorFrameGeo = useMemo(() => new THREE.BoxGeometry(0.56, 1.06, 0.06), [])
  const doorPanelGeo = useMemo(() => new THREE.PlaneGeometry(0.46, 0.96), [])

  // ---- Rafter layout ------------------------------------------------------
  const rafters = useMemo(() => {
    const list: {
      pos: [number, number, number]
      rot: [number, number, number]
      stagger: number
    }[] = []
    const n = Math.max(3, rafterCount)
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1)
      const x = lerp(-RIDGE_LEN / 2, RIDGE_LEN / 2, t)
      list.push({
        pos: [x, WALL_H + ROOF_H / 2, -HALF_W / 2],
        rot: [SLOPE_ANGLE, 0, 0],
        stagger: t,
      })
      list.push({
        pos: [x, WALL_H + ROOF_H / 2, HALF_W / 2],
        rot: [-SLOPE_ANGLE, 0, 0],
        stagger: t,
      })
    }
    return list
  }, [rafterCount])

  // Collar ties partway up the roof.
  const collarTies = useMemo(() => {
    const yTie = ROOF_H * 0.52
    const span = HALF_W * 2 * (1 - yTie / ROOF_H)
    const xs = [-RIDGE_LEN * 0.32, 0, RIDGE_LEN * 0.32]
    return { yTie, span, xs }
  }, [])
  const tieGeo = useMemo(
    () => new THREE.BoxGeometry(BEAM, BEAM, collarTies.span),
    [collarTies.span],
  )
  const tieEdges = useMemo(() => new THREE.EdgesGeometry(tieGeo), [tieGeo])

  // Window x-positions on the long walls.
  const windowXs = useMemo(() => [-WALL_LEN * 0.32, 0, WALL_LEN * 0.32], [])

  // ---- Animation ----------------------------------------------------------
  const rafterRefs = useRef<(THREE.Group | null)[]>([])

  useFrame(() => {
    const p = getProgress()

    const pRafter = range(p, 0.15, 0.4)
    const pDeck = phase(p, 0.4, 0.65)
    const pShingle = phase(p, 0.65, 0.9)
    const pSolid = phase(p, 0.28, 0.6)

    // Blueprint lines: crisp early, recede as the house becomes real.
    edgeMat.opacity = lerp(0.85, 0.1, phase(p, 0.35, 0.7))

    timberMat.opacity = pSolid
    ridgeMat.opacity = pSolid
    wallMat.opacity = pSolid
    trimMat.opacity = pDeck
    glassMat.opacity = pDeck * 0.92
    doorMat.opacity = pDeck

    for (let i = 0; i < rafterRefs.current.length; i++) {
      const g = rafterRefs.current[i]
      if (!g) continue
      const st = rafters[i]?.stagger ?? 0
      const local = clamp01((pRafter - st * 0.35) / 0.65)
      const grow = local * local * (3 - 2 * local)
      g.scale.set(1, grow, 1)
      g.visible = grow > 0.001
    }

    underlayMat.opacity = pDeck * (1 - 0.25 * pShingle)
    shingleMat.opacity = pShingle

    ridgeMat.color.copy(C_RIDGE_COLD).lerp(C_RIDGE_COPPER, pShingle)
    ridgeMat.emissiveIntensity = pShingle * 0.35
    ridgeMat.metalness = lerp(0.35, 0.75, pShingle)

    const glint = Math.sin(Math.PI * clamp01(range(p, 0.65, 0.92)))
    shingleMat.emissiveIntensity = glint * 0.1
  })

  // House base sits at local y=0; the group drops it so the scene center is
  // near the world origin for easy camera framing.
  return (
    <group position={[0, -1.35, 0]}>
      {/* Ground */}
      <mesh
        geometry={groundGeo}
        material={groundMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
      />

      {/* Walls */}
      <group position={[0, WALL_H / 2, 0]}>
        <mesh geometry={wallGeo} material={wallMat} />
        <lineSegments geometry={wallEdges} material={edgeMat} />
      </group>

      {/* Windows on both long faces */}
      {([-1, 1] as const).map((side) =>
        windowXs.map((x, i) => (
          <group
            key={`win-${side}-${i}`}
            position={[x, WALL_H * 0.52, side * (WALL_DEP / 2 + 0.001)]}
            rotation={[0, side === 1 ? 0 : Math.PI, 0]}
          >
            <mesh geometry={winFrameGeo} material={trimMat} />
            <mesh geometry={winGlassGeo} material={glassMat} position={[0, 0, 0.035]} />
          </group>
        )),
      )}

      {/* Door on the front gable end (+X) */}
      <group
        position={[WALL_LEN / 2 + 0.001, 0.53, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <mesh geometry={doorFrameGeo} material={trimMat} />
        <mesh geometry={doorPanelGeo} material={doorMat} position={[0, 0, 0.035]} />
      </group>
      {/* Small window on the back gable end (-X) */}
      <group
        position={[-WALL_LEN / 2 - 0.001, WALL_H * 0.55, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <mesh geometry={winFrameGeo} material={trimMat} />
        <mesh geometry={winGlassGeo} material={glassMat} position={[0, 0, 0.035]} />
      </group>

      {/* Ridge beam */}
      <mesh
        geometry={ridgeGeo}
        material={ridgeMat}
        position={[0, WALL_H + ROOF_H, 0]}
      />
      <lineSegments
        geometry={ridgeEdges}
        material={edgeMat}
        position={[0, WALL_H + ROOF_H, 0]}
      />

      {/* Rafters (each grows into place) */}
      {rafters.map((r, i) => (
        <group
          key={i}
          ref={(el) => {
            rafterRefs.current[i] = el
          }}
          position={r.pos}
          rotation={r.rot}
        >
          <mesh geometry={rafterGeo} material={timberMat} />
          <lineSegments geometry={rafterEdges} material={edgeMat} />
        </group>
      ))}

      {/* Collar ties */}
      {collarTies.xs.map((x, i) => (
        <group key={`tie-${i}`} position={[x, WALL_H + collarTies.yTie, 0]}>
          <mesh geometry={tieGeo} material={timberMat} />
          <lineSegments geometry={tieEdges} material={edgeMat} />
        </group>
      ))}

      {/* Gable-end triangles (stucco, matching the walls) */}
      {[-1, 1].map((s) => (
        <group key={`gable-${s}`} position={[(s * WALL_LEN) / 2, WALL_H, 0]}>
          <mesh geometry={triGeo} material={wallMat} />
          <lineSegments geometry={triEdges} material={edgeMat} />
        </group>
      ))}

      {/* Roof decking: underlayment + shingles, per slope */}
      {[
        { z: -HALF_W / 2, rotX: SLOPE_ANGLE },
        { z: HALF_W / 2, rotX: -SLOPE_ANGLE },
      ].map((slope, i) => (
        <group
          key={`deck-${i}`}
          position={[0, WALL_H + ROOF_H / 2, slope.z]}
          rotation={[slope.rotX, 0, 0]}
        >
          <lineSegments geometry={deckEdges} material={edgeMat} />
          <mesh geometry={deckGeo} material={underlayMat} position={[0, 0, 0.005]} />
          <mesh geometry={deckGeo} material={shingleMat} position={[0, 0, 0.02]} />
        </group>
      ))}
    </group>
  )
}
