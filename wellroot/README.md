# Wellroot — dental clinic hero

Marketing hero for Wellroot, a family and cosmetic dental clinic. Bright white,
calm, premium. The signature is a large interactive 3D tooth that looks like wet
enamel and pulses like a slow heartbeat (~52 bpm), then, as you scroll, its root
hands off into a flowing teal line that threads down the whole page and lights a
node at each section.

## Stack

- Next.js 16 (App Router) + TypeScript — note: brief asked for Next 15; the
  current release is 16, a backward-compatible superset, and the whole R3F stack
  supports React 19, so it was kept.
- `three`, `@react-three/fiber`, `@react-three/drei`
- `gsap` + `ScrollTrigger`, `lenis` for smooth scroll
- Tailwind CSS v4 (tokens live in `app/globals.css` `@theme`, mirrored in
  `lib/tokens.ts`)
- Fonts via `next/font`: Fraunces (display) + Inter (body/UI)

## Run

```bash
npm run dev     # dev server
npm run build   # production build
npm start       # serve the production build
```

## The tooth model — swap point

The hero is built to drive a **real** GLB, not the procedural placeholder.
Everything (material, lighting, heartbeat, scroll morph) targets the real mesh.

- Drop a clean molar at `public/models/tooth.glb`.
- Open `components/tooth/ToothModel.tsx` and flip **one line**:
  `const HAS_GLB = false;` → `true`.

Until then `components/tooth/toothGeometry.ts` builds a **procedural molar**
(placeholder, 0 KB asset weight): a rounded-box crown with four cusps and a
cross-shaped occlusal fissure, two tapered roots swept along Catmull-Rom curves
with rounded apices, welded to the crown through a collar trunk (mergeVertices +
a single smooth normal pass so the cementoenamel junction has no seam).

Rendering: warm-ivory `MeshPhysicalMaterial` (clearcoat, subtle transmission +
attenuation, sheen, low-frequency noise roughness map), a RoomEnvironment IBL
built locally via PMREM (no network HDRI), a three-point rig whose teal rim is
the heartbeat, ContactShadows, ACESFilmic tone mapping at 1.05 exposure. The
tooth sits in a 3/4 view with a slow float + oscillation. No postprocessing
bloom — the shine comes from the IBL, clearcoat, rim, and Fresnel, which keeps
the white page from greying.

## Progressive enhancement (three tiers)

`lib/webgl.ts` picks a tier at runtime; the hero renders a server-side inline-SVG
tooth first (the LCP element) and crossfades to the canvas when its first frame
is ready.

- **full** — WebGL, capable device, motion allowed: physical enamel, RoomEnv
  IBL, three-point rig with a heartbeat-driven teal rim, breathing aura.
- **lite** — low-power / coarse-pointer: DPR capped at 1.5, no aura, gentler.
- **static** — no WebGL, or `prefers-reduced-motion`: the composed inline-SVG
  tooth, full spine drawn, nodes lit. No pulse, no parallax, no scroll morph.

## Structure

```
app/            layout (fonts, Lenis), page, globals (tokens)
components/
  Nav, Hero, StaticTooth, Reveal, FlowSpine
  tooth/        ToothCanvas, ToothModel, Lights, Aura, useHeartbeat
  sections/     Services, Why, Booking, Footer
lib/            tokens, webgl (tier detection), spineStore (root->spine bridge)
public/
  models/       tooth.glb  (you supply)
```

## Phase status

Phases 0–8 from the brief are all in place: setup/tokens/Lenis, CSS-first hero,
enamel canvas, heartbeat shine, interaction (idle drift + damped cursor
parallax + hover), lazy-mount + crossfade + fallbacks, scroll morph (SVG spine
from projected root tip), sections with staggered reveals, and a perf/a11y pass
(DPR clamp, dispose, offscreen frameloop pause, focus rings, reduced-motion).

Known follow-ups: real GLB swap, optional limited OrbitControls (left out to keep
the damped parallax conflict-free), and the stretch-goal 3D `TubeGeometry` spine.
```
