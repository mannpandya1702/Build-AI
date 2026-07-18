# Maana — Frontend

Marketing site for **Maana**, an AI agency. Dark-first, near-monochrome, one
luminous violet accent. Built to read as *quiet confidence* — restraint as a
proxy for engineering competence.

> UI only. No backend wiring yet — the "Book a call" CTA points at a
> placeholder scheduling URL you swap in `src/lib/site.ts`.

## Stack

| Concern      | Choice                                            |
| ------------ | ------------------------------------------------- |
| Framework    | Next.js 16 (App Router, Turbopack)                |
| Styling      | Tailwind CSS v4 (`@theme` tokens in `globals.css`)|
| Animation    | Framer Motion (cards, scroll, nav)                |
| 3D           | React Three Fiber + drei (lazy-mounted robot)     |
| Icons        | lucide-react                                      |
| Fonts        | Space Grotesk (display), Inter (body), JetBrains Mono (labels) |

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## What's on the page

1. **Hero** — text-first, paints instantly. GPU-cheap animated gradient mesh +
   a cursor glow that lights a faint grid. No WebGL on load.
2. **Service cards** — Websites · Chatbots · Voice · Automations. Click to
   expand (Framer Motion shared layout); the grid reflows physically.
3. **Voice beat** — "Meet the AI that answers your calls." The 3D robot,
   reskinned to dark chrome + violet rim light, **lazy-mounts via
   IntersectionObserver** only when it scrolls into view.
4. **Marquee** — the tools the stack is built on.
5. **Process** — `01 / Discovery`, `02 / Prototype`, `03 / Ship & tend`.
6. **Footer CTA** — the persistent book-a-call ask.

Everything respects `prefers-reduced-motion`; the 3D scene degrades to a static
idle sway and a CSS fallback.

## Where to edit

| You want to change…            | File                                   |
| ------------------------------ | -------------------------------------- |
| Booking link, copy, services   | `src/lib/site.ts`                      |
| Colors, grain, keyframes       | `src/app/globals.css` (`@theme`)       |
| Fonts / metadata               | `src/app/layout.tsx`                   |
| The robot look & motion        | `src/components/site/robot-scene.tsx`  |
| Cursor glow behavior           | `src/hooks/use-cursor-glow.ts`         |

`src/components/ui/robot-hero.tsx` is the original vendored component, kept for
reference. The site uses the reskinned `robot-scene.tsx` instead.

See [`OVERVIEW.md`](./OVERVIEW.md) for the full design rationale.
