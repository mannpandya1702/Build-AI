# SETUP.md — Build Runbook (one-time bootstrap)

**Claude Code: read `CLAUDE.md` first, then execute this file top to bottom.** `CLAUDE.md` is the standing operating contract (how the studio runs forever). This file is a one-time bootstrap that builds the project scaffold so the contract has something to drive. Obey every rule in `CLAUDE.md` while you build (no fabrication, the voice rules, the security pass, the demo design spec in Section 5). Once the project runs end to end on one test lead, this file can be deleted.

Do not ask me to confirm each step. Build the whole thing, then report what you built and what is blocked. The only time you stop and ask is the CONFIG check in Section 1 and the cost check in Section 7.

---

## 1. CONFIG (fill these, then Claude Code proceeds)

Read these values. **If `NICHE` or `METRO` is still a placeholder, STOP and ask me for them before doing anything else.** The business-identity fields are required before any outreach is sent, but not required to build, so scaffold with placeholders and flag them.

```
# Targeting (required to build)
NICHE            = "<e.g. roofers>"
METRO            = "<e.g. Austin, TX>"

# Studio identity (required before first send, for CAN-SPAM + the demos)
STUDIO_NAME      = "<your studio name>"
STUDIO_ADDRESS   = "<real physical mailing address, required by CAN-SPAM>"
STUDIO_US_PHONE  = "<your US number, Google Voice/Twilio, for call CTAs + signatures>"
FROM_EMAIL       = "<the address outreach sends from>"

# Deploy (required before first deploy)
VERCEL_SCOPE     = "<your vercel team/username slug>"
DEMO_DOMAIN_BASE = "<e.g. mystudio, so demos land at joes-roofing.mystudio.vercel.app>"

# Cost guardrails (safe defaults, change if you want)
MAX_CANDIDATES_PER_RUN = 60     # cap Places lookups per run to control spend
DEMO_SCORE_THRESHOLD   = 60     # only build demos for leads scoring this or higher (matches CLAUDE.md §4)
```

Keys are NOT in this file. They live in `.env.local` (Section 5) and are read at runtime. Never print them, never commit them, never put them in any generated file.

---

## 2. Preflight

Run these checks. Fix or report each before continuing.

- Node 18+ is installed (`node -v`). The pipeline uses the built-in global `fetch`, which needs 18+.
- `.env.local` exists and contains `GOOGLE_PLACES_API_KEY` and `VERCEL_TOKEN`. If it does not exist, create it per Section 5 and tell me to paste my rotated keys into it.
- `git status` confirms `.env.local` is NOT tracked. If it is tracked or committed, stop and tell me immediately, the keys are exposed.
- The Vercel CLI is available (`vercel --version`); if not, `npm i -g vercel`.

---

## 3. Folder structure to create

```
web-studio/
├── CLAUDE.md                 # the operating contract (already here)
├── SETUP.md                  # this file (delete after bootstrap)
├── .env.local                # keys, gitignored, never committed
├── .gitignore
├── package.json
├── tsconfig.json
├── config.ts                 # generated from Section 1 CONFIG
├── src/
│   ├── discovery/
│   │   ├── places.ts         # Places API (New) client: search + details + photos
│   │   ├── score.ts          # applies the CLAUDE.md §4 rubric
│   │   └── find.ts           # entrypoint: find + score + write leads
│   ├── crm/
│   │   └── leads.ts          # read/write the lead store, dedupe by place_id
│   ├── demo/
│   │   ├── generate.ts       # fill niche template with a lead's real data
│   │   ├── qa.ts             # the CLAUDE.md §5e security + perf pass
│   │   └── deploy.ts         # deploy to Vercel, capture the live URL + screenshot
│   └── outreach/
│       └── draft.ts          # touch-1 email + call script in my voice (§3, §6)
├── templates/
│   └── <niche>/              # the parameterized Next.js demo template
├── data/
│   ├── leads.json            # the CRM (start here; swap to Supabase later)
│   └── cache/                # cached Place Details by place_id (cost control)
└── demos/                    # generated demo sites before deploy (gitignored)
```

---

## 4. package.json + dependencies

Create `package.json` with these scripts and install deps.

Scripts:
- `find` → `tsx src/discovery/find.ts` (find + score + write qualified leads)
- `build-demo` → `tsx src/demo/generate.ts` (build one demo for a given place_id, then QA, then deploy)
- `draft` → `tsx src/outreach/draft.ts` (draft touch-1 email + call script for a given place_id)
- `run-niche` → chains find, then build-demo for every 60+ lead, then draft (the full loop)

Dependencies: `tsx`, `typescript`, `@types/node`, `dotenv`, `zod` (validate lead shape), `puppeteer` (site-quality probe + demo screenshots), `sharp` (compress screenshots for email). The demo template itself uses Next.js + Tailwind + Framer Motion (`motion`) per `CLAUDE.md` §5.

Load env at the top of every entrypoint: `import "dotenv/config";`.

---

## 5. .env.local + .gitignore (idempotent)

If `.env.local` does not exist, create it with empty key placeholders and tell me to paste my rotated keys:

```
GOOGLE_PLACES_API_KEY=
VERCEL_TOKEN=
```

Ensure `.gitignore` contains at least:

```
.env.local
.env
node_modules/
demos/
data/cache/
.DS_Store
```

Then verify once more that `.env.local` is untracked.

---

## 6. config.ts

Generate a typed config object from the Section 1 CONFIG so nothing is hardcoded across modules. Export `NICHE`, `METRO`, `STUDIO_NAME`, `STUDIO_ADDRESS`, `STUDIO_US_PHONE`, `FROM_EMAIL`, `VERCEL_SCOPE`, `DEMO_DOMAIN_BASE`, `MAX_CANDIDATES_PER_RUN`, `DEMO_SCORE_THRESHOLD`. Any business-identity field left as a placeholder should export a value that clearly reads as `[NEEDS: ...]` so it is impossible to accidentally send a demo or email with a fake address in it.

---

## 7. Module 1 — Discovery (Places API New)

This is the highest-risk module to get wrong, so it is spec'd concretely. Use the **Places API (New)**, not the legacy endpoints.

**Cost check before scaling.** The fields we need (`rating`, `userRatingCount`, `websiteUri`, `nationalPhoneNumber`) are billed at the Enterprise SKU, and `reviews` is billed higher still. So: on the FIRST run, fetch a single page (`maxResultCount: 20`) with a small field set, print an estimated cost and the number of qualified leads, and ask me to confirm before running the full `MAX_CANDIDATES_PER_RUN`. Cache every Place Details response to `data/cache/<place_id>.json` and read cache first, so re-runs cost nothing. Remind me to set a hard billing cap in Google Cloud Console.

**Text Search (New)** — get candidates:

```
POST https://places.googleapis.com/v1/places:searchText
Headers:
  Content-Type: application/json
  X-Goog-Api-Key: <GOOGLE_PLACES_API_KEY>
  X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.types,places.businessStatus
Body:
  { "textQuery": "<NICHE> in <METRO>", "maxResultCount": 20 }
```

Paginate with `nextPageToken` up to `MAX_CANDIDATES_PER_RUN`. To widen coverage, also run the query against a few neighborhood/suburb variants of `METRO`. Dedupe candidates by `place_id`.

**Place Details (New)** — get the scoring + demo fields per candidate (cache first):

```
GET https://places.googleapis.com/v1/places/<PLACE_ID>
Headers:
  X-Goog-Api-Key: <GOOGLE_PLACES_API_KEY>
  X-Goog-FieldMask: id,displayName,formattedAddress,rating,userRatingCount,websiteUri,nationalPhoneNumber,location,googleMapsUri,photos,businessStatus
```

Note the New-API field names: `displayName.text`, `userRatingCount` (not `user_ratings_total`), `websiteUri` (not `website`), `nationalPhoneNumber`. Absence of `websiteUri` means no website.

**Site-quality probe** (only when `websiteUri` exists): load it in Puppeteer at a mobile viewport, capture whether it renders, rough load time, and whether it is mobile-responsive. A broken/slow/non-responsive site still qualifies as a gap per `CLAUDE.md` §4. Skip businesses already on a fast modern mobile site (nothing to sell).

**Scoring** (`score.ts`): apply the exact `CLAUDE.md` §4 rubric (reviews, rating, website gap, niche fit, photos available, phone present) and the auto-disqualifiers (chains/franchises, permanently closed, no usable photo/fact). Output a 0 to 100 score.

**Photos + reviews for the demo:** for leads that score `>= DEMO_SCORE_THRESHOLD` only (to control cost), pull a few place photos via the Places Photo endpoint and the top few reviews. Confirm the current Photo endpoint from Google's docs at build time. These are the real assets the demo is built from. Never invent a review or a photo; if none exist, mark `[NEEDS: photos]` and the demo uses tasteful placeholders, not fabricated content.

Write every candidate (scored, with all fetched data) to the lead store via Module 2.

---

## 8. Module 2 — Lead store (CRM)

`data/leads.json`, one record per business, deduped by `place_id`. The record shape matches the `CLAUDE.md` §2 state fields exactly, validated with zod:

```
place_id, business_name, niche, city, state, phone, email,
gbp_url, review_count, rating, has_website, current_site_url,
site_quality_score, score, demo_url, demo_screenshot,
outreach_status, last_touch_date, reply, stage, notes
```

`stage` starts at `found`, moves to `qualified` if `score >= DEMO_SCORE_THRESHOLD`. Re-running `find` updates existing records, never duplicates them. Keep it as flat JSON now; the schema is intentionally Supabase-ready so swapping the store later is a drop-in.

---

## 9. Module 3 — Demo generator

Do NOT invent a new design here. Build exactly to `CLAUDE.md` Section 5: the conversion skeleton first (sticky tap-to-call, mobile-first, speed budget, real reviews/photos, 3-5 field form, local structure, schema markup, accessibility), then the restrained whoa layer (one tasteful hero moment, Framer Motion, optional light 3D, reduced-motion respected, lighter on mobile).

Mechanics:
- `templates/<niche>/` is a parameterized Next.js + Tailwind site with slots: business name, city, services, phone, real reviews, real photos, map embed, brand color. `generate.ts` fills the slots from a lead's record. This is what makes demo #10 take minutes, per `CLAUDE.md` §5d.
- Copy is generated in my voice per `CLAUDE.md` §3 (direct, no em dashes, no corporate words, city + service in the hero). Every fact comes from the lead's real Places data. Unknowns are `[NEEDS: ...]`, never invented.
- `qa.ts` runs the `CLAUDE.md` §5e pass before anything goes live: validate + sanitize the form, grep the build for leaked secrets, run Lighthouse for perf/accessibility, and test tap-to-call + form submit on a real mobile viewport. A demo that fails QA does not deploy.
- `deploy.ts` deploys with the Vercel CLI using `VERCEL_TOKEN` from env, targets a per-prospect subdomain under `DEMO_DOMAIN_BASE`, captures the returned live URL, screenshots the hero (Puppeteer, compressed with sharp) for the email body, and writes `demo_url` + `demo_screenshot` back to the lead record and sets `stage = demo_built`.

Deploy is a spend/live action: on the first ever deploy, show me the target URL and wait for my go-ahead once, then run unattended after that.

---

## 10. Module 4 — Outreach drafter

Per `CLAUDE.md` Section 6. For a given lead, produce:
- **Touch-1 email**: honest specific subject, one real observation about their business, the demo link, the plain-language "what it does for your customers" line, a soft close, and the CAN-SPAM footer built from `STUDIO_ADDRESS` + an unsubscribe line. Five to seven sentences, my voice. Screenshot referenced for inline embedding.
- **Call script**: the §6 Touch-2 opener plus the §7 objection responses, tuned to this business (their review count, their competitor, their gap).

Draft only. Nothing sends automatically. Write drafts to the lead record / a `drafts/` file for me to review. If any business-identity field is still `[NEEDS: ...]`, refuse to finalize the email and tell me which field is missing (a CAN-SPAM footer with a fake address is not allowed).

---

## 11. Niche template

Build one solid `templates/<niche>/` to start (the `NICHE` from CONFIG). It must hit every point in `CLAUDE.md` §5b and §5c. Make the slots clean so a second niche is a copy-and-restyle, not a rebuild. This single template is the reusable asset the whole model's economics depend on.

---

## 12. Setup Definition of Done

The bootstrap is complete when, end to end on ONE real test lead from the target niche/metro:
- `npm run find` returns scored leads and writes them to `data/leads.json`, deduped.
- `npm run build-demo <place_id>` produces a live Vercel URL that loads under 2.5s on mobile, tap-to-call works, the form validates and leaks no secrets, and every fact on it is real (unknowns are `[NEEDS: ...]`, not invented).
- `npm run draft <place_id>` produces a touch-1 email in my voice with a working CAN-SPAM footer (or a clear refusal naming the missing identity field) plus a call script.
- `.env.local` is still untracked and no key appears in any committed file or any console output.

Report: what got built, the one strongest lead found, the live demo URL, and anything blocked (missing config, missing keys, billing cap not set).

---

## 13. Guardrails (do not violate while building)

- **Keys never leave `.env.local`.** Not into code, not into `config.ts`, not into logs, not into commits, not into a chat. Read from `process.env` at runtime only.
- **Obey `CLAUDE.md`.** It outranks convenience. The no-fabrication rule, the voice, the security pass, and the demo design spec are hard requirements, not suggestions.
- **Spend is real.** Respect `MAX_CANDIDATES_PER_RUN`, cache aggressively, and do the Section 7 cost check before scaling Places calls. Deploys and API calls cost money; the caps exist so a loop or a mistake cannot run up a bill.
- **Nothing sends or deploys silently on first use.** First deploy and first send wait for one go-ahead, then run unattended.
- **This file is disposable.** Once Section 12 passes, tell me it is safe to delete `SETUP.md`. The project runs on `CLAUDE.md` from then on.
