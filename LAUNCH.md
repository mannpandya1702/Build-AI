# Launch runbook

Everything still outstanding, in the order it can actually be done.

The site is built and deployed. **None of what follows is code waiting to be
written** — it is material, accounts and three decisions. Each step says what
to do, where, and how you know it worked.

A formatted version of this document is published as an artifact; this file is
the version-controlled copy. `HANDOVER.md` holds the long-form detail on every
client-owed item, including why some values were left blank rather than
guessed. This is the sequence; that is the reference.

**Ownership:** *You* = nothing is blocking it · *Studio* = needs Bhumi.

---

## Phase 0 — Today. Nothing is blocking you.

### 0.1 Rotate the Vercel token — You — BLOCKS LAUNCH

The deploy token was pasted into a chat session and has been used from a build
container. Treat it as compromised; it grants full deploy access.

- vercel.com/account/tokens → delete the existing token, create a fresh one
- Nothing in the repo changes — it is only ever passed as the `VERCEL_TOKEN`
  environment variable, never written to a tracked file

**Done when:** the old token returns 401 on any deploy attempt.

### 0.2 Get the admin password to Bhumi — You

The panel at `/admin` is live and password-protected. Username `riwaaya`;
password is in Vercel → Project → Settings → Environment Variables →
`ADMIN_PASSWORD` (production).

Send it on a different channel from the one carrying the URL — a single
compromised thread should not hand over both halves.

**Done when:** she can open the panel and see the readiness list.

### 0.3 Answer three questions — You

- **URL scheme.** The SEO plan wants `/weddings`, `/enquire`, `/about-bhumi`.
  The site uses `/gallery`, `/contact`, `/about` with those words as nav
  labels. One commit either way — free before launch, needs 301 redirects
  forever after. Decide before Phase 3.
- **The operations dashboard (plan Part 2).** Go or no-go. If go, it needs its
  own conversation: database, auth, WhatsApp Business API, VAPI, and the
  data-protection obligations that begin the moment guest ID documents are
  stored.
- **Anmol & Ishaan.** Is the Kasauli material available — photographs, dates,
  venue, vendor list? Highest-leverage item on this page.

**Done when:** answered. Phase 5 cannot start without the third.

---

## Phase 1 — One message to the studio.

### 1.1 Send the question sheet — You

The client-facing document is already drafted. Send it as one ask, and be
explicit that the first three are different in kind from the rest.

**Blocks launch:**

1. Photographs from real weddings, with the photographer's name and the
   couple's permission
2. Real testimonials — *or* permission to cut the section
3. The domain, and the login for wherever it was bought

**Improves the site but does not hold it:** a portrait of Bhumi, the office PIN
code, confirmation of the six destinations, a Google Maps share link, real
venue names, the logo vector.

**Done when:** sent, with the three blockers named as blockers.

### 1.2 Expect photography to be the long pole — Studio

The other items are minutes of work. Photography needs the photographer's name
and the couple's consent per wedding, which is real coordination. Chase at one
week, and offer to launch with a reduced gallery if it stalls — a smaller set
of real work beats a full grid of stand-ins.

**Done when:** the three blockers have landed.

---

## Phase 2 — As material arrives.

Independent of each other. Do each as it lands.

### 2.1 Swap in the real photography — You — BLOCKS LAUNCH

Files go in `public/photography/`, then set `src` on the matching slot in
`content/gallery.ts`, `content/services.ts` or `content/about.ts`. **A real
`src` always beats the demo image**, so photographs go in one at a time without
turning anything off.

**Do the six `destination-*` slots first.** Unlike the rest, those depict a
named place and sit directly under that place's name — a reader takes them for
the studio's own work there.

Once every slot is filled:

```ts
// lib/demoMedia.ts
export const DEMO_MEDIA = false;
```

```sh
rm -rf public/demo/
```

Every remaining slot falls back to a labelled placeholder at the correct aspect
ratio — no layout shift either way.

**Done when:** the panel's photo count reads N of N and the demo notice is gone.

### 2.2 Resolve the testimonials — You — BLOCKS LAUNCH

The five quotes are written placeholders with invented names. This is the one
item that is a **legal and reputational problem if it ships as-is**, not merely
an incomplete one. Either route is fine; shipping the current five is not.

- **Real quotes arrived:** replace them in `content/testimonials.ts`, then set
  `TESTIMONIALS_ARE_PLACEHOLDERS = false`
- **None yet:** remove `<Testimonials />` and its import from `app/page.tsx` —
  the home page reads fine without it and the section can return later

**Done when:** the panel's "Real client reviews" turns green, or the section is
gone.

### 2.3 The small ones — You

| What arrives | Where it goes | Note |
|---|---|---|
| PIN code | `lib/site.ts` → `address.postalCode` | JSON-LD picks it up automatically |
| Portrait | `content/about.ts` → founder slot | Upright crop suits the space |
| Map link | `lib/site.ts` → `geo.lat` / `geo.lng` | Currently ~300m — right block, wrong door |
| Destinations | `content/destinations.ts` | Cut any not actually worked |
| Venue names | `content/venues.ts` | Only name properties with a real relationship |
| Logo vector | `components/brand/Monogram.tsx` | Drops straight in |
| Google Form | `.env.local` + `lib/googleForm.ts` | Only if preferred — the built-in route works |

**Done when:** each item's row in the panel turns green on its own.

---

## Phase 3 — Launch day.

Strictly in order. Each depends on the one before, and 3.3 is the one people
skip.

### 3.1 Point the domain at Vercel — You

*Waits on: the domain arriving in 1.1.*

Vercel → Project → Settings → Domains → add the apex and the `www` variant.
Vercel prints the exact DNS records; add them at the registrar.

**Done when:** Vercel shows "Valid Configuration" against both.

### 3.2 Set the canonical URL — You

Vercel → Settings → Environment Variables → `NEXT_PUBLIC_SITE_URL` = the real
origin, production scope, no trailing slash.

**This matters more than it looks.** Canonical tags, the sitemap, OG tags and
every JSON-LD `@id` read from it. Left unset, every canonical on the live site
points at the preview address — search engines are told the real domain is a
copy.

**Done when:** the variable is set on production.

### 3.3 Redeploy — You

Environment variables are baked in at build time. **Changing 3.2 without a
redeploy changes nothing on the live site.**

```sh
npx vercel deploy --prod
```

**Done when:** the deployment reads READY.

### 3.4 Verify, five checks — You

Two minutes, and it catches the whole class of "launched but pointing at the
preview" mistakes.

- `/sitemap.xml` — every URL on the real domain
- `/llms.txt` — same
- Home page source — `"@id"` in the JSON-LD carries the real domain
- `/admin` — 401 before the password, 200 after
- The panel's "Your own domain" item turns green by itself, because it reads
  the host that served the request rather than a variable

**Done when:** all five pass.

---

## Phase 4 — The week after.

The site being live earns nothing on its own.

### 4.1 Search Console, day one — You

Add the property, verify by DNS TXT record (easiest — you are already in the
registrar from 3.1), submit `/sitemap.xml`. Watch the Pages report weekly for
two months; indexing problems surface there and are cheap to fix early.

**Done when:** the sitemap reads "Success" and pages begin appearing as indexed.

### 4.2 Google Business Profile — Studio

**Highest-value item in this phase.** For a service business in a named city,
the profile outranks the website itself for local intent. Bhumi has to verify
it, but set it up alongside her.

- Category **Wedding Planner**, secondary **Event Planner**
- Service area: Chandigarh, Mohali, Panchkula, plus the hill destinations
- Name, address and phone **worded exactly as on the site**
- Photos at brand grade, wordmark as profile image
- A post a month, every review answered in her voice

**Done when:** verified, and the knowledge panel appears for the studio's name.

### 4.3 Directory listings, in priority order — Studio

Google Business Profile → WedMeGood → WeddingWire India / ShaadiSaga →
WeddingSutra → Justdial and Sulekha → Bing Places and Apple Business Connect.

Identical name, address, phone and description everywhere. Inconsistency is
exactly why an assistant answers "I could not find information about this
business." **Do not pay for premium placement** until enquiry volume shows
which platform sends real families.

**Done when:** the top four are live and word-for-word consistent.

### 4.4 Turn on the visitor numbers — You

Vercel Analytics already collects. For the panel's "Who is visiting" section to
show figures, create a Plausible site and set `PLAUSIBLE_SITE_ID` and
`PLAUSIBLE_API_KEY` in Vercel. Until then the panel says plainly that it has no
numbers rather than rendering sample data.

**Done when:** the panel shows real traffic instead of the explanation.

### 4.5 Build the review ask into the debrief — Studio

Reviews are the strongest local ranking factor the studio controls. The
post-event debrief is already a contracted deliverable — put the ask in the
template so it happens without anyone remembering.

**Done when:** it is in the template, not in someone's head.

---

## Phase 5 — The part that compounds.

### 5.1 The first wedding story — Studio

*Waits on: real wedding material (0.3c).*

The plan's central unit. **Nothing else in the SEO strategy compounds without
it** — each story is simultaneously the sales asset, the brand proof, and the
page that ranks for a venue, a city and a ritual at once.

Template: couple names as the H1, 900–1,400 words, each function under its own
heading, the venue named and linked, vendors credited with links, 12–20
photographs with written alt text, Article schema.

Needs photographs, dates, the venue, the vendor list, and the couple's
permission. Anmol & Ishaan's Kasauli wedding is named in the plan as real —
that is the first one.

**Done when:** one story is live. Then one per delivered wedding, within three
weeks of the debrief while the material is fresh.

### 5.2 Hold the cadence — Studio

One story per wedding, two journal pieces a month, one venue guide a quarter.
Start the journal with ritual explainers — longest shelf life, and exactly what
an assistant cites when someone asks what a milni ceremony is.

Held for two years, that cadence is unbeatable by a studio doing thirty
weddings a year, because none of them are writing any of this down.

**Done when:** it is a habit rather than a project. This one never closes.

---

## Two things worth knowing

**The panel tracks this list for you.** Nine of the ten readiness items are
computed from the content files themselves, so they move the moment a real
photograph or a confirmed PIN code lands — there is no separate checklist to
remember to update. The tenth, the domain, reads the host that served the
request.

**What is already done, so you do not redo it:** six public routes all
returning 200 with hand-written titles and descriptions; self-referencing
canonicals, sitemap, robots and `/llms.txt`; Organization + LocalBusiness
schema carrying the slogan, founder, price range and both alternate names;
Person schema for Bhumi, Service schema on all eleven service pages, FAQPage
and BreadcrumbList; the name-origin copy that answers "riwaaya meaning";
self-hosted subset fonts, static generation throughout, Lighthouse 100 on
accessibility and SEO; the password-protected panel with live SEO auditing
against the served HTML; and eleven real SEO issues found by that panel and
fixed, currently 0 failures.
