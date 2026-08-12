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
> `public/demo/` holds 21 freely-licensed photographs from Wikimedia Commons
> plus a generated hero loop. **They are not Riwaaya's work and must not
> survive to launch.** Because there are fewer photos than slots, several
> repeat. To strip them: set `DEMO_MEDIA = false` in `lib/demoMedia.ts` and
> delete `public/demo/` — every slot reverts to its labelled placeholder with
> no layout change. Licences and authors are in `public/demo/README.md`.
>
> The six `destination-*` images are the most urgent to replace. Unlike the
> rest, they were chosen to depict a **named place** — Udaipur, Jaipur,
> Jodhpur, the Himachal foothills, Rishikesh, Goa — sitting directly under
> that place's name on the page. A reader will take them for the studio's own
> work there. See §14 on why the Pinterest board could not fill these.

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
| `destination-hero` | Destination weddings, taak crop | 4:5 |
| `destination-udaipur / -jaipur / -jodhpur / -kasauli / -rishikesh / -goa` | One per destination | 4:3 |

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

**The WhatsApp number is now `+91 99159 09996`**, supplied by the studio on
12 Aug 2026, and is wired throughout — the floating button, header, hero,
service pages, destination page, contact page and footer.

One thing to confirm: the number this replaced, `+91 83528 13340`, came from
the original brief. It was not stated whether the new number **replaces** it or
is a **second** line. The build treats it as a replacement, and the old number
is kept in `lib/site.ts` as `PREVIOUS_ENQUIRY_NUMBER` — nothing renders it. If
both lines should be published, say so and it takes one edit to the footer.

## 5. Social handles — resolved

**Where:** `lib/site.ts` → `socials`
**Now:** `instagram.com/bhumisandhupvt` and `pinterest.com/bhumisandhu`, both
supplied by the studio and both verified to resolve. The guessed YouTube handle
has been removed rather than left as a dead link.

They appear in the footer and in the JSON-LD `sameAs` array.

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

## 10. Logo — send the vector original, low

Resolved in substance: the site now uses the logo artwork the studio supplied
on 12 Aug 2026 — the gold arch monogram with the sage R, the script "Riwaaya",
and the "By Bhumi Sandhu" signature line. This supersedes the earlier
instruction that the arch monogram had been rejected, and supersedes the
lowercase Cormorant wordmark that stood in for it.

What is still worth sending: **the vector original (.svg or .ai)**. The mark on
the site is a reproduction built from the images shared over chat — the arch is
drawn as a real vector path and matches closely, but the script is set in
Parisienne, the nearest freely-licensed match to the lettering in the artwork,
not the actual typeface. At nav size the difference is invisible; at the size it
appears in the footer, someone who knows the logo may notice.

Dropping in the real file is a contained change: `components/brand/Monogram.tsx`
holds the arch, `components/brand/Wordmark.tsx` holds the script. Every surface
renders through `components/brand/Logo.tsx`, so nothing else needs touching.

Two colour notes, both deliberate:

- The R inside the arch is drawn in a very pale sage in the artwork. On light
  surfaces the site uses a darker step of the same green, because at nav size
  the pale value is invisible against the off-white background. On the dark
  footer the artwork's own value is used unchanged.
- The gold is in the palette now (`sona`), which reverses the brief's "no gold"
  rule — the artwork made that rule impossible to keep. It is confined to the
  mark and to one hairline rule above section eyebrows. The body of the site is
  still pistachio and off-white only.

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

---

## 13. Destination weddings — confirm the six destinations — high

**Where:** `content/destinations.ts`

The new `/destination-weddings` page lists six places: Udaipur, Jaipur,
Jodhpur, Kasauli and the Himachal foothills, Rishikesh, and Goa. The seasons,
travel times and practical constraints in each entry are accurate. **What is
not confirmed is whether Riwaaya has actually worked in any of them.**

Every other claim on this site is grounded in the signed scope of work. This
page should be too. Please either confirm the list or send the real one, and
cut anything the studio has not done — a destination page that names a place
the team has never worked is the kind of thing a client asks about on the first
call.

Two other things on that page to settle:

- **Lead times.** The page says twelve to eighteen months for a peak-season
  date at a well-known property, nine months otherwise. Change if the studio
  works to different numbers.
- **Working outside India.** The FAQ answers "ask us", and says the studio will
  only take on a destination where it can put its own team on the ground. That
  is a deliberately careful answer. If there is a firmer position, it belongs
  here.

## 14. The Pinterest board is not usable as site photography — please read

The studio asked for the images on `pinterest.com/bhumisandhu` to replace the
placeholder photography. That has **not** been done, for three reasons.

1. **They are other people's photographs.** Pinterest is a bookmarking tool —
   a pin is a copy of an image from somewhere else on the web. Putting them on
   a commercial site republishes work belonging to photographers, brands and
   other wedding studios, without licence. If one of those photographers is
   another Indian wedding planner, the exposure is not only legal.
2. **They would be presented as Riwaaya's portfolio.** The image slots on this
   site sit under headings like "Signature work". Filling them with saved pins
   states, in effect, that this is work the studio has done.
3. **The board is not a wedding portfolio.** It holds 13 pins across 6 boards,
   and the saves include birthday cakes, a pavlova recipe, engagement-ring
   shopping, holiday outfits and nail designs alongside the mehndi and decor
   pins. There is not a usable set of wedding images in it.

**What was done instead.** The boards were read as art direction — desi wedding
decor, mehndi and bridal hands, wedding decor style — and the demo photography
was extended in that direction using freely-licensed images with the licence
and photographer recorded for each (`public/demo/CREDITS.json`). It is still
demo dressing and still comes out before launch; see §3.

**What actually solves this** is a shoot, or permission from the couples and
photographers of past weddings to publish specific images. If Riwaaya holds
images from real weddings it has planned, those are the ones to send — with a
note on who shot them, so the credit line is right.
