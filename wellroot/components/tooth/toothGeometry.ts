import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  mergeGeometries,
  mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Procedural molar — a PLACEHOLDER built to the real anatomy so the pipeline
 * (material, lighting, heartbeat, scroll morph) is validated against a
 * believable tooth, not a lollipop. Replaced by a real GLB via the HAS_GLB
 * swap point in ToothModel.tsx.
 *
 * Crown: rounded box (never a sphere) with 4 occlusal cusps and a cross-shaped
 * central fissure, tapered toward the neck.
 * Roots: two tapered, outward-splaying tubes swept along Catmull-Rom curves,
 * with rounded apices.
 * Junction: a collar "trunk" that both crown and roots embed into, so after
 * mergeVertices + computeVertexNormals there is no visible seam.
 *
 * Everything is generated at anatomical proportions then normalized to a ~3.1
 * unit tall, centered geometry.
 */

// --- crown -----------------------------------------------------------------
function buildCrown(): THREE.BufferGeometry {
  const W = 10,
    H = 7,
    D = 9,
    radius = 2.1,
    seg = 10;
  const g = new RoundedBoxGeometry(W, H, D, seg, radius);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  const cx = W * 0.23;
  const cz = D * 0.23;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const { x, y, z } = v;

    // Taper toward the neck (bottom narrows to ~74%).
    const ty = THREE.MathUtils.clamp((y + H / 2) / H, 0, 1);
    const taper = THREE.MathUtils.lerp(0.74, 1.0, ty);
    v.x *= taper;
    v.z *= taper;

    // Occlusal shaping on the upper region only.
    if (y > H * 0.12) {
      const top = THREE.MathUtils.smoothstep(y, H * 0.12, H * 0.5);
      // Four cusps (nearest-cusp gaussian).
      let bump = 0;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const dx = x - sx * cx;
          const dz = z - sz * cz;
          bump = Math.max(bump, Math.exp(-(dx * dx + dz * dz) / (2 * 1.7 * 1.7)));
        }
      }
      // Cross-shaped central fissure (dips along x=0 and z=0).
      const fissure =
        Math.exp(-(x * x) / (2 * 0.9 * 0.9)) +
        Math.exp(-(z * z) / (2 * 0.9 * 0.9));
      v.y += top * (bump * 1.7 - fissure * 0.75);
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  return g;
}

// --- one tapered, curved root ---------------------------------------------
function buildRoot(mirror: number): THREE.BufferGeometry {
  const s = mirror; // +1 or -1 in X
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 1.1, -1.6, 0.2),
    new THREE.Vector3(s * 1.9, -5.5, -0.5),
    new THREE.Vector3(s * 2.6, -9.5, -1.1),
    new THREE.Vector3(s * 2.3, -13.2, -1.6),
  ]);
  curve.curveType = "catmullrom";
  curve.tension = 0.5;

  const tubular = 48;
  const radial = 64;
  const frames = curve.computeFrenetFrames(tubular, false);

  const radiusAt = (t: number) => {
    const neck = 2.25,
      tip = 0.5;
    let r = neck * (1 - t) + tip * t; // taper neck -> tip
    r += Math.sin(t * Math.PI) * 0.28; // slight mid fullness
    if (t > 0.9) r *= Math.sqrt(Math.max(0, (1 - t) / 0.1)); // round the apex
    return Math.max(r, 0.02);
  };

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const P = new THREE.Vector3();

  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, P);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusAt(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const sin = Math.sin(a);
      const cos = -Math.cos(a);
      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;
      positions.push(P.x + r * nx, P.y + r * ny, P.z + r * nz);
      normals.push(nx, ny, nz);
      uvs.push(t, j / radial);
    }
  }
  for (let i = 1; i <= tubular; i++) {
    for (let j = 1; j <= radial; j++) {
      const a = (radial + 1) * (i - 1) + (j - 1);
      const b = (radial + 1) * i + (j - 1);
      const c = (radial + 1) * i + j;
      const d = (radial + 1) * (i - 1) + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  return g;
}

// --- collar trunk that welds crown to roots -------------------------------
function buildTrunk(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 48, 32);
  g.scale(3.5, 2.4, 3.1);
  g.translate(0, -3.0, 0);
  return g;
}

export function buildMolarGeometry(): THREE.BufferGeometry {
  // mergeGeometries requires all inputs to share the same attributes AND the
  // same index-ness. RoundedBoxGeometry is non-indexed while Sphere/tube are
  // indexed, so normalize everything to non-indexed first.
  const parts = [
    buildCrown(),
    buildTrunk(),
    buildRoot(1),
    buildRoot(-1),
  ].map((g) => {
    const ni = g.index ? g.toNonIndexed() : g;
    // Keep only position/normal/uv so attribute sets match exactly.
    for (const name of Object.keys(ni.attributes)) {
      if (!["position", "normal", "uv"].includes(name)) ni.deleteAttribute(name);
    }
    if (ni !== g) g.dispose();
    return ni;
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  if (!merged) throw new Error("tooth geometry merge failed");

  // Weld coincident vertices, then a single smooth normal pass across the whole
  // body so the crown/trunk/root junction reads seamless. flatShading stays off.
  const welded = mergeVertices(merged, 0.02);
  welded.deleteAttribute("normal");
  welded.computeVertexNormals();

  // Normalize: center and scale to a ~3.1 unit tall model.
  welded.center();
  welded.computeBoundingBox();
  const box = welded.boundingBox!;
  const height = box.max.y - box.min.y;
  welded.scale(3.1 / height, 3.1 / height, 3.1 / height);
  welded.computeBoundingBox();

  merged.dispose();
  return welded;
}

/**
 * Low-frequency value-noise roughness map so highlights are not perfectly
 * clean. Values sit high (0.82–1.0) so they only gently modulate the base
 * roughness.
 */
export function buildRoughnessTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);

  // Cheap smoothed value noise from a coarse grid.
  const grid = 8;
  const rand: number[] = [];
  for (let i = 0; i < (grid + 1) * (grid + 1); i++) rand.push(Math.random());
  const sample = (gx: number, gy: number) => rand[gy * (grid + 1) + gx];
  const smooth = (t: number) => t * t * (3 - 2 * t);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * grid;
      const fy = (y / size) * grid;
      const x0 = Math.floor(fx),
        y0 = Math.floor(fy);
      const tx = smooth(fx - x0),
        ty = smooth(fy - y0);
      const v00 = sample(x0, y0),
        v10 = sample(x0 + 1, y0);
      const v01 = sample(x0, y0 + 1),
        v11 = sample(x0 + 1, y0 + 1);
      const top = v00 + (v10 - v00) * tx;
      const bot = v01 + (v11 - v01) * tx;
      const n = top + (bot - top) * ty; // 0..1
      const val = Math.floor((0.82 + 0.18 * n) * 255);
      const idx = (y * size + x) * 4;
      img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = val;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
