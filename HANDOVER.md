# Handover — what the client still needs to supply

Everything below is a placeholder in the current build. Nothing here blocks
development; all of it blocks launch.

Ordered by how badly the site is hurt without it.

---

## 1. Google Form URL — medium (no longer blocking)

**Where:** `.env.local` → `NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL`
**Currently:** unset, so the site shows its own enquiry form.

The enquiry section now has two modes. With no form configured — today — it
renders a native, brand-styled form that collects name, function, date, city,
guest count and a message, then opens WhatsApp with all of it filled in. That
works right now with no backend, so the conversion route is live either way.

Set a real form URL and the Google Form embed takes over automatically. Get it
from: the form → **Send** → `<>` embed tab → copy the `src`. Note the check is
strict: template values containing "replace", "placeholder", "xxxx" or an
implausibly short form ID are treated as unconfigured, so a half-filled-in
variable will not produce a broken embed.

## 2. Google Form entry IDs — high

**Where:** `lib/googleForm.ts` → `FORM_ENTRY_IDS`
**Currently:** `entry.1000001` / `entry.1000002`, both invented.

These carry the two pre-qualifier answers (event type, approximate date) into
the form. With the wrong IDs the form still opens — it just arrives blank, so
the visitor answers the same two questions twice.

Find them by inspecting each field in the live form and reading
`name="entry.XXXXXXXXX"`.

## 3. Photography — high

> ⚠️ **The site is currently dressed with temporary demo photography.**
> `public/demo/` holds 15 freely-licensed photographs from Wikimedia Commons
> plus a generated hero loop. **They are not Riwaaya's work and must not
> survive to launch.** Because there are fewer photos than slots, several
> repeat. To strip them: set `DEMO_MEDIA = false` in `lib/demoMedia.ts` and
> delete `public/demo/` — every slot reverts to its labelled placeholder with
> no layout change. Licences and authors are in `public/demo/README.md`.

**Where the real ones go:** `public/photography/`, then set `src` in
`content/gallery.ts`, `content/services.ts` (`imageSlot`) and
`content/about.ts`. A real `src` always beats the demo image, so photos can be
swapped in one at a time without turning the demo off.

With demo media off, every image is a labelled placeholder box at the correct
aspect ratio. The slot name is printed inside each box, so a photo can be
matched to a position without reading any code.

| Slot | Where it appears | Ratio |
|---|---|---|
| `hero-backdrop` | Home hero, full bleed. Still or looping video. | 16:9 |
| `service-*-hero` × 11 | One per line of work, on its detail page | 16:10 |
| `signature-01…08-*` | Home signature grid | mixed |
| `gallery-09…18-*` | Gallery page | mixed |
| `about-studio-portrait` | About page | 4:5 |
| `team-01-bhumi-sandhu`, `team-02…04-headshot` | About page team | 1:1 |

Alt text is already written for every slot in the content files — please check
it still describes the real photo once supplied.

## 4. Contact and address details — high

**Where:** `lib/site.ts`

| Field | Currently |
|---|---|
| `address.street` | `"Studio address to be confirmed"` |
| `address.locality` / `region` / `postalCode` | Chandigarh / Chandigarh / 160001 — inferred from the deck's social lockup ("Chandigarh"), **not confirmed** |
| `geo.lat` / `geo.lng` | Chandigarh city centre — **assumed**, drives the contact map pin |
| `email` | `hello@riwaaya.in` — **assumed** |
| `cities` | Chandigarh, Kasauli, Delhi NCR, Jaipur, Udaipur — Kasauli is from the deck's sample wedding, the rest are **guesses** |

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

## 6. Statistics — low (resolved, but confirm)

**Where:** `content/stats.ts`
**Now:** 11 lines of work · 24/7 hospitality desk · 8 on-site departments ·
1 wedding at a time.

The earlier invented figures (events delivered, cities, years) are gone. These
three are counts of what the scope of work actually contracts, taken from the
deck's own website draft, so they can be published without verification. If the
studio wants a "weddings delivered" number on the page, it has to come from
them.

## 7. Team names and roles — medium

**Where:** `content/about.ts` → `team`
**Currently:** Bhumi Sandhu is named as Founder. The other three entries still
read "Team member" and need real names, roles and headshots — or the section
should be cut to one.

## 8. Canonical domain — medium

**Where:** `.env.local` → `NEXT_PUBLIC_SITE_URL`
**Currently:** defaults to `https://riwaaya.in`.

Drives canonical URLs, OG tags, `sitemap.xml` and JSON-LD. If the live domain
differs, every one of those is wrong.

## 9. Testimonials — high

**Where:** `content/testimonials.ts`

Five quotes are written as placeholders with plausible names. **They are not
real client quotes and must not be published as such** — this is the one item
on this list that is a legal and reputational problem if it ships as-is.
Replace with real, permissioned testimonials or cut the section.

## 10. Wordmark case — decision needed, low

The identity deck specifies the primary wordmark in **CAPS** at +0.16em
("R I W A A Y A"), and the deck's own website mockup shows it that way. The
build brief specified **lowercase** at 0.18em. The site currently follows the
brief.

This is a one-word change: `letterCase="upper"` on `<Wordmark />`, or flip the
default in `components/brand/Wordmark.tsx` to change every surface at once.
Worth settling before launch. The footer already uses the deck's stacked
"by Bhumi Sandhu" signature lockup.

If a drawn logo lands later, replace the inner span of that component — every
surface picks it up automatically.

## 11. Open Graph image — optional

`public/og.png` is generated from the brand (wordmark, headline, taak shape) so
link previews are not broken. Replace it with art on a real photograph when the
photography arrives.


---

## 12. An error in your own services document — worth fixing at source

`List of Services — Riwaaya By Bhumi Sandhu.pdf` still contains **three
references to "Shaandaar Events"** where the name was not replaced:

- *Venue & Vendor Payment Schedule*, clause (a): "…exclusively from the pool of
  vendors with whom **Shaandaar Events** maintains a working relationship…"
- *Post Event Follow-ups*, clause (c): "…**Shaandaar Events** will make
  reasonable efforts to fulfill these requests…"
- The PDF's own document title metadata begins "LIST OF SERVICES Planning &
  Consultations: a. **Shaandaar Events** is committed to…"

The website copy uses Riwaaya throughout, so nothing is wrong on the site. But
this document goes to clients as a contract, and the third one is invisible in
the page body — it lives in the file's title metadata and will show in a
browser tab or a search result. Worth correcting at source.
