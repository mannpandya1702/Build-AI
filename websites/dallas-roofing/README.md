# Lone Star Roofing Co. — Immersive Scroll-Driven Roofing Site

A single-page marketing site for a premium Dallas, TX roofing company. The
centerpiece is a pinned, scroll-driven 3D hero where a procedural gable roof
assembles from a blueprint wireframe into a finished, shingled roof as you
scroll, with layered headline text cross-fading per phase. Below the hero are
conventional sections (services, materials, process, trust, CTA) with
glassmorphism on the services cards.

All content is placeholder but reads like a real Dallas storm-and-hail
restoration firm, and it all lives in one config file.

## Stack

- Vite + React + TypeScript
- React Three Fiber (`@react-three/fiber`) + `@react-three/drei` for the 3D hero
- GSAP + ScrollTrigger for scroll orchestration
- Lenis for smooth scroll, wired into GSAP's ticker
- Tailwind CSS v4 for layout and styling
- `zustand` for a tiny scroll-progress store shared between the DOM overlay and
  the R3F canvas (progress is written to the store and read inside `useFrame`;
  React never re-renders per frame)
- Fonts bundled locally via `@fontsource` (Inter) and
  `@fontsource-variable/dancing-script` (the signature accent word), so there
  is no external font request

## Commands

```bash
# from this folder: websites/dallas-roofing
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:5173)
npm run build   # type-check + production build
npm run preview # preview the production build
```

## Editing the content (swap in real client data)

Everything user-facing lives in **`src/site.config.ts`**. Change the values in
the exported `siteConfig` object — company name, phone, email, service areas,
hero phase copy, services, materials, process steps, trust badges, CTA copy,
and footer info. You never need to touch a component to rebrand the site; every
component reads from this file.

The trust badges in `siteConfig.trust` are common US roofing PLACEHOLDERS.
Replace the license number, certifications, warranty terms, financing details,
and review counts with the real, verified client data before launch.

## How the hero is isolated

The scroll-driven 3D visual is fully contained in
`src/components/Hero/RoofScene.tsx` (Canvas + camera + lights) and
`RoofModel.tsx` (the procedural geometry). The rest of the page knows nothing
about Three.js, so a pre-rendered frame-sequence hero could replace `RoofScene`
later without touching the overlay or any other section.

## Accessibility & performance

- `prefers-reduced-motion`: the pinned scroll choreography is skipped entirely
  and a single static hero (all three headlines stacked) is shown, followed by
  normal document flow.
- The Canvas is lazy-mounted only when the hero is near the viewport, `dpr` is
  capped to `[1, 1.75]`, and the render loop pauses when the hero scrolls out of
  view.
- On small screens the rafter count drops and the camera simplifies to a gentle
  vertical pan. A lightweight FPS guard falls back to the static hero if the
  device can't hold a smooth frame rate.
