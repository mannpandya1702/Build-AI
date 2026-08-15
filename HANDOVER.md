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

## 4. Contact and address details — mostly resolved

**Where:** `lib/site.ts`

The office address arrived on 13 Aug 2026 and is now live on the contact page,
in the footer and in the `LocalBusiness` JSON-LD:

> **D-231, 3rd & 4th Floor, Phase 8B (Sector 91), Mohali, Punjab**

Two things still outstanding on it:

| Field | Currently |
|---|---|
| `address.postalCode` | **empty.** Phase 8B / Sector 91 spans more than one PIN and it was not sent, so it is left blank rather than guessed — the JSON-LD omits the field instead of publishing a wrong postcode. Send it and it takes one line. |
| `geo.lat` / `geo.lng` | 30.7046, 76.6928 — **approximate to about 300m**, enough to land the contact map on the right block. Send a Google Maps link to the office and it becomes exact. |
| `email` | `hello@riwaaya.in` — still **assumed** |

Coverage was also corrected: the studio works **pan-India with Chandigarh as
the main city**, which is now what `site.cities`, the destinations page and the
footer all say. The earlier five-city guess is gone.

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

## 7. Team — resolved

**Where:** `content/about.ts` → `founder`

The three placeholder "Team member" cards are gone ("Only the founder",
13 Aug 2026). The About page now runs a founder profile: portrait, name, title
and the biography the studio sent.

The biography first arrived truncated at *"…into ever"*; the closing paragraph
arrived on 14 Aug and the story is now complete on the page, in her own words.

Still needed: a real headshot for the `team-01-bhumi-sandhu` slot.

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

Resolved in substance: the site uses the **gold arch monogram** from the logo
artwork the studio supplied on 12 Aug 2026. This supersedes the earlier
instruction that the arch monogram had been rejected.

The **name beside it stays in letter-spaced Cormorant**, not the artwork's
script. The script was built (using Parisienne, the nearest freely-licensed
match) and then reverted on the studio's instruction, so the wordmark is what
the site had before the artwork arrived. If the script is wanted back later it
is a small, contained change — see README §Logo.

What is still worth sending: **the vector original (.svg or .ai)**. The arch on
the site is a reproduction built from the images shared over chat — drawn as a
real vector path and matching closely, but a reproduction.

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


## 16. There is now a private panel at /admin

A dashboard for the studio, at `/admin`, behind a password.

It shows, live: **what is still holding up launch** (computed from the site
itself, so it updates as things are supplied); **visitor numbers**; and a
**search audit** of every page — what each will look like in a Google result,
whether anything is too long or too short, whether images have descriptions.

Two things to set before it is useful:

- `ADMIN_USER` and `ADMIN_PASSWORD` in the site's environment variables. Until
  `ADMIN_PASSWORD` is set the panel refuses to open at all, which is the safe
  way round.
- Visitor numbers need an analytics service connected. Counting is already
  running and recording, so nothing is being lost in the meantime — the figures
  are in Vercel today. To pull them into the panel, set `PLAUSIBLE_SITE_ID` and
  `PLAUSIBLE_API_KEY`.

The panel never shows sample figures. If it cannot get real numbers it says so.

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

The SEO + dashboard plan you sent on 15 Aug flags more in the same document,
all worth fixing in the same sitting:

- **Venue & Vendor Payment Schedule skips clause (d)** — it runs a, b, c, e,
  f, g.
- **Clause (c) in that section is an incomplete sentence** — "shall coordinate
  with vendors to ensure timely and accurate." Accurate *what*.
- **Food & Beverage clause (c) takes on liquor procurement and legal
  compliance in writing.** In Punjab, Haryana, Himachal and Chandigarh the
  event licence usually sits with the venue or a licensed contractor, so this
  is real exposure. The plan says have a lawyer look before the next
  signature; we agree.
- **The canonical list of eleven services** the plan says is missing does now
  exist — it is the eleven this site is built around, one URL each under
  `/services`. If that list is right, use it verbatim for the contract
  headings too, so the website, the dashboard and the contract name the same
  eleven things. If any of it is wrong, say so and the site changes.

---

## 13. Destination weddings — confirm the six destinations — high

**Where:** `content/destinations.ts`

The `/destination-weddings` page writes out six places in detail: Udaipur,
Jaipur, Jodhpur, Kasauli and the Himachal foothills, Rishikesh, and Goa. The
seasons, travel times and practical constraints in each entry are accurate.
**What is not confirmed is whether Riwaaya has actually worked in any of them.**

Every other claim on this site is grounded in the signed scope of work. This
page should be too. Please either confirm the list or send the real one, and
cut anything the studio has not done — a destination page that names a place
the team has never worked is the kind of thing a client asks about on the first
call.

The framing around them was corrected on 13 Aug 2026. The section used to read
*"Six we know properly. Not a list of everywhere in India."* — which was wrong,
because the studio works pan-India. It now reads "Asked for most often", and a
**Full coverage** block below it lists every city, grouped into four regions,
each linking through to the matching section of the venues page.

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

### One of the demo images had a competitor's watermark on it — removed

Worth knowing, because it was live. `service-onsite-hero.jpg` — a decorated
wedding stage, used on the home signature grid and the on-site coordination
service page — carried **another wedding company's branding burnt into the
photograph**: a logo, the name "Ayga Events" and a phone number, low in the
frame and dark enough to miss when the set was assembled.

It has been deleted from `public/demo/` and from `CREDITS.json`, and the three
slots that used it now point elsewhere. Every remaining file in the set was
then checked for burnt-in text across the top and bottom of the frame; they are
clean. This is a good argument for §3 generally: the sooner real photography
replaces this set, the sooner the whole class of problem goes away.

## 15. Wedding venues page — what it does not yet contain

**Where:** `content/venues.ts`, `/wedding-venues`

Built 13 Aug 2026 from the competitor screenshots — a domestic city list
leading to venue content, no international column.

It is **one page with a section per region**, not eighteen per-city pages.
Per-city pages rank better only when each one carries real, distinct content:
named properties, room counts, photographs. Riwaaya has not sent those, and
eighteen near-identical pages of generic copy is precisely the pattern Google
demotes as doorway content. As soon as there are real venues to name for a
city, that city can graduate to its own page and the hub links to it.

**Nothing on the page names a specific property**, deliberately. Every claim is
about venue *types* and the questions to ask of them, which stays true whatever
hotel a family ends up in. Naming properties the studio has no relationship
with would be the same mistake as the invented testimonials.

To make it stronger, send: **the venues Riwaaya has actually worked at**, with
room counts and a note on whether the studio has a relationship with each.

---

## 17. The SEO + dashboard plan (15 Aug) — where the site already stands

The plan has been read against the build, item by item, so nothing gets done
twice and nothing looks ignored.

**Already in place.** Hand-written titles and descriptions on every page;
self-referencing canonicals; sitemap and robots; Organization/LocalBusiness
schema carrying the slogan, founder, price range and alternate names
("Riwaaya by Bhumi Sandhu", "Riwaaya Weddings"); a Person node for Bhumi —
the "bhumi sandhu wedding planner" query; Service, FAQPage and BreadcrumbList
schema; the name-origin copy on /about that answers "riwaaya meaning";
self-hosted subset fonts; static generation throughout; Core Web Vitals
measured live in /admin. Added on reading the plan: `/llms.txt`, and Service
schema with a provider reference on each of the eleven service pages.

**Done differently, deliberately.** The plan sketches per-city landing pages
and venue guide pages. The build has one venue hub with region anchors
instead — the plan itself warns that thin city pages read as doorway pages
and that venue guides must only exist for venues actually worked, which is
the same reasoning §15 above records. The plan's `/weddings` and `/enquire`
URLs exist here as nav labels over `/gallery` and `/contact`; renaming live
slugs means redirects, cheap now and annoying later, so if the plan's URL
scheme is wanted, say so and it happens in one commit.

**Cannot exist honestly yet — needs material.** The wedding story pages the
plan builds everything around (couple names as the H1, 900–1,400 words, a
named venue, vendor credits, 12–20 photographs) need a real wedding's
material. Anmol & Ishaan's Kasauli wedding is named in the plan as real —
send its photographs, dates, venue and vendor list and the first story page
gets built to the plan's template exactly. Journal pieces and venue guides
queue behind the same principle: real ones only.

**Only you can do.** Google Business Profile — claimed, category "Wedding
Planner", service area set, brand-grade photos, a post a month, every review
answered; Search Console verified the day the real domain goes live; the
directory NAP pass in the plan's own priority order (GBP → WedMeGood →
WeddingWire India / ShaadiSaga → WeddingSutra → Justdial / Sulekha → Bing
Places / Apple Business Connect); the review ask written into the post-event
debrief; the Instagram bio pointing at the weddings page.

**Part 2 — the operations dashboard — is a different project.** Enquiry
pipeline, budgets, payments with client approvals, guest logistics, run
sheets, the WhatsApp and voice automations: that is a product build with its
own database and auth, paid accounts to open (Supabase, WhatsApp Business
API, n8n, VAPI), and Data Protection Act obligations the moment guest ID
documents are stored. The plan's own phasing puts it at about twenty weeks.
The `/admin` panel on this site is the marketing slice of it — §2.7's SEO
console — and no more. It needs an explicit go, and its own conversation
about stack and accounts, before anything is built.

One small note: Mukta (the plan's Gurmukhi and Devanagari face) loads only on
pages that actually set text in those scripts. No page does yet, so it is not
loaded — adding it costs a line the day such text exists.
