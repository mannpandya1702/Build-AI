# Agency Autopilot — Production Audit & Best-Approach Plan

**Prepared:** 2026-07-16
**Scope:** Full-system audit (frontend → backend → infrastructure) plus a recommended
production-grade tech stack and a phased execution plan optimized for **UI/UX, speed, and
accuracy**.
**Codebase audited:** branch `claude/read-pdf-89t95k` — ~7.2k LOC TypeScript across a
pnpm + Turborepo monorepo (`apps/dashboard`, `apps/worker`, `packages/{core,agents,adapters,blocks}`).

> How to read this: Part 1 is the honest state of the system today. Part 2 is what "production
> grade" should look like and the exact stack to get there. Part 3 is the sequenced plan — what to
> do first, and why. If you read nothing else, read the **Executive Summary** and **§7 Recommended
> Stack**.

---

## Executive summary

Agency Autopilot is an **autonomous lead-to-delivery pipeline**: it discovers businesses with weak
web presence, audits them, builds demo sites, runs compliant cold outreach, books meetings, and
delivers final sites after a client converts — all driven by a single worker process and watched
from a Next.js operator dashboard.

**The engineering is better than its stage suggests.** The state machine, the layered idempotency,
the MOCK-first safety rails, and the CAN-SPAM email gate are genuinely well-built and should be
**kept**. This is not a rewrite candidate.

**But it is not production-ready, and the gaps are concentrated in a handful of high-severity
places:**

| # | Severity | Finding | One-line impact |
|---|----------|---------|-----------------|
| 1 | 🔴 Critical | **No authentication on the dashboard** — every API route is world-reachable | Anyone with the URL can send email on your domain, spend your API budget, and read prospect PII |
| 2 | 🔴 Critical | **Split-brain two-database "bridge"** with whole-table last-write-wins sync | Hosted-only writes (e.g. Cal.com cancellations) are silently clobbered within 45s — "cancelled" meetings resurrect as "scheduled" |
| 3 | 🔴 Critical | **Worker is a single process on an ephemeral, reclaimable container**, and the thing that would alert you when it dies runs *inside* the worker | A worker that dies overnight is invisible until you happen to open the dashboard |
| 4 | 🟠 High | **SSRF wide open** in 4 adapters that fetch prospect-controlled URLs | A malicious business listing can make your server fetch cloud-metadata / internal services |
| 5 | 🟠 High | **Real prospect PII + a sent outreach email are committed to git** | Contradicts your own RUNBOOK; now in history, needs a scrub |
| 6 | 🟠 High | **Chat-exposed API keys never verifiably rotated**; **no CI, no linter, ~2 real test files** | Live credentials possibly compromised; every documented incident lives in an untested module |
| 7 | 🟡 Medium | Frontend is 9 copy-pasted 2–5s pollers with silent error handling | DB/Vercel cost, background-tab waste, infinite skeletons on any fetch failure |

**The single highest-leverage move** is to **collapse the split-brain and move the worker onto a
real always-on host.** That one change eliminates the bridge (finding #2), removes the ephemeral-SPOF
(finding #3), and makes an external dead-man's-switch possible. Everything else is bounded, local
work.

**The good news for the UI ask:** the design system is already strong (semantic tokens with
documented contrast ratios, above-average accessibility, thorough empty/loading states). "Make the
frontend look better" is less about a redesign and more about **finishing what's started** —
adopting an accessible primitive library, killing the pollers with realtime, and closing the a11y
gaps.

---

# PART 1 — AUDIT

## 1. What the system is (orientation)

```
Google Places ─► research ─► scrape ─► qualify ─► analyzer ─► solution ─► uiux ─► builder ─► qa ─► sales ─► (monitor)
                (discover)   (crawl)  (score)   (Lighthouse  (pitch)   (design) (Vercel   (checks) (outreach,
                                                 + vision)                        deploy)          followups,
                                                                                                    booking)
```

- **Agents are pipeline stages, not processes.** Each is a TypeScript module consumed from a
  Postgres-backed queue (pg-boss). One worker runs them all. Jobs are a *projection of lead status*
  — a scheduler scans for leads sitting in a trigger status and enqueues the owning agent. This is
  the backbone and it's the right one: crashes and exhausted retries self-heal on the next scan.
- **Everything emits events** to one append-only `agent_events` stream. Dashboard, monitor,
  notifications, cost tracking, and batch accounting are all consumers of it.
- **MOCK_MODE runs the whole pipeline with zero external calls** and refuses to run mock stubs
  against a database holding real leads.
- **The operator watches and controls from the dashboard** (pipeline kanban, outbox approvals,
  meetings, builds, activity, reports, settings).

## 2. Current architecture (as-deployed)

```
        Cal.com webhook (HMAC)         Operator browser
                │                             │
                ▼                             ▼
      ┌────────────────────────────────────────────────┐
      │  DASHBOARD — Next.js 14 on VERCEL                │
      │  (deploy-protection ON; NO app-level auth)       │
      └───────────────────────┬─────────────────────────┘
                              │ reads/writes directly
                              ▼
                 ┌──────────────────────────┐
                 │ HOSTED POSTGRES (NEON)     │  ← authoritative for OPERATOR INPUTS
                 │ over HTTPS/WS (:443)       │    (bookings, outbox approvals, settings)
                 └───────────┬──────────────┘
                             ▲   BRIDGE every 45s (runs *inside* the worker)
                             ▼   whole-table last-write-wins upsert
      ┌──────────────────────────────────────────────────┐
      │  WORKER — single Node process in the EPHEMERAL     │
      │  Claude Code web container (advisory-locked)       │
      │  pg-boss + all agents + scheduler + monitor + bridge│
      │            │                                        │
      │            ▼                                        │
      │  LOCAL POSTGRES  ← authoritative for WORKER OUTPUTS │
      │  (leads, builds, emails, agent_events)             │
      └──────────────────────────────────────────────────┘
```

**Why it looks like this:** the worker's container blocks raw TCP `:5432` egress, so the worker
can't reach a hosted Postgres directly. The bridge was the workaround. It is also the source of the
system's worst correctness and reliability risks.

## 3. Findings by severity

### 🔴 Critical

**C-1 · No authentication anywhere on the dashboard.**
There is no `middleware.ts`, no session check, no cookie/bearer verification in any route (only the
Cal.com webhook is secured, via HMAC). Every endpoint is fully open:
- `GET /api/leads`, `GET /api/leads/[id]` → dump lead PII (`select *`: contact name/email/phone).
- `POST /api/worker` → anyone can turn the worker **on**, which starts real Vercel deploys + AI spend.
- `POST /api/discover` → queue up to 200 Places lookups (real spend).
- `POST /api/outbox/approve` → flip an email to `approved`; the worker then **actually sends it**.
- `POST /api/settings` → **arbitrary key + arbitrary JSON value, no allowlist** — an unauthenticated
  KV-write into the shared DB (including `worker_enabled`, `icp_overrides`, `demo_batch`).

This is a money-spending, PII-exposing, domain-reputation-affecting console with zero access control.
*Fix before any real deployment.*

**C-2 · Split-brain bridge with lossy last-write-wins sync.**
Up-sync is a whole-table `select *` → `on conflict (id) do update set <every column>` for 12 tables
every 45s (`apps/worker/src/bridge.ts:50-66,190`). It **silently clobbers hosted-only writes**. Concrete
bug: the Cal.com webhook writes `BOOKING_CANCELLED` directly to Neon
(`apps/dashboard/app/api/webhooks/calcom/route.ts:32`), but the down-sync only pulls three whitelisted
paths — so the next up-cycle upserts the local `status='scheduled'` row back over the cancel and
**resurrects a cancelled meeting**. There are also **no delete tombstones**: a row deleted locally
lives forever on Neon (the orphaned-outbox-approval incident of 2026-07-10 is exactly this).

**C-3 · Single worker on an ephemeral container, and the dead-man's-switch dies with it.**
Exactly one worker by design (Postgres advisory lock). It lives in a container the platform can
reclaim at any time; a SessionStart hook only revives it when someone next opens the session. Worse,
`monitorHourly`/`dailyDigest` and the `heartbeat_missing` detector all run *inside* the worker
(`apps/worker/src/index.ts:342-359`, `packages/agents/src/real/monitor.ts:61-65`) — so **the one alert
that matters most (worker down) can never fire.** And `notifyOperator` only inserts a DB row
(`packages/core/src/events.ts:26-37`): despite `TELEGRAM_*` env being declared, **there is no
out-of-band alert channel at all**. A worker that dies at 2am is invisible until you log in.

### 🟠 High

**H-1 · SSRF in four adapters.** Each fetches a URL that ultimately comes from a Google Places
`websiteUri` (which a business can set to anything), follows redirects, with **no private/link-local/
metadata IP blocking**: `qualify.ts:11`, `crawl.ts:16`, `copy.ts:58`, and — worst —
`screenshots.ts:36-46`, which intercepts *every sub-resource the page requests* and re-fetches it
server-side. A malicious prospect site can drive the worker to `http://169.254.169.254/…`
(cloud metadata) or internal hosts and render the response.

**H-2 · Real prospect data committed to git.** `data/leads.json` holds **60 real businesses** (names,
phones, GBP URLs, ratings) and `drafts/*.md` includes a **sent outreach email**
(`drafts/…:83` "SENT 2026-07-02 to info@…") with your mailing address in every footer. `.gitignore`
covers regenerable artifacts but **not** these. This contradicts RUNBOOK §8 ("prospect data lives
only in Postgres") and is now in history.

**H-3 · Credential rotation open/unverified.** PROGRESS states every key shared in chat during the
build (Google Places, Vercel, Anthropic, PageSpeed, 21st, Resend, Cal.com) must be rotated before
go-live. No evidence it was completed. Until then, live credentials are potentially compromised.

**H-4 · No CI, no linter, ~2 real tests.** No `.github/` directory. No eslint/prettier/biome installed
(yet source carries `eslint-disable` comments that lint nothing). Real tests exist only for the state
machine and the block library; `agents`, `adapters`, `worker`, and `dashboard` ship placeholder
`echo "tests land later"` scripts — meaning the **email gate, SSRF fetchers, bridge reconcile,
`advanceLead` transaction, `approveAndSend` idempotency, and batch admission math have zero automated
coverage**, and those are the exact modules where the documented incidents happened.

**H-5 · Frontend: 9 copy-pasted pollers, silent failures.** Every data page is `"use client"` and
polls `/api/*` on a `setInterval` (2–5s). Because `Bell` + `WorkerSwitch` live in the sidebar, **every
page runs ≥3 concurrent pollers**; `GET /api/leads` returns up to 500 rows every 2s; background tabs
keep polling (real Vercel/Neon cost). Only the activity page surfaces fetch errors — everywhere else a
failed fetch yields an **infinite skeleton** (e.g. a bad lead id at `leads/[id]/page.tsx:32-38` spins
forever). The `?after=` cursor exists on the events route but the page never sends it, always
refetching the full 100 rows.

### 🟡 Medium

- **Artifact-write + advance are not one transaction.** Every agent does `insert artifact` then a
  separate `advanceLead(...)` (`analyzer.ts:113-118`, `solution.ts:45-59`, `uiux.ts:244-250`,
  `builder.ts:310-312`). A crash between them re-runs the agent and writes a **duplicate audit/
  solution/design** — latent (consumers read the newest), but wasted Sonnet spend on every crash-retry.
- **Scheduler + 3 polls have no re-entrancy guard.** The 2s scheduler (`index.ts:124`) and the
  research/outbox/photo-heal polls have no in-flight lock (unlike the bridge, which does). Correctness
  survives *only* because every enqueue/admission happens to be idempotent — fragile by construction.
- **Anthropic adapter: no retry, unpinned model, no prompt caching.** A transient 429/5xx throws and
  re-runs the *whole agent* (re-doing PageSpeed + screenshots + Sonnet, re-billing). `sonnet` is a bare
  unpinned alias; prices are hardcoded; large static system prompts are re-sent every call with **no
  prompt caching** (a straightforward cost + latency win).
- **Migration story is a single `if-not-exists` file.** Editing `00001_init.sql` after it's applied is
  a silent no-op; there's no `00002` and no guard that local and Neon are on the same schema version —
  yet the bridge and `copy-db` assume identical schemas.
- **`agent_events` grows unbounded, no retention/partitioning.** Heartbeat alone is 1,440 rows/day, and
  the 2s scheduler + monitor scan this hot table forever.
- **Dev-tools kill-switch fails *open* off Vercel.** `devToolsEnabled() = !process.env.VERCEL || …`
  (`lib/devtools.ts:5-7`): on any non-Vercel host the lead/reply/booking *fabricators* are enabled by
  default. Combined with C-1, anyone could fabricate data into production.
- **Unsandboxed external iframes** in the builds gallery and lead page (no `sandbox` attribute).
- **Prompt injection contained but under-delimited.** Prospect site text and inbound replies are
  inserted verbatim into LLM prompts. Output guards (verbatim-email check, invented-number/unevidenced-
  claim lint, single-token reply classifier) contain the blast radius well — but there's no explicit
  "the following is untrusted content" delimiter.

### 🟢 What's genuinely good (keep it)

**Backend**
1. `advanceLead` — the single transactional, `FOR UPDATE`-locked, validated way to move a lead. Total
   transition table, verified by test. The strongest primitive in the codebase.
2. **Status-derived scheduling** — jobs are a projection of status, so the system self-heals after
   crashes and exhausted retries.
3. **Layered idempotency** — enqueue `singletonKey` + per-agent status guards + atomic build claim +
   `emails.idempotency_key unique` + Resend idempotency header. Independent guards, not one.
4. **Email gate + CAN-SPAM + suppression + `[NEEDS:]`-aware footer**, plus anti-fabrication copy guards
   with a feedback-retry loop. Careful, compliance-minded work.
5. **MOCK-first defaults + `MOCK_ON_REAL_DB` refusal + mock/real handler split** — hard to accidentally
   spend money or contaminate real data.
6. **Cal.com webhook HMAC** done correctly (raw body, timing-safe compare, fails closed).
7. **Cost tracking on every LLM call** into one reconcilable stream; finance module honestly tags
   numbers `measured|allocated|estimated`.

**Frontend**
8. **Semantic token design system** with *documented* contrast ratios and alpha-friendly RGB triplets;
   no raw hex in components.
9. **Above-average accessibility baseline** — focus-visible, reduced-motion, color+text status pills,
   aria on icon buttons/nav/progressbar/charts, labeled inputs.
10. **Thorough empty + loading states** everywhere; dependency-light hand-rolled UI kit + inline SVG icons.
11. **Parameterized SQL throughout** — no SQL injection reachable.

**Schema**
12. 10 real enums, FKs with deliberate cascade/set-null choices, partial-unique constraints, sensible
    indexes, a generic `updated_at` trigger installed via catalog loop. Well above typical.

---

# PART 2 — TARGET STATE & TECH STACK

## 4. Design principles for the production system

1. **One authoritative database.** The split-brain exists only because the worker can't reach hosted
   Postgres. Fix the worker's *home*, and the bridge — with its entire class of divergence bugs —
   deletes itself.
2. **Nothing that spends money or touches PII is reachable without auth.**
3. **The thing that watches the worker must not live inside the worker.**
4. **Realtime over polling.** The UI should react to database changes, not re-ask every 2 seconds.
5. **Keep the good bones.** `advanceLead`, the event bus, MOCK-first, the email gate, the design tokens
   — these stay. We harden around them, we don't replace them.
6. **Every incident-prone module gets a test and a CI gate.**

## 5. Target architecture

```
                         ┌───────────────────────────────────────┐
   Operator browser ───► │  DASHBOARD — Next.js (App Router)       │
   (Supabase Auth        │  Server Components + streaming SSR       │
    session, 2FA)        │  TanStack Query + Supabase Realtime      │
                         │  shadcn/ui (Radix) on existing tokens    │
                         └──────────────────┬────────────────────┘
                                            │ authed server actions / RLS
   Cal.com webhook (HMAC) ──────────────────┤
                                            ▼
                            ┌───────────────────────────────┐
                            │   ONE POSTGRES  (Supabase)      │
                            │   Auth · Realtime · Storage · RLS│
                            │   single source of truth         │
                            └───────────────┬───────────────┘
                                            ▲ direct :5432 (no bridge)
                                            ▼
        ┌───────────────────────────────────────────────────────────┐
        │  WORKER — always-on host (Fly.io / Railway), systemd/PM2   │
        │  pg-boss + agents + scheduler + monitor                    │
        │  SSRF-guarded fetch/screenshot adapters                    │
        └───────────────────────────────────────────────────────────┘
                                            ▲
   External dead-man's-switch ──────────────┘  (Healthchecks.io / BetterStack cron)
   pings heartbeat age from OUTSIDE; pages via Telegram + Sentry
```

**The bridge is gone.** One database. The worker talks to it directly because it now lives somewhere
with normal network egress. The external monitor is genuinely external.

## 6. Recommended tech stack

Legend: **Keep** = already right · **Adopt** = add · **Change** = replace.

### Foundation — *keep almost all of it*

| Layer | Today | Recommendation | Why |
|-------|-------|----------------|-----|
| Monorepo | pnpm + Turborepo | **Keep** | Correct choice; already working |
| Language | TypeScript + zod at seams | **Keep** (extend zod to *all* agent seams) | The schemas in `packages/core/schemas.ts` exist but aren't enforced at analyzer/solution/uiux/qa — enforce them |
| Queue | pg-boss (Postgres, no Redis) | **Keep** | Right call at this scale; no Redis to operate. Revisit only past ~10× volume |
| LLM | Anthropic Haiku + Sonnet | **Keep**, but pin + cache (below) | Tiering is correct |

### Database & hosting — *the big change*

| Layer | Today | Recommendation | Why |
|-------|-------|----------------|-----|
| Database | Local Postgres **+** Neon **+** 45s bridge | **Change → one Supabase Postgres** | Kills the split-brain (C-2) *and* directly provides the next three rows |
| Auth | None | **Adopt → Supabase Auth** (single operator, magic-link/password + TOTP 2FA) | Closes C-1 with a batteries-included, RLS-integrated solution |
| Realtime | 9 client pollers | **Adopt → Supabase Realtime** subscriptions | Kills H-5; the code's own comments already aspire to this |
| File storage | GBP photos/screenshots on local disk | **Adopt → Supabase Storage** | Durable, CDN-served, survives container reclaim |
| Worker host | Ephemeral web container | **Change → Fly.io or Railway** (systemd/PM2, direct `:5432`) | Removes C-3's SPOF and the reason the bridge exists |

> **Alternative if you prefer to stay on Neon:** keep Neon as the one DB, add **Auth.js (NextAuth)**
> for the operator login and a small **realtime channel** (Postgres `LISTEN/NOTIFY` via the worker, or
> Neon's WebSocket) for live updates. This works, but you re-implement three things Supabase gives
> free. **Recommended: Supabase** — it was the spec's original intent (§3) and collapses four problems
> into one platform.

### Frontend / UI-UX — *finish what's started*

| Layer | Today | Recommendation | Why |
|-------|-------|----------------|-----|
| Framework | Next.js 14 App Router | **Keep** (optionally → 15) | Fine; the problem isn't the framework |
| Design tokens | Hand-rolled semantic tokens, documented contrast | **Keep** | Genuinely good — build *on* these |
| Primitives | Hand-rolled + native `confirm()`, incomplete tabs, custom bell menu | **Adopt → shadcn/ui (Radix)** | Accessible dialogs/menus/tabs/toasts/tooltips out of the box; drops onto your existing tokens. This is what the spec (§3) asked for |
| Data fetching | 9 copy-pasted `setInterval` pollers | **Change → TanStack Query + Supabase Realtime** | Dedup, caching, real error/loading states, pause-on-hidden; one `usePolledFetch`→ realtime swap |
| Rendering | All client, first paint waits on a client round-trip | **Change → Server Components + streaming** for initial data | Kills the paint waterfall; poll/subscribe only for live deltas |
| Feedback | Silent fetch failures → infinite skeletons | **Adopt → `error.tsx` / `not-found.tsx` boundaries + explicit error UI** | No more spinners-forever |
| Charts (reports) | Hand-rolled SVG | **Optional → Recharts/visx** (or keep, it's accessible) | Only if you want richer reporting |

### Backend hardening

| Concern | Today | Recommendation |
|---------|-------|----------------|
| Auth on mutations | None | **Next `middleware.ts`** gating all `POST /api/*` (webhook excepted — it has HMAC); server actions behind the session |
| SSRF | Open in 4 adapters | **Shared `safeFetch` guard**: resolve host → reject private/link-local/metadata ranges → re-check after every redirect → apply the *same* guard inside the Playwright request-interception handler |
| Atomicity | insert + advance separate | Wrap artifact-insert + `advanceLead` in **one transaction**, or `on conflict (lead_id)` upsert the artifact |
| LLM resilience | No retry, unpinned model | **Localized 429/5xx retry-with-backoff** in `anthropic.ts`; **pin** the Sonnet snapshot; move models + prices to `caps.yaml`; enable **prompt caching** on the large static system prompts |
| Migrations | One `if-not-exists` file | **Numbered migrations + a real runner** (keep raw SQL, or adopt **Drizzle Kit** for type-safe migrations) + a schema-version guard |
| Settings write | Arbitrary key/value | **Allowlist keys** in `POST /api/settings` |
| Dev-tools gate | Fails open off Vercel | **Fail closed** by default (`ALLOW_DEV_TOOLS==="1"` only) |
| `agent_events` | Unbounded | **Monthly partitioning + retention** (archive > N days); add composite index `(type, created_at)` |

> **Drizzle vs raw SQL:** the current raw-SQL is disciplined and fully parameterized, so this is
> optional. Adopt **Drizzle ORM** if you want compile-time query safety and first-class migrations
> (helps "accuracy"); keep raw SQL + numbered migrations if you'd rather not add an abstraction. Either
> is defensible — don't let it block the security/infra work.

### Observability, quality & delivery — *add what's missing*

| Concern | Today | Recommendation |
|---------|-------|----------------|
| Worker liveness | Detector runs inside the worker | **External dead-man's-switch** — Healthchecks.io or BetterStack cron queries `max(created_at) from agent_events where type='worker.heartbeat'` and pages on staleness |
| Alerting | DB rows only | **Wire `notifyOperator` → Telegram + email** (env already declared) and **Sentry** for exceptions |
| Error tracking | `console.error` to ephemeral `/tmp` | **Sentry** (worker + dashboard) |
| Logs | `/tmp/…log`, lost on reclaim | **Ship to Axiom / BetterStack / Logtail** (structured JSON) |
| Metrics | None | **OpenTelemetry** (optional) or at minimum queue-depth / latency / spend gauges surfaced in the dashboard |
| CI | None | **GitHub Actions**: `pnpm typecheck && lint && test && build` on every PR — *required* to merge |
| Lint/format | None (dead `eslint-disable` comments) | **Biome** (one fast tool for lint+format) or ESLint+Prettier |
| Tests | 2 files | **Vitest** unit + **Playwright** e2e, prioritizing: email gate, `approveAndSend` idempotency, `advanceLead` under concurrent callers, SSRF guard, bridge-replacement path |
| Deploys (demos) | Vercel API | **Keep**, add a **free-tier deploy-count guard** (a fleet rebuild can silently hit the daily ceiling) |
| Email/booking | Resend + SMTP + Cal.com | **Keep** — per spec, correctly built |

### How each recommendation maps to your three goals

- **Better UI/UX** → shadcn/Radix primitives (accessible dialogs/menus/tabs/toasts, no more native
  `confirm()`), Supabase Realtime (live, not laggy), error/empty boundaries (no infinite skeletons),
  a11y fixes (contrast on small text, complete tab pattern, sandboxed iframes), Server-Component SSR
  (instant first paint).
- **Speed** → realtime replaces polling (less DB load, instant updates), streaming SSR (no paint
  waterfall), **prompt caching** (lower LLM latency + cost), one DB (no 45s reconcile lag), composite
  indexes + `agent_events` retention (hot-path queries stay fast at volume), trimmed font weights.
- **Accuracy** → zod enforced at *every* agent seam, atomic transactions (no duplicate artifacts),
  pinned models + prompt caching (stable behavior), untrusted-content delimiters, and real test
  coverage on the exact modules where incidents occurred.

---

# PART 3 — EXECUTION PLAN

Sequenced by **risk-reduction per unit effort**. Each phase is independently shippable. Effort is a
rough solo-developer estimate.

### Phase 0 — Stop the bleeding (security & data) · ~2–4 days 🔴

*Do this before the dashboard is exposed to anyone.*

1. **Add authentication.** Supabase Auth + a `middleware.ts` gate over every route; exempt only the
   HMAC-verified Cal.com webhook. (Closes C-1.)
2. **Fail the dev-tools gate closed** (`lib/devtools.ts`); **allowlist keys** in `POST /api/settings`.
3. **Purge PII from the repo and history.** Add `data/leads.json`, `data/research/`, `drafts/*.md` to
   `.gitignore`; scrub from history; keep prospect data in Postgres only. (Closes H-2.)
4. **Complete and verify key rotation** for every chat-exposed credential. (Closes H-3.)
5. **SSRF guard.** Ship the shared `safeFetch` and apply it in `qualify`, `crawl`, `copy`, and the
   Playwright interception handler. (Closes H-1.)

### Phase 1 — Collapse the split-brain (infra) · ~4–7 days 🔴

*The highest-leverage architectural change.*

1. **Move the worker to Fly.io or Railway** (systemd/PM2, direct `:5432`).
2. **Collapse to one Supabase Postgres**; migrate data; **delete `apps/worker/src/bridge.ts`** and the
   dual-DB toggle machinery. (Closes C-2 and its whole incident class.)
3. **External dead-man's-switch** (Healthchecks.io/BetterStack) + **Telegram/Sentry alerting** wired
   into `notifyOperator`. (Closes C-3.)
4. **Ship logs off `/tmp`** to a durable store.

### Phase 2 — Quality gates (CI + tests) · ~3–5 days 🟠

1. **GitHub Actions**: typecheck + lint (Biome) + test + build on every PR, required to merge.
2. **Replace placeholder test scripts with real Vitest tests** for the email gate, `approveAndSend`
   idempotency, `advanceLead` concurrency, batch admission, and the new SSRF guard.
3. **Playwright e2e** for the operator's critical paths (login, approve-and-send, discover).

### Phase 3 — Frontend / UX overhaul · ~1–2 weeks 🟡

1. **Adopt shadcn/ui (Radix)** on the existing tokens; replace native `confirm()`, the incomplete tab
   pattern, and the custom bell dropdown with accessible primitives + toasts.
2. **Replace the 9 pollers with TanStack Query + Supabase Realtime**; add `error.tsx`/`not-found.tsx`
   and explicit per-page error UI. (Closes H-5.)
3. **Server-Component SSR of initial data** + streaming; subscribe for deltas only.
4. **A11y pass:** stop using the 3.2:1 `faint` token on small body text; complete the lead-page tab
   ARIA; **sandbox** the demo iframes; trim font weights.

### Phase 4 — Backend correctness & LLM · ~1 week 🟡

1. **Atomic artifact-write + advance** in every agent (or idempotent upsert on `lead_id`).
2. **Anthropic adapter:** retry/backoff, **prompt caching**, **pinned** Sonnet snapshot, models/prices
   → `caps.yaml`.
3. **Re-entrancy guards** on the scheduler and the research/outbox/photo-heal polls.
4. **Numbered migrations + runner** (or Drizzle Kit) + a schema-version guard.
5. **`agent_events` partitioning + retention**; composite `(type, created_at)` index.

### Phase 5 — Scale & polish · ongoing 🟢

1. Metrics/observability surfaced in-dashboard (queue depth, latency, daily spend).
2. **Vercel free-tier deploy-count guard.**
3. **Promote `legacy/templates/roofers`** (a live build dependency) into a first-class `packages/`
   template; **delete the dead `legacy/src`** and its nested lockfile.
4. Untrusted-content delimiters in LLM system prompts; move QA's secret-scan *before* deploy.

## 7. Quick wins vs. strategic bets

**Quick wins (hours–days, outsized payoff):**
- Auth middleware (C-1) — a few hours, removes the single scariest hole.
- `.gitignore` + history scrub + key rotation (H-2/H-3).
- Fail-closed dev-tools gate; settings allowlist.
- SSRF `safeFetch` guard (H-1).
- Prompt caching in `anthropic.ts` — immediate LLM cost + latency win.

**Strategic bets (the multi-day investments that pay for years):**
- One database on Supabase + worker on a real host (deletes the bridge and the SPOF at once).
- CI + a real test suite on the incident-prone modules.
- Realtime + shadcn front end.

## 8. Decision points for you (the operator)

These change the plan and are genuinely yours to call:

1. **Supabase vs. stay-on-Neon+Auth.js.** Recommended: **Supabase** (auth + realtime + storage + RLS in
   one platform; matches the original spec). Choose Neon+Auth.js only if you have a specific reason to
   stay on Neon.
2. **Worker host: Fly.io vs. Railway vs. a plain VPS.** Any works; the requirement is *always-on with
   normal `:5432` egress and a process supervisor*. Fly/Railway are the least ops.
3. **Drizzle ORM vs. raw SQL + numbered migrations.** Optional; Drizzle buys compile-time query safety,
   raw SQL keeps things dependency-light. Don't let this block Phases 0–1.
4. **Appetite/sequencing.** The plan is ordered so Phases 0–1 (security + infra) can ship before any
   UI work. If "make the frontend look better" is the visible priority, Phase 3 can run in parallel
   with Phases 2/4 — but **Phase 0 must land first** regardless.

---

*This document is an audit and plan only — no application code was modified. Findings cite
`file:line` against branch `claude/read-pdf-89t95k`. Next step on your word: I can start executing
Phase 0 (auth + data hygiene + SSRF guard), which closes the three highest-risk items in the smallest
footprint.*
