# Agency Autopilot — PROGRESS

Build log per `AGENCY_AUTOPILOT_SPEC.md` §13. Updated at the end of every work session and phase.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 0. Foundation | ✅ complete (2026-07-02) | acceptance evidence below |
| 1. Pipeline skeleton (mock) | ✅ complete (2026-07-02) | evidence below |
| 2. Real discovery | ✅ complete (2026-07-03) | cap enforcement demonstrated live; evidence below |
| 3. Analysis + solution | ✅ complete (2026-07-03) | vision audits + resilient no-empty-audit guarantee; evidence below |
| 4. Design, build, QA | in progress (2026-07-03) | builder wraps the legacy demo engine |
| 5. Outreach + booking | pending | |
| 6. Monitoring + reports | pending | |
| 7. Hardening + docs | pending | |

## Phase 0 work log (2026-07-02)

- Spec committed to repo root as `AGENCY_AUTOPILOT_SPEC.md`.
- Repo restructured in place per §3: existing Web Studio pipeline moved (git renames, nothing
  deleted) to `/legacy` and kept runnable (`pnpm legacy <script>`; its env loader now also reads
  the repo-root `.env.local`). `drafts/` and `data/` stay at root: they are live operator
  artifacts (sent outreach, CRM snapshot, research). `legacy/templates/roofers` is the source
  material for the Phase 4 block library. `legacy/data` import into `leads` (source='legacy')
  lands with Phase 2.
- Monorepo: pnpm workspaces + Turborepo. Layout per §3.
- **Local Postgres 16 stands in for Supabase Postgres in dev** (same engine; DATABASE_URL swap
  moves to real Supabase with zero code change). Supabase Auth + Realtime are production
  concerns: dashboard uses direct pg + 2s polling locally, with a single documented seam
  (`apps/dashboard/lib/db.ts`, `/api/events`) to swap to supabase-js channels.
- Full §5 schema as `supabase/migrations/00001_init.sql` (all tables, enums, updated_at
  triggers, suppression constraints, event indexes). File-based migration runner in
  `@autopilot/core` (`pnpm migrate`).
- `@autopilot/core`: lead status enum + explicit transition map, `advanceLead()` (transactional,
  row-locked, idempotent no-op on same-state, illegal transitions throw + emit error events),
  event bus (`emitEvent`, `notifyOperator`), zod schemas for agent seams, vitest suite.
- `@autopilot/worker`: pg-boss boot + 60s heartbeat events + seed-event script.
- `@autopilot/dashboard`: Next.js 14 skeleton, dark operator UI, nav for all §8 pages,
  `/activity` live tail working against agent_events.
- `.env.example`: every §10 key documented. `MOCK_MODE=true` default posture.
- CLAUDE.md: spec §4 merged as `## System rules`; original contract content untouched above it.

## Phase 0 acceptance evidence

- `pnpm migrate`: `apply 00001_init.sql ... migrations up to date` against local Postgres 16.
- `pnpm --filter @autopilot/core test`: 8/8 state machine tests pass (happy path
  discovered->delivered, auto-mode skip, QA fail loops, illegal transitions rejected,
  suppression reachability, terminal states, nurture revival).
- Worker boot: pg-boss starts, `worker.started` event lands in agent_events, 60s heartbeat wired.
- Seed event: `pnpm seed-event` writes + reads back `system.seed`.
- Dashboard: `next build` clean; `/activity` renders; `/api/events` returns the seeded + worker
  events as JSON (verified live on :3100).
- CLAUDE.md: original contract intact, `## System rules` appended.
- `git status` during restructure showed R (rename) records, zero deletions.

## Phase 1 acceptance evidence

- "Run mock lead" (POST /api/dev/run-mock-lead, button on /pipeline) carried a fixture lead
  discovered -> delivered through all 18 stages in ~60s, driven by pg-boss agent queues + the
  2s scheduler (singleton keys per lead+status).
- Artifacts written by stubs along the way: 1 audit, 1 solution, 1 design, 2 builds (demo+final),
  qa_reports, 3 emails (outreach awaiting_approval -> sent, inbound reply, delivery), 1 classified
  reply, 2 operator notifications, 44 agent_events.
- Kanban (/pipeline) + lead timeline (/leads/[id]) + notification bell render live from polls.
- Illegal transition rejected ORGANICALLY in traffic: a duplicate QA job fired post-advance and
  advanceLead threw + emitted an error event ("illegal lead transition delivered ->
  outreach_ready"). Exactly the designed behavior.
- Hardening note for Phase 7: singletonSeconds=30 allows stub re-runs inside a status window
  (6 qa_reports rows). Real agents get per-(lead,step) idempotency keys per spec 4.4.

## Phase 2 work log (2026-07-02)

- config/icp.yaml (contract rubric encoded exactly, cities, verticals, chain markers) +
  config/caps.yaml (hard limits incl. places_calls_per_day, crawl politeness).
- @autopilot/adapters: anthropic (model map Haiku/Sonnet, per-call cost into agent_events,
  daily budget guard, mock), places (search+details, cap-metered, mock), crawl (fetch-based,
  honest UA, robots.txt, 1req/2s per domain, mock), dns (DoH MX check), pagespeed (real, key
  verified), config loader with /settings overrides.
- Real agents: research (ICP queries, dedupe on place_id + domain + suppression, cap-aware
  pause + operator notification), scrape/enrich (details w/ verbatim reviews + photo refs, site
  crawl, Haiku contact extraction verified against page text, MX check, no_contact_path DQ),
  qualify (deterministic rubric, chain DQ, nothing-to-personalize DQ, threshold routing).
- Worker: real-vs-mock handler selection; real mode PAUSES at unimplemented stages instead of
  running fixtures against real leads. Operator research requests ride the event stream.
- Dashboard: Discover-leads button, /settings page (outreach mode + ICP overrides editor).
- Legacy import: 60/60 Web Studio CRM leads imported (source='legacy', stage mapping in
  import-legacy.ts). Dedupe verified: discovery skipped all known place_ids.
- ENV ADAPTATIONS (spec allows, logged per §15): crawl uses Node fetch instead of Playwright
  (headless browsers cannot reach external sites in this container; screenshots in Phase 3 will
  reuse the legacy request-interception technique). Qualifier weak-site judgment is a
  deterministic probe until Phase 3 screenshots exist. GBP photo download to Supabase Storage
  deferred until real Supabase exists; photo resource names stored on the lead meanwhile.
- INCIDENT during acceptance: the Phase 1 mock worker was still running alongside the real
  worker and fixture-advanced 2 real leads. Stopped it, purged fixture artifacts, reset both
  leads to qualified, logged lead.repaired events. Hardening note: worker should take a
  pg advisory lock so only one instance runs per database (Phase 7).

## Phase 2 close-out (2026-07-03)

Cap enforcement was demonstrated LIVE, not just coded: during the Phase 3 run the Places daily
cap (200/day) fired organically. Two hardening fixes that surfaced there are now in:

- **Scrape defers, never retry-storms.** On `CapExceededError` the scrape agent emits
  `scrape.deferred` and returns (job completes) instead of throwing; the scheduler skips scrape
  scheduling entirely once `usedToday('places.call') >= cap`. Before the fix, thrown cap errors
  became pg-boss retries and the scheduler kept re-enqueueing, piling up ~10k dead jobs.
- **Singleton window > slowest job.** The scheduler enqueued with `singletonSeconds:30`, shorter
  than an analyzer job (PageSpeed up to 90s), so a lead still being processed got re-enqueued
  every 30s. Raised to 300s. This is the general root cause of queue backlog buildup.

Acceptance evidence:
- Discovery + dedupe: 60/60 legacy leads imported (`source='legacy'`); discovery skipped all
  known `place_id`s. Real Places search + details produced new qualified Dallas roofers.
- Qualifier applies the §4 rubric deterministically (chain DQ, nothing-to-personalize DQ,
  threshold routing); scores visible on `/pipeline` cards.
- Cap hit → `cap.hit` event + operator notification + queue pause for that resource, no silent
  drop (spec §4.5). Verified in `agent_events`.

## Phase 3 work log + acceptance (2026-07-03)

Analyzer (real): PageSpeed (mobile) + 3-viewport Puppeteer screenshots + Sonnet findings, each
finding citing concrete evidence. Solution maker (real): Sonnet pitch/pages/features/
differentiators + `automation_opportunities` + the operator call sheet (30s opener, the one
finding to name, objections, automation upsell for post-close, best call window). Both advance
the state machine.

Hardening that verifying real leads surfaced (commit "Analyzer vision + resilient audits"):

- **Sonnet audits the real page, not metadata.** The llm adapter now accepts image inputs; the
  analyzer feeds the actual rendered mobile + desktop screenshots. Findings cite what is visibly
  there. Example (Qualis Roofing): Sonnet caught that both screenshots render a Cloudflare
  "Checking the site connection security" gate instead of content, cross-referenced a real 46s
  LCP and a 92 SEO score against the blank render, and flagged the contradiction, honestly.
- **PageSpeed transient 500s retried** ("Lighthouse returned error: Something went wrong"). The 4
  sites that all failed on the first pass (Dallas Commercial, Pappas, Scott Exteriors,
  Stormnation) all scored on retry.
- **No qualified lead gets an empty audit.** If PageSpeed and the model both come up short, a
  deterministic fallback builds findings from strictly-known facts (Lighthouse scores or their
  measured absence, GBP reviews, site presence). No fabrication. Result: 0 empty audits across
  the dataset.
- **Idempotency guards** on analyzer + solution: a duplicate job for an already-advanced lead
  no-ops (`analyzer.skipped` / `solution.skipped`) instead of burning a Sonnet call and throwing
  on an illegal transition. Observed working live.

Acceptance (spec §13 Phase 3):
- Real qualified lead WITH website → full audit (Lighthouse scores, 3-viewport screenshots,
  3-6 evidence-backed findings) + solution doc with call sheet. Confirmed on Qualis, Firehouse
  (solution caught an inflated "500+" badge vs the real 57 reviews and recommended leading with
  the honest number), Scott Exteriors, Dallas Commercial, Stormnation.
- No-website lead → coherent absence-based audit. Confirmed on RidgePoint Roofing Dallas:
  5 findings, each citing the real absence (`has_website false`, `4 reviews at 5.0`), tied to
  lost after-hours/emergency jobs. No invented competitors or data.
- Cost metered per call into `agent_events.cost_usd` (spec §9); analysis-phase spend tracked.

ENV NOTE (spec §15): some prospect sites sit behind Cloudflare/bot gates, so the request-
interception screenshot captures the challenge page. The analyzer reports that honestly as a
finding (a slow security gate IS real signal); demo-quality screenshots that need the real render
are a Phase 4 concern, not an audit blocker.

## Resolved by operator (2026-07-03)

- VERCEL_TEAM_ID = team_voh3ERES2pZRIuOQyokFBIUD (verified: "Mann Pandya's projects"). Phase 4 deploy unblocked.
- AGENCY_DOMAIN = tradecraftsites.com (owned).
- RESEND_API_KEY set (send-only key, verified; least-privilege = correct for transactional).
  REMAINING for sending: verify tradecraftsites.com in the Resend dashboard (add Resend's DKIM/SPF
  DNS records) before any transactional email leaves.
- CALCOM_API_KEY set (v2, verified as mann@tradecraftsites.com). "15min" intro event exists
  (slug 15min, id 6200784). REMAINING: CALCOM_WEBHOOK_SECRET (create a webhook in Cal.com pointing
  at the worker's /webhooks/calcom for BOOKING_CREATED/CANCELLED).
- config/agency-facts.yaml created with confirmed identity + deploy + booking facts; offer numbers
  and trust facts flagged [NEEDS: confirm] so demo copy never claims an unconfirmed fact.
- ui-ux-pro-max skill + 21st.dev MCP installed (web-studio demo toolchain).
- Operator to ROTATE all chat-exposed keys: Google Places, Vercel, Anthropic, PageSpeed, 21st,
  Resend, Cal.com.

## Blockers (spec §14 — operator to provide; build continues elsewhere)

- **Before Phase 2:** PAGESPEED_API_KEY (PageSpeed Insights). GOOGLE_PLACES_API_KEY exists from
  the legacy pipeline (operator: ROTATE it, it was shared in chat). Confirm launch ICP cities
  (current: Dallas, TX + suburbs; vertical: roofing).
- **Before Phase 4:** VERCEL_TEAM_ID (VERCEL_TOKEN exists; operator: ROTATE), AGENCY_DOMAIN
  (tradecraftsites.com owned), DEMO_BASE_DOMAIN decision (demo.tradecraftsites.com needs the
  domain added to Vercel), agency facts for `config/agency-facts.yaml` (name: TradeCraft Sites;
  need: logo?, years?, offer numbers).
- **Before Phase 5:** outreach domain purchase (e.g. gettradecraftsites.com) + 2-3 Google
  Workspace mailboxes + warmup dates; RESEND_API_KEY; GMAIL_OAUTH_* credentials; CALCOM_API_KEY +
  webhook secret + event type; US phone number for Touch-2 call tasks; offer numbers (setup fee
  range + monthly retainer) for agency-facts; TELEGRAM_BOT_TOKEN/CHAT_ID (optional).

## Product note (2026-07-03, operator decision)

Offer expanded: websites + workflow automation as expansion revenue (CLAUDE.md §1). Autopilot
impact: Phase 3 solutions agent gains an `automation_opportunities` field on the call sheet
(observed leaks -> matching package); Phase 5 delivery email mentions the day-30 automation
review. Cold outreach is UNCHANGED (demo-first, one move).

## Conventions

- TypeScript everywhere, ESM, zod at every seam. Prompts live in versioned files under
  `/packages/agents/*/prompts/`.
- Events: `agent.verb` types (`lead.status_changed`, `build.deployed`, `email.sent`).
- Local dev DB: `postgres://autopilot:autopilot_local_dev@localhost:5432/agency_autopilot`
  (dev-only credentials, documented here intentionally).
