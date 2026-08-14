# Riwaaya

Marketing site for **Riwaaya by Bhumi Sandhu** — full-service wedding planning
and hospitality. *Weddings held in the old way, made new.*

Next.js (App Router) · TypeScript · Tailwind · Framer Motion. No CMS and no
database — all copy lives in typed files under `/content`.

Copy, positioning and the palette follow two client documents: the **Riwaaya
Brand Identity Deck (2026)** and the signed **List of Services**. Where the
build departs from either, the reason is written next to the code.

---

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
npx eslint .                     # lint
npx tsc --noEmit                 # typecheck
```

Requires Node 20+.

---

## Environment variables

Both are public (they end up in the client bundle) — do not put secrets here.

| Variable | Required | What it does |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL` | Optional | The published Google Form. Unset (the default) shows the site’s own enquiry form instead — see below. |
| `NEXT_PUBLIC_SITE_URL` | Yes, before launch | Canonical origin for metadata, OG tags, `sitemap.xml` and JSON-LD. No trailing slash. Defaults to `https://riwaaya.in`. |

### Getting the Google Form URL

1. Open the form → **Send** → the `<>` (embed) tab.
2. Copy the `src` from the `<iframe>` it shows you.
3. Paste it into `.env.local` as `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL`.

Either the `/viewform` or the `?embedded=true` form works — `lib/googleForm.ts`
normalises whichever you paste.

Until a real URL is set, the enquiry section renders **its own form** instead —
name, function, date, city, guest count, message — which composes a WhatsApp
message on submit. No backend, works today. Setting a real form URL swaps the
Google Form embed back in automatically.

The "is it configured?" check is deliberately strict: a URL containing
`replace`, `placeholder`, `xxxx`, or an implausibly short form ID counts as
unconfigured. A half-filled-in variable should show the working form, not a
broken embed.

### Form pre-fill entry IDs

The two-field pre-qualifier above the embed (event type, approximate date)
deep-links its answers into the form using `entry.XXXXXXXXX` parameters. The
IDs are documented constants in `lib/googleForm.ts`:

```ts
export const FORM_ENTRY_IDS = {
  eventType: "entry.1000001",   // PLACEHOLDER
  eventDate: "entry.1000002",   // PLACEHOLDER
};
```

To find the real ones: open the live form, right-click a field → **Inspect**,
and read the `name="entry.XXXXXXXXX"` attribute off the input. Until they are
replaced the form still opens correctly — it just arrives blank instead of
pre-filled.

---

## Where the content lives

Everything a non-developer would want to change is in `/content`. No component
needs editing to change copy.

| File | Contents |
|---|---|
| `content/services.ts` | The **eleven lines of work** from the signed scope, grouped by pillar. `slug` drives the `/services/[slug]` URL. |
| `content/destinations.ts` | The destination weddings page — six destinations written out in full, the pan-India coverage list, venue criteria, what changes when a wedding travels, and its own FAQ. |
| `content/venues.ts` | The wedding venues page — six venue types, five regions, how a shortlist is built, and its own FAQ. |
| `content/gallery.ts` | Every photograph on the site: slot name, category, caption, aspect ratio, alt text. |
| `content/testimonials.ts` | Quotes for the home page slider. |
| `content/faqs.ts` | The FAQ accordion. |
| `content/process.ts` | The client journey — First Word, Threshold, Architecture, Unfolding (the studio's own names). |
| `content/stats.ts` | The numbers in the pistachio band. |
| `lib/readiness.ts` | Launch-readiness rules behind the studio panel. |
| `lib/seoAudit.ts` | The live SEO audit behind the studio panel. |
| `content/about.ts` | Story, the is / is not list, the four brand pillars (Roots, Order, Welcome, Presence), the founder profile, the eight departments. |
| `lib/site.ts` | Identity, contact details, address, socials, cities, WhatsApp number. |

Add a line of work by appending to `services.ts` — the route, the home page
index, the footer link and the sitemap all pick it up automatically.

### Where the build departs from the brief, and why

1. **Palette is two colours plus gold in the logo.** The deck defines chandni,
   pista, gulaab (rose), baingani (aubergine) and sona (gold); the brief asked
   for pistachio and white with no purple or gold. The site is pistachio and
   off-white — except that the logo artwork the client later supplied is gold,
   so `sona` exists in `tailwind.config.ts` and is used in the mark and in one
   hairline rule above section eyebrows. Nothing else is gold, and gulaab and
   baingani are still absent.
2. **The arch monogram is back.** The brief said it had been rejected and that
   no pictorial mark should be drawn. The client later sent finished logo
   artwork which *is* an arch monogram, so the later instruction wins — see
   §Logo below. The name beside it stays in letter-spaced Cormorant rather than
   the artwork's script, on the client's instruction.

---

## Photography

**The site is currently dressed with temporary demo photography** so the
layout can be reviewed with something in it. It lives in `public/demo/` and is
wired up by `lib/demoMedia.ts`. It is **not Riwaaya's work** — see
`public/demo/README.md` for licences, and HANDOVER.md §3.

Turn it off with one line: `DEMO_MEDIA = false` in `lib/demoMedia.ts`. Every
slot then renders a labelled placeholder at the correct aspect ratio via
`components/media/ImageSlot.tsx`. Either way the layout is final and nothing
shifts when real photos arrive (measured CLS is 0).

A real `src` on a content item always beats the demo image, so photography can
be swapped in one file at a time without turning the demo off first.

To drop in a real photo:

1. Put the file in `public/photography/`.
2. Find the matching entry in `content/gallery.ts` (match the `slot` name shown
   on the placeholder itself, e.g. `signature-01-mandap-morning`).
3. Set `src: "/photography/your-file.jpg"` on that entry.

`ImageSlot` switches to `next/image` automatically and keeps the same crop,
parallax and hover behaviour. Alt text is already written for every slot — edit
it if the real photo shows something different.

For the service card and page images, and the about/team images, the slot names
are in `content/services.ts` (`imageSlot`) and `content/about.ts`. The hero
backdrop is `data-slot="hero-backdrop"` in `components/sections/Hero.tsx` and
accepts either a still or a looping `<video>`; replace the placeholder div
inside the `.hero-zoom` wrapper and leave the wrapper alone (it owns the load
animation).

---

## Logo

The logo pairs the arch monogram from the client's artwork — an open gold arch
enclosing a serif R — with "riwaaya" in Cormorant Garamond Light, letter-spaced
`0.18em`. It is drawn and set in type rather than placed as a bitmap, so it
stays sharp at any size, inherits colour from the surface it sits on, and costs
no network request.

Three components, one entry point:

| File | Holds |
|---|---|
| `components/brand/Monogram.tsx` | The arch, as a real vector path, with the R set in Cormorant |
| `components/brand/Wordmark.tsx` | The name and the "by Bhumi Sandhu" signature line |
| `components/brand/Logo.tsx` | The lockup — `layout="row"` for the nav, `layout="stack"` for the footer |

Everything renders through `<Logo />`, so a change in one of the first two
propagates everywhere. `app/icon.svg` is a separate, thicker copy of the mark
for the browser tab, where it has to survive at 16px.

**On the name's typeface.** The client's artwork sets "Riwaaya" in a
calligraphic script. That was reproduced for a while using Parisienne — the
nearest freely-licensed match — and then reverted to the letter-spaced
Cormorant on the client's instruction. The monogram from the artwork stays.
If the script is ever wanted back, it is one font import and one class in
`Wordmark.tsx`; load it with `preload: false`, because a third preloaded font
competing with the hero image costs about 0.6s of LCP on mobile.

**When the vector original arrives**, replace the `<path>` in `Monogram.tsx`
and the `<span>` in `Wordmark.tsx`. Nothing else needs touching.

One deliberate deviation from the artwork, documented in the component: the R
is a darker sage on light surfaces, because the artwork's pale value vanishes
against the off-white background at nav size. The dark footer keeps the
artwork's own value.

---

## Design system

Two colours and two typefaces, deliberately.

| Token | Hex | Use |
|---|---|---|
| `chandni` | `#F8F4ED` | Page background — dominant (deck value) |
| `pista` | `#C7D4B2` | Fills, cards, the stats band (deck value) |
| `pista-deep` | `#7E9470` | Focus rings, borders, timeline, dots |
| `ink` | `#22271F` | All text, deep sections |
| `stone` | `#6E7269` | Captions on off-white |

Plus derived steps in `tailwind.config.ts` — same two hues, no new colours:

- `pista-mist` `#ECECDE` — tinted section backgrounds
- `ink-soft` `#31382D` — hero backdrop
- `pista-ink` `#5C6E50` — **small pistachio text and solid button fills**
- `stone-deep` `#565A52` — **secondary body copy**

And one hue that is not pistachio, because the client's logo artwork is gold:

- `sona` `#C2A05E` — the mark, and the hairline above section eyebrows
- `sona-deep` `#8A6A2F` — the only gold allowed on small text

The last two exist for contrast. The brand's `pista-deep` measures **3.16:1**
on `chandni`, which satisfies WCAG's 3:1 bar for focus rings, borders and large
type but not the 4.5:1 that small text needs. So `pista-deep` keeps every
non-text job (focus rings especially, as specified), and anything set small
uses `pista-ink` (5.29:1) or `stone-deep` (6.75:1). Solid buttons are
`pista-ink` with `chandni` text at 5.29:1; on the original `pista-deep` that
pairing was 3.16:1 and failed.

`sona` measures 2.26:1 on chandni. That is fine for a logotype, which WCAG
exempts, and fine for a rule that carries no information — and not fine for
anything a reader has to make out. Keep it to those two jobs; `sona-deep` is
there if gold ever has to carry small text on a light surface.

Type: **Cormorant Garamond** (300/400) for display and the wordmark, **Mulish**
(400/600) for text and UI. Two families and nothing else, both self-hosted
through `next/font/google` — no external request, no swap shift.

### Paper grain

`body::after` tiles an 8KB noise PNG over the page at 3.5% to stop the
off-white reading as a flat screen colour. It is a pre-rasterised bitmap and
not an inline `feTurbulence` filter on purpose — the filter version was
measurably expensive (0.7s of LCP, four Lighthouse points on mobile), because
generating fractal noise across a full-viewport layer is real work while tiling
a bitmap is close to free. To regenerate the tile:

```js
const sharp = require("sharp");
const N = 128, buf = Buffer.alloc(N * N);
let s = 1337;
const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
for (let i = 0; i < buf.length; i++) buf[i] = Math.round(rnd() * 255);
sharp(buf, { raw: { width: N, height: N, channels: 1 } })
  .png({ compressionLevel: 9, palette: true, colours: 32 })
  .toFile("public/grain.png");
```

### Motion

The vocabulary lives in `lib/motion.ts` and is reused everywhere: reveals are
`opacity 0→1, y 24→0`, `0.7s`, `cubic-bezier(0.22, 1, 0.36, 1)`, fired once
`80px` before the element reaches the viewport, children staggered `0.08s`.
Use `<Reveal>` and `<Stagger>` from `components/motion/Reveal.tsx` rather than
hand-rolling.

Two entrances are **CSS, not Framer Motion** — the hero headline and the
`PageHeader` block (`.hero-line`, `.rise-in`, `.hero-zoom` in `globals.css`).
Both contain the page's LCP element, and driving them from JS kept the heading
masked until hydration, which cost ~0.8s of LCP on mobile. Keep them in CSS.

Everything collapses to a plain fade under `prefers-reduced-motion` — Framer
components read `useReducedMotion()`, and the CSS block at the bottom of
`globals.css` covers the rest. The auto-advancing testimonial slider stops
entirely.

---

## Accessibility

- Every text/background pair on every route passes WCAG AA (verified with
  Lighthouse and a per-node contrast sweep at 375 and 1440).
- Focus rings are `pista-deep`, 2px, never removed.
- The lightbox is a real dialog: focus moves in, Tab is trapped, Escape closes,
  arrow keys navigate, and focus returns to the thumbnail that opened it.
- Alt text is authored for every image slot up front so it cannot be skipped
  when the photography lands.
- Touch targets are ≥44px throughout.

Lighthouse at the time of writing: **100 accessibility, 100 best-practices and
100 SEO on every route**. Performance is **94–100 desktop** and **87–95
mobile**, and moves a couple of points between runs.

Two things hold the mobile figure down and both are deliberate:

- The **paper grain** costs about two points. It is a full-viewport composited
  layer, which is not free even as a cheap bitmap.
- The **demo hero video** (1.7MB WebM, desktop only) is what keeps the home
  page off 100 on desktop. It goes when the real photography lands.

`/gallery` sits at the bottom of the mobile range because it is an
image-heavy page, and `/contact` because of the third-party map iframe.

---

## Routes

| Route | Notes |
|---|---|
| `/` | Hero, positioning, the eleven lines, signature work, pillars, testimonials, stats, FAQ, enquiry |
| `/destination-weddings` | Six destinations in full, pan-India coverage list, what changes when a wedding travels, how a venue is chosen, its own FAQ |
| `/wedding-venues` | Six venue types, five regions, how a shortlist is built, its own FAQ. Linked both ways with the destinations page |
| `/services/[slug]` | One per line of work — eleven pages, statically generated |
| `/gallery` | Filterable masonry + lightbox |
| `/about` | Story, philosophy, the founder |
| `/admin` | Studio panel — launch readiness, visitors, live SEO audit. Password-protected, `noindex`, excluded in robots.txt |
| `/contact` | Details, enquiry form, map |

`sitemap.xml` and `robots.txt` are generated from `app/sitemap.ts` and
`app/robots.ts`. JSON-LD (`LocalBusiness`, `Event`, `Service`, `FAQPage`,
`Person`, `BreadcrumbList`) is built in `lib/schema.ts`.

### The studio panel

`/admin` is a private dashboard for the client. Three panels:

**Launch readiness** — computed from the content files, not a written list, so
it moves on its own. Photograph slots filled, whether the testimonials are
still placeholders, whether the site is on its own domain, the office postcode,
and so on. Blockers are weighted triple in the percentage.

**Visitors** — needs an analytics provider. `@vercel/analytics` collects from
the first deploy regardless; set `PLAUSIBLE_SITE_ID` and `PLAUSIBLE_API_KEY`
and the panel renders the numbers itself. With nothing connected it says so.
**It never shows sample or illustrative figures** — a dashboard of plausible
fake traffic is worse than an empty one, because decisions get made on it.

**Search** — fetches the site's own live pages on every load and measures the
served HTML: title and description lengths, headings, word counts, image alt
coverage, internal links, JSON-LD types, canonical tags, indexability, and
whether the target phrases appear. Reading the rendered markup rather than the
source is deliberate; an audit built from the content files reports what the
code intends and goes stale the moment a page sets its own metadata.

Protected by HTTP Basic Auth in `proxy.ts` (Next 16's rename of
`middleware.ts`). Set `ADMIN_USER` and `ADMIN_PASSWORD`. **With no
`ADMIN_PASSWORD` set the panel returns 503 rather than opening** — a
misconfigured deploy fails shut.

The marketing nav, footer, floating button and custom cursor are left off
`/admin` entirely: `proxy.ts` sets an `x-riwaaya-chrome: off` request header
and the root layout branches on it. Doing it server-side rather than with a
client component that returns null matters — the client version hid the chrome
visually but the server had already rendered it to pass as children, so its
markup still shipped inside the admin page's payload.

### Search phrases

The studio asked to rank for **destination wedding planner** and **luxury
wedding planner**. Those sit in the page titles, meta descriptions, the
`keywords` list and the JSON-LD — not repeated through the body copy, which
stays in the deck's voice. Every composed `<title>` is kept under about 60
characters so Google shows it whole. `/wedding-venues` is spelled that way
rather than `/venues` for the same reason: the URL is one of the few places a
keyword still earns its keep without the page reading like SEO filler.

---

## Still to supply

See the handover list — in short: photography, the real Google Form URL and
entry IDs, the office PIN code and exact map pin, the rest of the founder's
biography (it arrived cut mid-sentence), a headshot, real testimonials, and
`public/og.png`.
