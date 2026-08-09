# Handover — what the client still needs to supply

Everything below is a placeholder in the current build. Nothing here blocks
development; all of it blocks launch.

Ordered by how badly the site is hurt without it.

---

## 1. Google Form URL — blocking

**Where:** `.env.local` → `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL`
**Currently:** a placeholder ID that does not resolve.

The enquiry section is the site's primary conversion route. Until the real URL
is set, the embed fails and the page shows its fallback card ("The form did not
load") with a direct link and WhatsApp. That fallback works, but the section
looks broken.

Get it from: the form → **Send** → `<>` embed tab → copy the `src`.

## 2. Google Form entry IDs — high

**Where:** `lib/googleForm.ts` → `FORM_ENTRY_IDS`
**Currently:** `entry.1000001` / `entry.1000002`, both invented.

These carry the two pre-qualifier answers (event type, approximate date) into
the form. With the wrong IDs the form still opens — it just arrives blank, so
the visitor answers the same two questions twice.

Find them by inspecting each field in the live form and reading
`name="entry.XXXXXXXXX"`.

## 3. Photography — high

**Where:** `public/photography/`, then set `src` in `content/gallery.ts`,
`content/services.ts` (`imageSlot`) and `content/about.ts`.

Every image is currently a labelled placeholder box at the correct aspect
ratio. The slot name is printed inside each box, so a photo can be matched to
a position without reading any code.

| Slot | Where it appears | Ratio |
|---|---|---|
| `hero-backdrop` | Home hero, full bleed. Still or looping video. | 16:9 |
| `service-<slug>-card` × 6 | Home services grid, taak-cropped | 4:5 |
| `service-<slug>-hero` × 6 | Each service detail page | 16:10 |
| `signature-01…08-*` | Home signature grid | mixed |
| `gallery-09…18-*` | Gallery page | mixed |
| `about-studio-portrait` | About page | 4:5 |
| `team-01…04-headshot` | About page team | 1:1 |

Alt text is already written for every slot in the content files — please check
it still describes the real photo once supplied.

## 4. Contact and address details — high

**Where:** `lib/site.ts`

| Field | Currently |
|---|---|
| `address.street` | `"Studio address to be confirmed"` |
| `address.locality` / `region` / `postalCode` | Bengaluru / Karnataka / 560001 — **assumed** |
| `geo.lat` / `geo.lng` | Bengaluru city centre — **assumed**, drives the contact map pin |
| `email` | `hello@riwaaya.in` — **assumed** |

These feed the contact page, the footer, and the `LocalBusiness` JSON-LD, so
wrong values affect local search results.

**The WhatsApp number `+91 83528 13340` is live and wired throughout** — the
floating button, header, hero, service pages, contact page and footer. Confirm
it is the right line to publish before launch.

## 5. Social handles — medium

**Where:** `lib/site.ts` → `socials`
**Currently:** `instagram.com/riwaaya`, `pinterest.com/riwaaya`,
`youtube.com/@riwaaya` — all guessed, none verified to exist.

They appear in the footer and in the JSON-LD `sameAs` array. Remove any
platform the studio does not actually use rather than leaving a dead link.

## 6. Statistics — medium

**Where:** `content/stats.ts`
**Currently:** 180+ events, 14 cities, 9 years, 1 wedding per week.

These are invented placeholders. They appear in a prominent band on the home
and about pages and are the kind of claim that should be accurate.

`content/site.ts` also lists operating cities (Bengaluru, Jaipur, Udaipur, Goa,
Delhi NCR) — confirm.

## 7. Team names and roles — medium

**Where:** `content/about.ts` → `team`
**Currently:** four entries all reading "Team member".

## 8. Canonical domain — medium

**Where:** `.env.local` → `NEXT_PUBLIC_SITE_URL`
**Currently:** defaults to `https://riwaaya.in`.

Drives canonical URLs, OG tags, `sitemap.xml` and JSON-LD. If the live domain
differs, every one of those is wrong.

## 9. Testimonials — low

**Where:** `content/testimonials.ts`

Five quotes are written as placeholders with plausible names. **They are not
real client quotes and must not be published as such.** Replace with real,
permissioned testimonials or cut the section.

## 10. Logo file — low

The logo is currently the "riwaaya" wordmark in Cormorant Garamond, per the
brief. If a designed logo lands later, replace the inner element of
`components/brand/Wordmark.tsx` — every surface picks it up automatically.

## 11. Open Graph image — optional

`public/og.png` is generated from the brand (wordmark, headline, taak shape) so
link previews are not broken. Replace it with art on a real photograph when the
photography arrives.
