# Maana Frontend — What We've Built

_A build log and design rationale for the Maana AI agency site. First pass,
front-end only, no backend wired._

---

## The idea in one line

**Quiet confidence, techy not noisy.** A near-monochrome canvas, one luminous
violet accent, and motion that rewards attention instead of demanding it. The
restraint is the pitch: it reads as premium _and_ as engineering competence,
which is what an AI agency is actually selling.

---

## Design system

| Token        | Value       | Role                                            |
| ------------ | ----------- | ----------------------------------------------- |
| Canvas       | `#0B0B10`   | Near-black with a cool tint — never pure black. |
| Ink          | `#EDEDF2`   | Primary text.                                   |
| Muted        | `#8A8A99`   | Secondary text.                                 |
| **Accent**   | `#7B5CFF`   | Electric violet — the **only** saturated color. |

- **One accent, not two.** Ties to the "Una = one" idea and stops the page
  looking busy. The cursor glow, the robot's rim light, every CTA, every
  eyebrow — all the same violet.
- **Film grain** sits over the dark gradients (`.grain` in `globals.css`) to
  kill banding and add a tactile texture.
- **Type has three voices:** Space Grotesk (distinctive display, so it doesn't
  read templated), Inter (neutral body/UI workhorse), and JetBrains Mono
  reserved for eyebrows, labels, and numbered markers like `01 / Discovery` —
  the mono is the techy signal.

Tokens live in `src/app/globals.css` under Tailwind v4's `@theme`, so
`bg-canvas`, `text-muted`, `text-accent` etc. are real utilities.

---

## The page, section by section

### 1. Hero — instant, no WebGL wall
Paints immediately: display headline, mono eyebrow, subhead, two CTAs, and a
metrics strip. Behind it, two cheap effects only:
- **Animated gradient mesh** — three large blurred violet blobs drifting on CSS
  keyframes. GPU-cheap, no WebGL.
- **Cursor glow** — a single radial-gradient element following the pointer,
  throttled to one write per animation frame (`use-cursor-glow.ts`). It lights a
  faint grid underneath as it moves. Near-zero cost, all the immersion.

### 2. Service cards — where the interactivity budget goes
Four cards: **Websites · Chatbots · Voice · Automations.** Collapsed shows icon,
name, one-liner, and a "Custom quote" anchor. Click expands with a Framer Motion
**shared-layout** animation — the card grows to full width, the grid reflows
physically, and features + a CTA fade in. One card is open by default so the
interaction is discoverable.

### 3. Voice beat — the one deliberate 3D moment
"**Meet the AI that answers your calls.**" This is the reskinned robot (see
below), **lazy-mounted via IntersectionObserver** — no Three.js code loads or
runs until you scroll near it. It's a centerpiece beside the copy, not a
background you fight to read text over.

### 4. Marquee, 5. Process, 6. Footer CTA
A quiet scrolling row of the tools we build on; a three-step process with mono
markers; and a big final book-a-call beat. The **book-a-call CTA is persistent**
— in the nav on desktop, and as a sticky bottom bar on mobile — so the one thing
that converts never gets buried by the art.

---

## The robot: reskinned, not reused as-is

We were handed a charming 3D robot component (originally a light-mode retail
hero with a teal screen and a "Buy Now" shopping-bag button). Dropping that in
as the hero would have undercut the whole brand. Instead:

- **Not the hero.** The hero stays text-first and instant.
- **Reskinned to the brand:** dark-chrome chassis, a single **violet rim light**,
  violet screen and eyes. Reflections come from procedural `Lightformer`s (no
  network HDRI fetch), so it works fully offline.
- **Calmed down:** gentler pointer tracking, slower rotation.
- **Stripped:** no navbar, no background wordmark, no shopping bag.
- **Placed where it sells:** lower on the page as the "voice agent" beat, where
  the character reinforces the voice product instead of fighting the brand.
- **Kept the delight:** click it and its eyes turn to hearts.

The original component is preserved verbatim at
`src/components/ui/robot-hero.tsx` for reference; the site renders the reskinned
`src/components/site/robot-scene.tsx`.

---

## Performance & accessibility

- **Nothing heavy on load.** The hero is HTML + CSS. WebGL is code-split
  (`next/dynamic`, `ssr: false`) and gated behind an IntersectionObserver.
- **`prefers-reduced-motion` respected everywhere** — gradient drift and marquee
  stop, and the robot falls back to a slow idle sway (or a static CSS stand-in
  before mount).
- **Device-pixel-ratio capped** on the canvas so it never over-renders on
  retina screens.
- Production build is fully static (`○ (Static)` for `/`).

---

## Project map

```
frontend/src/
├── app/
│   ├── globals.css        # design tokens, grain, keyframes
│   ├── layout.tsx         # fonts + metadata
│   └── page.tsx           # section composition
├── components/
│   ├── site/              # hero, service-cards, voice-beat, robot-scene, nav, …
│   └── ui/robot-hero.tsx  # original vendored component (reference)
├── hooks/
│   ├── use-cursor-glow.ts # rAF pointer glow
│   └── use-in-view.ts     # IntersectionObserver lazy-mount gate
└── lib/
    ├── site.ts            # all copy, nav, services, BOOKING_URL
    └── motion.ts          # shared easing
```

---

## Status & next steps

**Done:** full one-page site, responsive, animated, 3D beat integrated, builds
clean, no console errors.

**Not yet (intentionally — UI first):**
- Wire **`BOOKING_URL`** in `src/lib/site.ts` to the real Cal.com/Calendly link.
- Real copy, case studies / "work" section, and any real client logos.
- Backend for a contact form if you'd rather capture leads on-site than send
  them straight to scheduling.
- Analytics + OG image.
