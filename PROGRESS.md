# Agency Autopilot — PROGRESS

Build log per `AGENCY_AUTOPILOT_SPEC.md` §13. Updated at the end of every work session and phase.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 0. Foundation | ✅ complete (2026-07-02) | acceptance evidence below |
| 1. Pipeline skeleton (mock) | ✅ complete (2026-07-02) | evidence below |
| 2. Real discovery | in progress (2026-07-02) | code complete; acceptance run in flight |
| 3. Analysis + solution | pending | |
| 4. Design, build, QA | pending | |
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
