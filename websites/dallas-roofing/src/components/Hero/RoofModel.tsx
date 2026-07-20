/**
 * RoofModel.tsx
 * -----------------------------------------------------------------------------
 * A stylized parametric HOUSE (walls, windows, door, gable roof), built
 * entirely in code. No external assets.
 *
 * Toward photoreal (all procedural):
 *   - PBR materials that respond to the image-based environment (envMap).
 *   - Procedural bump/relief on the shingles and stucco so surfaces catch the
 *     low sun.
 *   - Cast + received shadows (gated on by the scene once the house is solid).
 *
 * Two looks crossfade as hero scroll progress `p` advances:
 *   - Blueprint: deep bronze technical edges drawn against the bright sky.
 *   - Solid: cream stucco walls, framed windows, wood door, timber frame, then
 *     a shingle course resolving with a copper ridge accent.
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
const C_TRIM = new THREE.Color('#4a3a2c') // window/door trim
const C_GLASS = new THREE.Color('#aecad8') // window glass
const C_DOOR = new THREE.Color('#8a5a34') // wood door
const C_UNDERLAY = new THREE.Color('#c9b99f') // underlayment tan
const C_RIDGE_COLD = new THREE.Color('#8a8172')
const C_RIDGE_COPPER = new THREE.Color('#c9702a')
const C_SHINGLE_EMIT = new THREE.Color('#e0863a')
const C_GROUND_IN = '#cbb58f' // ground near the house
const C_GROUND_OUT = '#e9d2ab' // fades into the horizon haze

/** Value-noise helper for procedural textures (deterministic, no Math.random). */
function noise2(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}

/** Procedural asphalt shingle course: albedo + a matching grayscale height. */
function createShingle(): { map: THREE.Texture; bump: THREE.Texture } {
  const w = 512
  const h = 512
  const makeCanvas = () => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }
  const albedo = makeCanvas()
  const height = makeCanvas()
  const a = albedo.getContext('2d')
  const b = height.getContext('2d')
  if (!a || !b) return { map: new THREE.Texture(), bump: new THREE.Texture() }

  a.fillStyle = '#6f5f50'
  a.fillRect(0, 0, w, h)
  b.fillStyle = '#808080'
  b.fillRect(0, 0, w, h)

  const rows = 7
  const rowH = h / rows
  const tabs = 9
  const tabW = w / tabs
  for (let r = 0; r < rows; r++) {
    const y = r * rowH
    const offset = (r % 2) * (tabW / 2)
    // course base shading
    a.fillStyle = r % 2 === 0 ? '#79695a' : '#655649'
    a.fillRect(0, y, w, rowH - 2)
    // per-tab tonal variation
    for (let t = -1; t <= tabs; t++) {
      const x = t * tabW + offset
      const v = noise2(t + r * 3.1, r)
      const shade = 88 + Math.floor(v * 34)
      a.fillStyle = `rgb(${shade},${Math.floor(shade * 0.85)},${Math.floor(shade * 0.72)})`
      a.fillRect(x + 1, y + 2, tabW - 2, rowH - 6)
      // height: tab face raised, edges lower
      const hv = 150 + Math.floor(v * 40)
      b.fillStyle = `rgb(${hv},${hv},${hv})`
      b.fillRect(x + 1, y + 2, tabW - 2, rowH - 6)
    }
    // butt shadow line (albedo dark, height low)
    a.fillStyle = 'rgba(30,22,14,0.55)'
    a.fillRect(0, y + rowH - 4, w, 4)
    b.fillStyle = '#2a2a2a'
    b.fillRect(0, y + rowH - 4, w, 4)
    // vertical tab seams
    for (let t = 0; t <= tabs; t++) {
      const x = t * tabW + offset
      a.fillStyle = 'rgba(30,22,14,0.4)'
      a.fillRect(x, y, 2, rowH - 4)
      b.fillStyle = '#3a3a3a'
      b.fillRect(x, y, 2, rowH - 4)
    }
  }
  // granule speckle
  for (let i = 0; i < 5000; i++) {
    const x = noise2(i, 0.5) * w
    const y = noise2(i, 1.5) * h
    const l = noise2(i, 2.5)
    a.fillStyle =
      l > 0.5 ? 'rgba(255,240,210,0.05)' : 'rgba(20,14,8,0.06)'
    a.fillRect(x, y, 1.5, 1.5)
  }

  const mkTex = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(RIDGE_LEN / 0.62, SLOPE_LEN / 0.62)
    tex.anisotropy = 8
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }
  return { map: mkTex(albedo, true), bump: mkTex(height, false) }
}

/** Procedural stucco: warm off-white albedo + fine orange-peel height. */
function createStucco(): { map: THREE.Texture; bump: THREE.Texture } {
  const s = 512
  const mk = () => {
    const c = document.createElement('canvas')
    c.width = s
    c.height = s
    return c
  }
  const albedo = mk()
  const height = mk()
  const a = albedo.getContext('2d')
  const b = height.getContext('2d')
  if (!a || !b) return { map: new THREE.Texture(), bump: new THREE.Texture() }
  a.fillStyle = '#e9dfce'
  a.fillRect(0, 0, s, s)
  b.fillStyle = '#8a8a8a'
  b.fillRect(0, 0, s, s)
  for (let i = 0; i < 22000; i++) {
    const x = noise2(i, 3.1) * s
    const y = noise2(i, 6.7) * s
    const v = noise2(i, 9.3)
    const t = 205 + Math.floor(v * 34)
    a.fillStyle = `rgba(${t},${t - 8},${t - 22},0.5)`
    a.fillRect(x, y, 2, 2)
    const hv = 110 + Math.floor(v * 90)
    b.fillStyle = `rgba(${hv},${hv},${hv},0.5)`
    b.fillRect(x, y, 2, 2)
  }
  const mkTex = (c: HTMLCanvasElement, srgb: boolean) => {
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(3, 2)
    tex.anisotropy = 8
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }
  return { map: mkTex(albedo, true), bump: mkTex(height, false) }
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
  grad.addColorStop(0.55, '#dcc69f')
  grad.addColorStop(1, C_GROUND_OUT)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, s, s)
  // faint mottling
  for (let i = 0; i < 9000; i++) {
    const x = noise2(i, 4.2) * s
    const y = noise2(i, 8.4) * s
    const v = noise2(i, 1.9)
    ctx.fillStyle = v > 0.5 ? 'rgba(120,95,60,0.05)' : 'rgba(255,238,200,0.05)'
    ctx.fillRect(x, y, 3, 3)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
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
        opacity: 0.85,
      }),
    [],
  )
  const timberMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_TIMBER,
        roughness: 0.78,
        metalness: 0.0,
        envMapIntensity: 0.9,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const stucco = useMemo(() => createStucco(), [])
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: stucco.map,
        bumpMap: stucco.bump,
        bumpScale: 0.6,
        color: '#ffffff',
        roughness: 0.95,
        metalness: 0.0,
        envMapIntensity: 1.0,
        transparent: true,
        opacity: 0,
      }),
    [stucco],
  )
  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_TRIM,
        roughness: 0.6,
        metalness: 0.15,
        envMapIntensity: 1.0,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_GLASS,
        roughness: 0.08,
        metalness: 0.1,
        envMapIntensity: 1.6,
        transparent: true,
        opacity: 0,
      }),
    [],
  )
  const doorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_DOOR,
        roughness: 0.65,
        metalness: 0.05,
        envMapIntensity: 0.9,
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
        envMapIntensity: 0.8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const shingle = useMemo(() => createShingle(), [])
  const shingleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: shingle.map,
        bumpMap: shingle.bump,
        bumpScale: 1.1,
        color: '#ffffff',
        roughness: 0.82,
        metalness: 0.03,
        envMapIntensity: 0.7,
        transparent: true,
        opacity: 0,
        emissive: C_SHINGLE_EMIT,
        emissiveIntensity: 0,
        side: THREE.DoubleSide,
      }),
    [shingle],
  )
  const ridgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: C_RIDGE_COLD.clone(),
        roughness: 0.45,
        metalness: 0.35,
        envMapIntensity: 1.3,
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
        envMapIntensity: 0.6,
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

  const windowXs = useMemo(() => [-WALL_LEN * 0.32, 0, WALL_LEN * 0.32], [])

  // ---- Animation ----------------------------------------------------------
  const rafterRefs = useRef<(THREE.Group | null)[]>([])

  useFrame(() => {
    const p = getProgress()

    const pRafter = range(p, 0.15, 0.4)
    const pDeck = phase(p, 0.4, 0.65)
    const pShingle = phase(p, 0.65, 0.9)
    const pSolid = phase(p, 0.28, 0.6)

    edgeMat.opacity = lerp(0.85, 0.1, phase(p, 0.35, 0.7))

    timberMat.opacity = pSolid
    ridgeMat.opacity = pSolid
    wallMat.opacity = pSolid
    trimMat.opacity = pDeck
    glassMat.opacity = pDeck * 0.9
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
    ridgeMat.emissiveIntensity = pShingle * 0.3
    ridgeMat.metalness = lerp(0.35, 0.8, pShingle)

    const glint = Math.sin(Math.PI * clamp01(range(p, 0.65, 0.92)))
    shingleMat.emissiveIntensity = glint * 0.09
  })

  return (
    <group position={[0, -1.35, 0]}>
      {/* Ground (receives shadows) */}
      <mesh
        geometry={groundGeo}
        material={groundMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      />

      {/* Walls */}
      <group position={[0, WALL_H / 2, 0]}>
        <mesh geometry={wallGeo} material={wallMat} castShadow receiveShadow />
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
            <mesh geometry={winFrameGeo} material={trimMat} castShadow />
            <mesh geometry={winGlassGeo} material={glassMat} position={[0, 0, 0.035]} />
          </group>
        )),
      )}

      {/* Door on the front gable end (+X) */}
      <group
        position={[WALL_LEN / 2 + 0.001, 0.53, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <mesh geometry={doorFrameGeo} material={trimMat} castShadow />
        <mesh geometry={doorPanelGeo} material={doorMat} position={[0, 0, 0.035]} />
      </group>
      {/* Small window on the back gable end (-X) */}
      <group
        position={[-WALL_LEN / 2 - 0.001, WALL_H * 0.55, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <mesh geometry={winFrameGeo} material={trimMat} castShadow />
        <mesh geometry={winGlassGeo} material={glassMat} position={[0, 0, 0.035]} />
      </group>

      {/* Ridge beam */}
      <mesh
        geometry={ridgeGeo}
        material={ridgeMat}
        position={[0, WALL_H + ROOF_H, 0]}
        castShadow
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
          <mesh geometry={rafterGeo} material={timberMat} castShadow />
          <lineSegments geometry={rafterEdges} material={edgeMat} />
        </group>
      ))}

      {/* Collar ties */}
      {collarTies.xs.map((x, i) => (
        <group key={`tie-${i}`} position={[x, WALL_H + collarTies.yTie, 0]}>
          <mesh geometry={tieGeo} material={timberMat} castShadow />
          <lineSegments geometry={tieEdges} material={edgeMat} />
        </group>
      ))}

      {/* Gable-end triangles (stucco) */}
      {[-1, 1].map((s) => (
        <group key={`gable-${s}`} position={[(s * WALL_LEN) / 2, WALL_H, 0]}>
          <mesh geometry={triGeo} material={wallMat} castShadow receiveShadow />
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
          {/* Decking sits proud of the rafters (BEAM thick) so the finished
              shingle field cleanly covers the frame instead of it poking
              through. */}
          <mesh geometry={deckGeo} material={underlayMat} position={[0, 0, 0.055]} />
          <mesh
            geometry={deckGeo}
            material={shingleMat}
            position={[0, 0, 0.08]}
            castShadow
          />
        </group>
      ))}
    </group>
  )
}
