# Agency Autopilot — PROGRESS

Build log per `AGENCY_AUTOPILOT_SPEC.md` §13. Updated at the end of every work session and phase.

---

# AI AGENCY EVOLUTION BUILD (2026-07-17, branch `claude/read-pdf-89t95k`, PR #1)

Governing docs: `AI_AGENCY_MASTER_SPEC.md` (source of truth) + `IMPLEMENTATION_PLAN.md` (file-level).
This session evolved the website-only autopilot into the multi-service AI agency. Everything below is
**MOCK-first and CI-green** (Biome + typecheck + Vitest + eval harness on every commit); nothing spends
real money. Operator inputs to flip subsystems MOCK→LIVE are tracked in `NEEDS_FROM_OPERATOR.md`.

### Operator decisions locked (2026-07-17)
- **Branch:** execute on `claude/read-pdf-89t95k`. **Queue:** keep pg-boss (spec's "boring proven tech
  over novel tech" beat the Graphile migration; single-worker is fine for the 12-month target).
- **First premium niche:** healthcare (med spa / dental / mental health / chiropractic).

### Delivered slices (each committed + pushed, gates green)
| # | Slice | Master-spec phase | Acceptance |
|---|-------|-------------------|------------|
| 1 | Quality rails: GitHub Actions CI, Biome, real Vitest (echo stubs gone), eval harness (`packages/evals`) | Phase 0 | red PR blocks; evals run; fixed a stale font-registry test |
| 2 | SSRF guard (`safeFetch`) on all 4 adapters + Playwright interception; settings-key allowlist; dev-tools fail-closed | Phase 1 | 36-case SSRF corpus green |
| 3 | Spend-gate core: `awaiting_build_approval` status + `canRunBuild` decision + build budget + `BUILD_MODE` | Phase 2 | 6-case gate test; gate can't be skipped |
| 4 | Spend-gate wiring: scheduler parks qualified leads at the gate; analyzer admitted only on approval/auto-in-budget; `/api/shortlist` + approve | Phase 2 | no build job without an approval event |
| 5 | Premium UI foundation: shadcn-style Radix primitives on existing tokens, TanStack Query, sonner; **premium Shortlist page** (keyboard-first) | Phase F/§12 | next build green |
| 6 | Opportunities spine: `service_type` + `opportunity_status` enums, `opportunities` table + backfill, `advanceOpportunity` | Phase 4 | 7-test opportunity state machine |
| 7 | Niche engine (Amendment A): `@autopilot/compliance` + activation gate; roofing baseline + 4 healthcare niches | Phase 4/§Amendment A | healthcare blocked until BAA+insurance+PHI |
| 8 | Revenue rails: `config/pricing.yaml` + `@autopilot/billing` — contract generator (no blanks/contradictions possible; IP clause guarded) | Phase 3 | 7 tests |
| 9 | Dashboard auth gate: `middleware.ts` over every route + HMAC-signed operator session; premium `/login`; logout | Phase 1/§9 (closes audit C-1) | 401 everywhere; fails closed on hosted |
| 10 | Chatbot core (`@autopilot/chat`): KB grounding + anti-fabrication (never invents prices/availability) | Phase 5/§7.2 | 8 tests |
| 11 | Voice core (`@autopilot/voice`): TCPA consent gate (no record→refuse) + 4 assistant templates w/ AI disclosure | Phase 6/§7.3,§10 | 8 tests |
| 12 | Automation core (`@autopilot/automation`): A2P/SMS gate (blocked until campaign approved; STOP global; quiet hours) + 3 templates | Phase 7/§7.4,§10 | 9 tests |
| 13 | Delivery ops (`@autopilot/delivery`): measured-only value report + auto SLA credits | Phase 8/§7.5 | zero estimated numbers in report |
| 14 | Frontend resilience: app-wide `error.tsx`/`not-found.tsx` boundaries + logout UX | Phase F/§12 | next build green |
| 15 | Dashboard-wide TanStack Query migration: every page (shortlist, meetings, builds, activity, outbox, reports, pipeline, lead-detail) off hand-rolled `setInterval` pollers → `useQuery`/`useMutation` with real error+retry states; outbox/pipeline actions invalidate on success (instant refresh); Button primitive on all action buttons | Phase F/§12 (closes audit "silent failures / infinite skeleton") | `grep setInterval app/` empty; 7 builds green |
| 16 | Opportunity dispatch router (`dispatchOpportunity`) — pure `(service_type, status)`→action map; service-specific build/onboard queues, shared outreach+gate; exhaustive `never` guard | Phase 4 wiring/§8.3-8.4 | 9 tests, all 4 service lines |
| 17 | Opportunity scheduler plan (`planOpportunityDispatch`) + worker wiring (`opportunityDispatch.ts`): reuses `canRunBuild`, admits best-score-first until the daily budget runs out; flag-gated (`OPPORTUNITY_DISPATCH` off→shadow→execute), non-website only | Phase 4 wiring/§2,§8.4 | 8 planner tests; worker typechecks; gated OFF |
| 18 | Service detection (`detectServiceOpportunities`) — conservative heuristics pick which lines to carry; website=cold, chatbot/voice/automation=expansion. Plus the **sell-after-close guard**: the planner holds a non-website `identified` opp until the lead's website opp is won (`websiteUnlocked` join in the dispatcher) | Phase 4 wiring/§8.3, CLAUDE.md §1 | 7 detection + 4 hold tests; enforces "sell after close" |
| 19 | Opportunity CREATION wired: `websiteOpportunityStatusFor` (pure lead→website projection, single source of truth for the backfill map + unlock set) + `ensureServiceOpportunities` (upserts website line synced to lead_status + expansion lines at `identified`), called from the qualifier. Dispatcher unlock now derives from authoritative `lead_status` (no website-opp sync needed). Premium **Service lines** tab on the lead detail | Phase 4 wiring/§8.3 | 5 projection tests; qualifier + worker typecheck; creation is best-effort (never fails qualification) |
| 20 | **Chatbot product artifact**: embeddable `chat-widget.js` (self-contained, themeable, XSS-safe via textContent, floating or inline) + `/api/chat` (input-validated, KB from the lead's REAL facts, answers through `@autopilot/chat` guardrails, declines rather than fabricate) + premium **Chatbot** dashboard page (live preview against a labeled sample + copy-paste embed). next.config transpiles the workspace TS pkg | Phase 5/§7.2 | dashboard build green; live answers gated on Anthropic key (grounded either way) |
| 21 | **Voice + Automation product surfaces**: premium `/voice` (4 assistant templates + the TCPA consent model + Vapi activation placeholder) and `/automation` (3 productized templates + A2P/SMS consent model + Twilio/Trigger.dev placeholder), both server components rendering the real templates from `@autopilot/{voice,automation}` (single source of truth). Sidebar now carries all four service lines | Phase 6-7/§7.3,§7.4,§10 | static build green; safety model front-and-center |
| 22 | **Spine MOCK loop closed**: `opportunityHandlers.ts` registers a MOCK consumer per non-website opportunity queue (propose→build→outreach→onboard advances), so `OPPORTUNITY_DISPATCH=execute` runs a full expansion lifecycle under MOCK. Website queues are excluded (they're the lead agents'). Fixed the router's outreach queue → dedicated `agent:opportunity-outreach` (never collides with lead sales) | Phase 4 wiring/§7.2-7.4 | 3 worker tests (incl. no-website-queue collision); full build green; real handlers replace these per adapter |
| 23 | **Runtime E2E verification**: opt-in integration test (`spine.integration.test.ts`, skipped unless `RUN_DB_IT=1`) run against a real Postgres 16 — migrations apply clean, `ensureServiceOpportunities` creates website(proposed)+3 expansion lines on real SQL, idempotent on repeat, the sell-after-close hold holds 3 / then unlocks all 3 at `closed_won`, and `advanceOpportunity` applies a legal transition + rejects an illegal one transactionally | Phase 4 wiring | 4 IT pass on Postgres; **skipped in MOCK CI** (57 tests: 53 pass + 4 skipped) — the "needs a Postgres" caveat is now a verified fact |
| 24 | **Pricing surface**: premium `/billing` page renders the 7-tier offer ladder from `config/pricing.yaml` (via `@autopilot/billing`, single source of truth) + a REAL generated contract preview (sample parties) so the "mispricing/blank-field is impossible" guardrail is demonstrated, not asserted. `force-static` so config reads happen at build, not runtime | Phase 3/§4 + Amendment A | static build green; contract renders through the validator |
| 25 | **Delivery surface**: premium `/delivery` page — a sample monthly value report through `generateValueReport` (measured-only; visibly withholds the 2 non-measured figures) + auto SLA-credit computation through `computeSlaCredits` (sample bad month → 20% / $ credit) + the retention rationale. Renders the real `@autopilot/delivery` functions | Phase 8/§7.5 | static build green; "honesty is the moat" shown, not told |

### New packages
`@autopilot/{evals, compliance, billing, chat, voice, automation, delivery}` + dashboard UI kit
(`components/ui/*`, `QueryProvider`, auth). Migrations `00002` (spend gate), `00003` (opportunities).

### What remains before go-live (needs operator inputs or a running DB to verify)
- **Wiring:** the opportunity dispatch decision layer is built + tested (router + planner, slices 16-17)
  and wired into the worker behind `OPPORTUNITY_DISPATCH` (default **off**; `shadow` observes,
  `execute` acts on non-website lines). The detection brain (`detectServiceOpportunities`) + the
  sell-after-close hold are built + tested (slice 18), creation is WIRED into the qualifier (slice 19),
  and the MOCK stage handlers now close the loop (slice 22) so `execute` advances an expansion
  opportunity propose→build→outreach→onboard end to end under MOCK. Still pending: (a) a Postgres to
  verify `execute` end-to-end at runtime, (b) the REAL per-service handlers (Vapi assistant
  provisioning, Twilio A2P, the chatbot builder) that replace the MOCK stage handlers as their adapters
  land. The website line keeps running on the lead scheduler.
- **Real adapters (credential-blocked, all mock-stubbed today):** Vapi (voice), Trigger.dev + Twilio
  (automation/A2P), Stripe (billing checkout/webhooks/dunning), Supabase (single DB + Auth + RLS),
  Sentry + healthchecks.io (observability), Fly.io (always-on worker → delete the bridge).
- **Demo Hub app + chat `<script>` widget** (frontend page migration to the premium kit is done — all
  8 dashboard pages are on TanStack Query with error/retry states).
- **Healthcare niche activation:** operator provides BAA template + E&O insurance + PHI toggle.
- All items enumerated in `NEEDS_FROM_OPERATOR.md`.

### Conflicts flagged (per spec precedence rule)
- Spec §8.5 mandates Graphile Worker; spec §0 prefers "boring proven tech." Operator chose pg-boss
  ("best one"). Recorded here per the "flag conflicts in PROGRESS.md" rule.

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 0. Foundation | ✅ complete (2026-07-02) | acceptance evidence below |
| 1. Pipeline skeleton (mock) | ✅ complete (2026-07-02) | evidence below |
| 2. Real discovery | ✅ complete (2026-07-03) | cap enforcement demonstrated live; evidence below |
| 3. Analysis + solution | ✅ complete (2026-07-03) | vision audits + resilient no-empty-audit guarantee; evidence below |
| 4. Design, build, QA | ✅ complete (2026-07-03) | block library + uiux/builder/qa; real Vercel demo live; evidence below |
| 5. Outreach + booking | mock ✅ (2026-07-03) | full sequence/gate/reply/booking pass on mock; LIVE gated on operator mailboxes |
| 6. Monitoring + reports | ✅ complete (2026-07-04) | hourly anomaly sweep + daily digest; acceptance 10/10 below |
| 7. Hardening + docs | ✅ complete (2026-07-04) | advisory lock, stale-claim recovery, mock-on-real guard, RUNBOOK.md; chaos evidence below |

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

## Phase 4 work log + acceptance (2026-07-03)

Design -> build -> QA, wrapping the proven legacy roofing demo engine rather than rebuilding it
(spec §2.7: existing demos are the block library's source material; CLAUDE.md §5 is the
authoritative build spec).

- **`@autopilot/blocks`** — typed block library: 14 blocks in the validated CLAUDE.md §5b narrative
  order (each declaring persona, the customer question it answers, the real facts it needs so a
  block is omitted not faked, and its §5 ref), a looks registry (the 4 proven roofing looks ported
  verbatim + curated plumbing/hvac/dental looks, all anti-slop), and 4 vertical presets (roofing
  live; the rest declared + look-ready to activate). 7/7 tests. `looks` table seeded (10 looks).
- **uiux agent** (solution_ready -> design_ready): assigns a look (contract §5d: no two prospects in
  the same preset+metro share a look while free looks remain; stored on the design, locked once
  sent), Sonnet writes hero copy + section intent from VERIFIED facts only. Writes designs.brand/
  sitemap/page_specs.
- **builder agent** (design_ready/closed_won -> demo_qa/final_qa): composes the demo by filling the
  legacy roofing template with the lead's real reviews (verbatim, curated 4+) + GBP photos + the
  assigned look, adds the watermark bar + noindex for demos, deploys via the Vercel adapter. Atomic
  in-flight-build claim closes the self-trigger race; per-lead demo-phase budget enforced;
  concurrent-build cap + score-desc ordering in the scheduler (spec §9).
- **qa agent** (demo_qa/final_qa -> outreach_ready/delivery_approval): mechanizes the CLAUDE.md §8
  Definition of Done. Fix loop back to the builder, max 2 iterations then hold + notify. SEO is
  advisory on demos (a noindexed demo cannot clear Lighthouse SEO 90 by design) and critical on
  finals.
- **Template**: additive watermark + noindex gated by content flags (legacy/final behavior
  unchanged). Vercel deploy + cap-metered photo-fetch adapters.

Acceptance (spec §13 Phase 4):
- One command (`build-demo.ts`) took `James Kate Roofing & Restoration` (solution_ready) to a LIVE
  demo through uiux -> builder -> qa. Live at
  `https://james-kate-roofing-restoration-demo-tradecraft.vercel.app`: HTTP 200, Lighthouse mobile
  **perf 97**, watermark + noindex + tap-to-call all present in the served HTML, all 7 critical QA
  checks green, Sonnet vision review clean. Look `ember-storm`, all copy/reviews from real GBP data.
- Broken-build fix loop: `build-demo.ts <lead> --break` injected a placeholder into build #1;
  QA caught it (`no placeholder copy` failed, 1 issue), looped to demo_building, the builder rebuilt
  clean (#2), QA passed with 0 issues -> outreach_ready. Caught and fixed within 2 iterations.
- Look distinctness held: James Kate got `ember-storm`, Results Roofing got `moss-craft` (both
  roofing, no reuse while free looks remained).
- Full flow also verified in MOCK mode (local deploy, zero spend) for the state-machine traversal.

ENV NOTE (spec §15): the Places daily cap was spent during the run, so real GBP photos could not be
downloaded for the live demo; the template rendered its honest empty-gallery state (never a stock
placeholder, CLAUDE.md §0.1) and QA did not fail on it (photos are not a critical check). Photos
fill on the next day's budget.

## Phase 5 work log + mock acceptance (2026-07-03)

Outreach engine built and passing on mock adapters (email -> /tmp/outbox, Haiku classify -> mock).
LIVE sending stays gated on operator setup (outreach domain + warmed mailboxes + Resend DNS).

- Email adapter (`@autopilot/adapters/email`): `sendEmail` (MOCK -> /tmp/outbox .eml; REAL -> Resend
  with Idempotency-Key), the CAN-SPAM/suppression/caps **gate** (`emailGate`), `voiceLint` (§3
  banned phrases + em dashes), `canSpamFooter` (real address or refuse), suppression helpers.
- Sales agent (`@autopilot/agents/real/sales`): outreach_ready -> Touch-1 demo drop (deterministic
  §3-clean shape, the audit's top finding as the real opener, the live demo link, binary close) ->
  awaiting_approval (review) or auto-send. `approveAndSend` (gate + idempotent send + advance to
  contacted + Touch-2 call task), `ingestReply` (Haiku classify -> suppress+halt on opt-out, else
  notify + advance to replied), `ingestBooking` (meeting + meeting_booked + notify), `deliverFinal`.
- Worker: `sales` in REAL_HANDLERS; DB-driven operator-action polls (approved emails -> send;
  dev.reply_requested / dev.booking_requested -> handlers) so the dashboard stays dependency-light.
- Dashboard: /outbox rebuilt into the approval queue (approve/reject wired, voice-lint inline, body
  preview) modeled on the 21st.dev "Email Client Card" pattern, + calls-due + replies + sent + a
  mock dev panel (simulate reply/booking). API: /api/outbox/{approve,reject}, /api/dev/simulate-*.

Acceptance (spec §13 Phase 5, mock — 12/12 pass): full sequence with approval; CAN-SPAM footer
(unsubscribe + physical address) present; approve -> sent -> contacted; **exactly one** .eml written
and a duplicate approve does NOT double-send (idempotency); interested reply -> replied + sequence
halted + operator notified; booking -> meeting_booked + meeting row; unsubscribe -> address+domain
suppressed; the gate then blocks any further send to that suppressed recipient. Ran on throwaway
.example test leads (no real prospect data touched), cleaned up after.

LIVE smoke test (send/reply/booking round-trip against a real inbox) + DNS startup checks remain,
gated on the operator's outreach domain + mailboxes (blockers below).

## Phase 6 work log + acceptance (2026-07-04)

Monitor agent (spec §6.10): hourly anomaly sweep (stuck leads with a 6h bar, 24h for
operator-gated statuses; error spike >5/h; cap exhaustion across Places/sends/Anthropic; worker
heartbeat missing) deduped on stable keys per 12h so a growing hour-counter never re-alerts; a
systemic stall groups into ONE anomaly (a 31-lead stall is one incident, not 31 notifications).
Daily digest at 09:00 IST into `daily_reports` (upsert on date): funnel, emails, calls due vs
logged, meetings, demos, spend, anomalies, in the §11 voice, always ending with the single
highest-value lead + the single top blocker. Numbers come from SQL only; Haiku phrases one
narrative line with a deterministic fallback. Digests render on /reports. Cal.com webhook endpoint
(`/api/webhooks/calcom`) verifies HMAC on the raw body, matches leads by attendee email, refuses
unsigned posts, notifies on unmatched bookings.

Acceptance (spec §13 Phase 6) 10/10: digest generates with real numbers; an artificially 8h-stuck
lead is detected and alerts (grouped, containing the lead id); re-running the hourly does not
duplicate alerts; digest upserts (never duplicates) per date; `costs->day_usd` reconciles exactly
with `sum(agent_events.cost_usd)` for the day. The first digest honestly flagged two REAL
anomalies: 31 leads stalled behind the spent Places cap and the worker being offline.

## Phase 7 work log + evidence (2026-07-04)

- **Single-worker advisory lock**: the worker takes `pg_try_advisory_lock('autopilot_worker')` at
  boot on a held client; a second worker exits with a clear message. Verified live (worker B
  refused while worker A ran).
- **Stale-claim recovery**: a worker killed mid-build used to leave its 'building' claim row
  forever, permanently wedging that lead. Claims older than 30 min are auto-failed on the next
  builder pass. (Found by reasoning through the chaos check, fixed before it ever bit.)
- **Mock-on-real-data guard**: MOCK_MODE=true now REFUSES to start against a database holding
  real-sourced leads (override: MOCK_ON_REAL_DB=allow). Verified live: refuses with 110 real leads.
- **RUNBOOK.md**: bring-up from scratch, VPS deploy shape, restart procedure, caps, outreach ops,
  key rotation (all chat-exposed keys must rotate), common failures table, data hygiene.
- **Secrets scan**: tracked files grep for all key patterns (sk-ant, AIza, re_, cal_live, vcp/vck,
  21st_sk): CLEAN.
- **Chaos evidence**: repeated real container restarts across the build resumed cleanly (documented
  per phase); duplicate-approve never double-sends (Phase 5 test); duplicate analyzer/solution/
  builder jobs no-op via idempotency guards + the atomic build claim.

## Demo batch limit (2026-07-11)

Operator control: "build the top N demos first." Sidebar Worker card gains a demo-limit input;
`settings.demo_batch = {size, started_at}` rides the existing two-way settings bridge (clearing
writes size 0, never a row delete — the bridge merge has no delete tombstone). The worker gates
admission at the **uiux trigger** (solution_ready): design_ready flows into the builder
automatically, so admission there IS committing to a demo. When a batch is active the pick becomes
score-desc (top leads first) with `limit = min(10, remaining)`; `used` = distinct leads with a
`design.ready` event after `started_at` (immutable accounting: QA re-entries and rebuilds never
double-count; a new batch restarts the count). Final builds (closed_won) are never batch-gated;
the builder's concurrent-build cap (2) is unchanged. Verified: 6/6 accounting tests
(`apps/worker/src/test-batch.ts`, ZZ rows, self-cleaning), API set/reject/clear exercised live,
UI screenshot reviewed. Worker restarted on the new code (boots paused). Hosted dashboard needs
one redeploy to SHOW the control (deploy not run this session: operator did not request it).

## Design uniqueness mandate (2026-07-11, operator directive)

Operator: every demo + final site must use ui-ux-pro-max + 21st, look premium, and never repeat a
template look. Encoded in CLAUDE.md §5d (uniqueness + premium mandate) and shipped concretely:
- Two NEW hero structures in the roofing template, sourced from 21st.dev patterns via the MCP
  (interactive session) and restyled through §5b-bis: **frame** (dark, copy over atmosphere, photo
  as a wide framed canvas) and **paper** (LIGHT editorial: ink on warm paper, brand rule, angled
  photo right; tone-aware TopBar/CTAs/StatsStrip). First light-opening look in the system.
- 8 new skill-grounded looks using them (roofing 14, plumbing 10, hvac 5, dental 5 = 34 total);
  all 8 WCAG-verified (CTA 4.9-8.4, body 16+); existing 26 looks untouched (assignments are
  locked per contract). Seeded to local DB, bridge syncs to hosted.
- QA: both variants rendered locally + screenshot-reviewed, desktop + mobile (conversion skeleton
  intact: tap-call top bar, location H1, dual CTAs, stats strip, sticky call bar).
- Honest mechanic documented: 21st MCP tools exist only in interactive sessions (headless worker
  cannot call MCP), so 21st feeds the registry/template variants at build time, per-lead runtime
  grounding stays with the local skill. Registry expansion comes BEFORE any look reuse.

## Full-page premium pass (2026-07-11, operator directive follow-up)

"Whole website looks premium, not only hero." Full-page render audit found the body reading
generated where the hero read designed. Fixed in the roofing template (§5b-bis applied below the
fold): services = bento with a full-width featured brand panel + hairline-accented cards (uniform
white-card grid was the exact slop pattern); process = brand-badge steps joined by a connecting
line on shingle-textured paper2; gallery preview tiles redesigned (alternating brand/ink tints,
dashed frames, a "send your job photos" CTA tile); quote anchor gains a brand glow + texture
(second dark differs from the first, per section rhythm); FAQ gets brand tick markers; contact
rebuilt as card + tap-call button + framed map; footer composed with logo mark + full NAP.
QA: full-page renders reviewed at 1280 and 390 in BOTH tones (cedar-paper light editorial,
granite-frame dark) — same bones, unmistakably different sites. All copy unchanged (fact-safe).

## Per-business copy personalization (2026-07-11, operator directive)

Operator: demos shipped identical template text (same four service blurbs, same subline, same FAQ)
— "we first need to see their current website and work they do." Shipped:
- `copy.ts` (agents): `generatePersonalizedCopy` — Sonnet writes hero subline, primary service,
  services w/ blurbs, and FAQ from EVIDENCE ONLY: their verbatim Google reviews, the analyzer's
  audit of their current site, the visible text of that site (fetched once, honest UA, §6 ethics),
  and the sales angle. Guards: §3 voiceLint on every string, invented-number check (any digit in
  copy must exist in evidence), zod schema, length caps. Any guard failure → trade defaults +
  `copy.fallback` event; builds never block on copy.
- Builder refreshes evidence first: legacy-imported leads had empty reviews/photos (import skipped
  them) — one Places Details call fills both and persists to the lead.
- Template: `heroSubline` flows from content.json into all five hero variants.
- Unknowns the model wanted to claim but couldn't verify land in `needs` as `[NEEDS: confirm]`.
- Guards hardened on live pilots: reasons on every rejection, em/en dashes sanitized not rejected,
  one guided retry, and a claim-word guard (free/warranty/licensed/certified/emergency need
  evidence — caught "Free-look inspections" invented on the pilot).
- FLEET REBUILT 2026-07-11: 13/13 demos personalized, 0 fallbacks, all QA-passed back to
  outreach_ready. Spot-checks confirm real grounding: Sercon's subline names Rene (their reviews),
  We Roof Dallas leads with insurance-claim help (their reviews), service lists differ per
  business (Sercon: patio covers + HOA help; We Roof Dallas: commercial + multifamily; White
  Rock: gutters). Same accountability trail: copy.generated/copy.fallback events per build.

## Premium visual layer (2026-07-12, operator directives from the Website Mastery blueprint)

Operator supplied a 27-page blueprint; audited against the pipeline (section framework, factory
model, skill+21st stack were already ours; SaaS aesthetics + invented pricing rejected per
contract). Shipped in passes, each render-QA'd both motion modes, fleets rebuilt (0 failures):
- Anchor nav in the hero top bar (content-aware links), testimonial hover lift, tile hovers.
- Motion kit (Motion.tsx): 3D pointer tilt + glare on hero photos, scroll parallax, drifting
  brand glows, count-up stats, word-by-word headline reveal, magnetic primary CTA, gallery image
  wipes. GPU transforms only — no WebGL (mobile 2.5s budget), no new deps.
  useReducedMotionSafe fixed a PRE-EXISTING hydration error for reduced-motion users.
- 21st.dev FAQ accordion (Interactive Accordion, contract-restyled to per-lead tokens).
- Color: uiux detects the business's OWN brand hue from their site screenshot (Sonnet vision) and
  prefers the nearest free look (<=60deg; uniqueness still outranks); design records
  brand_color_detected. Template: derived --brand-deep gradient CTAs; storm band dark now mixed
  per look from ink+brand (was one hardcoded warm black, clashing on cool looks).
- Sales rebuild guard: leads re-entering outreach_ready with an existing Touch-1 restore their
  stage silently (no duplicate drafts/notifications on rebuilds).

## Niche prop system (2026-07-12, operator directive: cula.tech floating-trucks analog)

Operator: "similar like the trucks... with hammers nails and plywoods and other roofing related
stuff for roofing niche and similar kind according to niche." Shipped:
- 24 hand-authored SVG line-art props (workflow-verified, all 24 visually reviewed on a grid):
  roofing (hammer, nail, shingle, plywood, gable, ladder), plumbing (wrench, pipe, droplet,
  valve, plunger, gauge), hvac (fan, thermostat, flame, snowflake, duct, filter), dental (tooth,
  toothbrush, mirror, shield, sparkle, floss). currentColor stroke so every look tints them free;
  zero image bytes, zero WebGL — mobile 2.5s budget untouched.
- `lib/props.ts` (server-safe: page.tsx imports it too) holds the sets + `propIdByIndex()` slot
  mapper so placements are niche-agnostic: slot 0 is hammer for roofing, wrench for plumbing.
- `components/Props.tsx` (client): `PropField` renders placements with scroll parallax by depth,
  slow 3D tumble (rotateX/Y + drift, 9-14s), blur on far props, opacity 0.06-0.14. aria-hidden,
  pointer-events-none, inert under reduced motion.
- Fields live in the hero backdrop (both dark and paper variants), storm band, pinned process,
  and quote band. Render-QA'd: props read as atmosphere behind content, never over it (§5c).
- Deploys to live demos with the unified fleet rebuild once the Vercel daily deploy limit resets.

## Design fix pass (2026-07-13, operator: "fix all" after the appeal audit)

Live-audit of Pioneer found the real gap: only the hero was designed; the middle of the page was
typeset text on beige under a photo grade so dark the real photos read as mud. Shipped:
- Photo grade lightened everywhere (.photo-grade: grayscale 0.22→0.08, brand wash 0.16→0.10,
  grounding gradient 0.28→0.18) and the photo-hero double scrim cut (90/80→55/35 vertical,
  80→75/30 horizontal). Their real photography now IS the design (§5b-bis), text still protected.
- Services rows carry real cached GBP photo thumbnails (structure adapted from 21st.dev "Blog 8"
  rows-with-image + "Team Showcase" grayscale-to-color hover, contract-restyled). Text-only rows
  remain the honest fallback below 3 photos.
- Pinned process: steps rest at 0.55 opacity (readable to fast scrollers and screenshots), pin cut
  260vh→220vh, each step gets its niche prop icon in brand (hammer/nail/shingle for roofing).
- Brand moments in light bands: ghost numerals brand-tinted, brand signature rule under every
  section title. Quote-band scrim lightened (0.92/0.55/0.25→0.88/0.45/0.18).
- Font retirement: Archivo retired as a roofing DISPLAY face (traced to the "looks basic" read).
  steel-modern → Barlow Condensed, ember-storm → Alfa Slab One (both registry + DB re-seeded,
  layout font registry extended). NEW assignments only: designs snapshot their look at assign
  time, so locked/sent demos render exactly as before.
- framer-motion v11 → motion v12 (motion/react imports, template package.json + lockfile; v12's
  framer-motion is now only motion's internal dep). Typecheck + render QA clean in both motion
  modes (reduced-motion verified, zero console errors).
- Render-QA'd on Pioneer's real data: hero photo fully readable, services alive with photos,
  process legible at rest. Ships to live demos with the queued unified fleet rebuild when the
  Vercel daily deploy limit resets.
- FLEET REBUILT 2026-07-13 (09:03–11:45 UTC): all 34 demo-bearing leads redeployed on the new
  stack — 34 deployed, 0 deferred, 0 failed, 34/34 QA green, 33/34 personalized copy (Swan
  Roofing fell back to trade defaults on an LLM JSON parse error; requeued for a copy retry).
  Vercel's limit is a ROLLING 24h window (not a daily reset): ran ~20 in the morning headroom,
  the watcher auto-queued the last 14 at 11:26 when yesterday's deploys aged out. Live-verified
  post-deploy: James Kate (branded-truck hero) and Pioneer (readable aerial photo). Worker had
  been paused (operator stop, 07-12 15:52); resumed 09:01 with the operator's fleet directive —
  bridge propagated the toggle to hosted over the Neon HTTPS driver (raw :5432 is blocked in
  this container per RUNBOOK §2b, so psql-to-Neon always times out; not an outage).

## INCIDENT 2026-07-10/11 (orphaned Outbox approvals) + structural fixes

Fallout from the 07-10 pause leak: the two prematurely-drafted Touch-1 emails (James Kate
Roofing, Imperial Roofing) were reverted LOCALLY, but the bridge had already up-synced them and
the up-sync has no delete tombstone — so they stayed visible in the hosted Outbox. The operator
approved both there on 07-10 ~18:20. The approvals could never execute: (1) no local email rows
(the decisions-pull no-ops), (2) worker paused, and (3) both leads have NO contact email, so the
gate would have refused anyway. After approval they also vanished from the Outbox page, which
only listed awaiting/sent. Repair + structural fixes (all shipped 07-11):
- rows restored in BOTH DBs as status='failed' with `email.gated` events + bell notifications
  stating the real reason (no contact email on file);
- sales agent now blocks drafting when the lead has no contact email (no more approve-into-a-dead-
  end), with blocked-notification dedupe per lead per 12h (cap_hit pattern);
- Outbox page grew "Approved, waiting to send" and "Blocked / rejected" sections with reasons —
  an email row can no longer silently disappear from the page;
- bridge decisions-pull surfaces orphaned approvals (hosted approval, no local row) as a warn
  event + notification once per idempotency_key;
- RUNBOOK: failure-table row for "approved but nothing sent" + data-hygiene rule: never delete a
  bridged row locally without deleting the hosted copy in the same session.

## INCIDENT 2026-07-04 (mock worker vs real data, round 2) + structural fix

While verifying the advisory lock I started a MOCK worker against the live database. The lock
worked; the stubs then fixture-advanced 108 real leads for ~3 minutes (fixture contact emails,
localhost builds, fake status transitions up to closed_won). My first kill did not land (signal
race) and the worker re-contaminated after the first repair; the second, verified kill + a
second event-log-driven repair restored all 108 leads to their pre-incident statuses (final
distribution byte-identical: 70/31/5/2/2/1) and purged every fixture artifact (remaining fixture
rows belong solely to the Phase-1 'Mock Roofing Co 4117' acceptance lead, where they are
legitimate). Lessons burned in as code, not promises: (1) the mock-on-real-data boot guard above
makes the whole incident class impossible; (2) verify a kill by checking the EVENT STREAM went
silent, not the process table (now in RUNBOOK).

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

## Resolved by operator (2026-07-11)

- Outreach mailbox = mann@tradecraftsites.com (main domain; operator explicitly chose it over a
  dedicated outreach domain). DNS verified: Resend auth passing, DMARC p=quarantine. Caps set to a
  warm-up ramp (10/day) to protect the domain's reputation; RUNBOOK §5 has the raise schedule.

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

## Worker deployed to Fly.io — production worker online (2026-07-19)

The always-on worker now runs on **Fly.io** (app `agency-autopilot-worker`, region `iad`, one
shared-cpu-1x / 1GB machine) against the **shared Supabase Postgres** — the same DB the dashboard
uses. Because `DATABASE_URL_NEON` is unset, the split-brain bridge (`apps/worker/src/bridge.ts`) is a
no-op: one database, one source of truth. This supersedes the local-worker + Neon-bridge setup that
the sandbox's TCP:5432 block forced during the build.

Deploy mechanics (the sandbox blocks flyctl's GitHub binary download and apt-over-proxy, so the
usual `fly deploy` path is unavailable): Docker image built locally from `Dockerfile.worker`
(full `node:22` base for CA certs, `tsx` runtime, `PUPPETEER_SKIP_DOWNLOAD=true`), pushed to
`registry.fly.io`, machine created via the Machines API; app secrets (`DATABASE_URL`,
`ANTHROPIC_API_KEY`, `GOOGLE_PLACES_API_KEY`) set via the Fly GraphQL API (never committed).

Verified live: `worker.started (mock=false)`, `worker.heartbeat` every 60s, zero error events,
no pooler connection-limit issues. Spend gate intact: `MOCK_MODE=false`, `BUILD_MODE=review`,
`OUTREACH_MODE=review`. Worker boots **paused** (`worker_enabled=false`); discovery runs only when
the operator enables it and targets a niche/metro.

Follow-ups: (1) add a Chromium layer to `Dockerfile.worker` before any build is approved (QA
screenshots need it; skipped for now). (2) Two stale `research.requested` events (mental health
clinics, Dallas, 2026-07-17) are parked; neutralize before enabling — healthcare is gated
(Amendment A: BAA + E&O). (3) Rotate all chat-exposed keys. (4) Brand rename pending (Maana -> TBD);
reconcile `agency-facts.yaml` once chosen.

---

### 2026-07-19 — First end-to-end autonomous demo build + deploy (Two Brothers Roofing)

The full pipeline ran unattended on the deployed Fly worker + Vercel, for a real operator-approved
lead, start to finish:

`qualified -> (operator approves at spend gate) -> analyzed -> solution_ready -> design_ready ->
demo_building -> BUILD + DEPLOY -> demo_qa (9 checks green) -> outreach_ready -> Touch-1 drafted ->
awaiting_approval`.

Deliverables: live demo at `https://two-brothers-roofing-demo-tradecraft.vercel.app` (HTTP 200,
0.59s load, mobile-first, sticky tap-to-call, real branded-truck photo, real 4.9★/190-review stats,
no SSO wall), plus a voice-clean Touch-1 email in the Outbox with the demo link + CAN-SPAM footer,
held for operator approval (review mode, nothing sent).

Fixes that unblocked it:
- **Chromium layer** added to `Dockerfile.worker` (apt sources switched HTTP->HTTPS so the
  CONNECT-only proxy tunnels apt; `docker build --network=host` so the build reaches the host proxy).
  Resolves the earlier follow-up (1); analyzer + QA screenshots now work.
- **Vercel CLI** added to the image (`npm install -g vercel@latest`). The builder's deploy adapter
  spawns `vercel`; without it every real deploy died `spawn vercel ENOENT` and leads stalled at
  demo_building. This was the v10->v11 change.
- Image v11 pushed to `registry.fly.io`; machine `7812454bd2d998` updated via the Machines API
  (env preserved: `BUILD_MODE=review`, `MOCK_MODE=false`, `DB_POOL_MAX=4`, `PGBOSS_MAX=3`).

Real marginal cost for this lead: **$0.32** of Anthropic spend across 12 Sonnet calls (inflated by
the ENOENT deploy retries re-running builder copy ~7x; a clean build is ~4 calls ≈ $0.15). The
`usd_per_lead: 6` cap in `caps.yaml` is the safety ceiling, ~20x the real cost. Places + PageSpeed +
Vercel free-tier are pennies/free on top.

Polish items (non-blocking, demo is a preview): (a) hero subline is a grammatical run-on
("...insurance 190 Google reviews and counting") — LLM copy variance, passed voice/schema guards;
(b) Touch-1 email says "190 five-star reviews" where the data is 190 reviews at 4.9★ — tighten to
"190 reviews at 4.9 stars" before send to stay literally exact (§0.1).

---

### 2026-07-25 — Dental niche opened (Boise), scored + capped to 30 on operator request

Operator asked for dental leads. Two blockers surfaced and were handled honestly:
- **Compliance gate.** The worker skipped all healthcare verticals (Amendment A). Un-gated *general
  dental for DISCOVERY only* (med spa / ortho / mental health / clinics stay gated); demos stay
  deferred until a PHI-free dental template exists, so no patient data is ever collected. Worker
  rebuilt v11->v12 and redeployed.
- **No dental template.** Only roofing is `live: true`. Dental discovery + qualification work; the
  demo build is the piece still pending a dental template. Operator chose "discover leads only".

Market-scout picked **Boise, ID** (Treasure Valley): 20/20 sampled practices independent (zero DSO
chains — the cleanest field of any metro tested), 100% with 40+ reviews (avg 508), Idaho a top-10
dentist-shortage state so practices are busier/better-funded, low agency competition. Fired
discovery for Boise + Meridian + Nampa.

Places returned ~85 for the target 60. Operator then capped it to **30 leads only**. Delivered
exactly **30 scored Boise dental** on the Shortlist (5 at score 100 incl. Ustick Dental — the
scout's flagged strongest lead; 25 at 75). Pre-existing San Antonio dental leads (a prior run, mostly
DSO chains) were filtered out of the batch.

New operator capability built for this (the console had no way to remove/trim leads): **POST
`/api/leads/disqualify`** with `action: disqualify | reactivate`. Disqualify sets `disqualified`
(guarded to pre-outreach states, a legal transition); reactivate re-enters a lead at `discovered` so
the worker re-qualifies it (not a jump onto the Shortlist unscored). Dashboard redeployed. All trim
ops went through this endpoint; the worker was paused during the trim to avoid a qualify race, then
resumed (verified healthy, Two Brothers untouched at awaiting_approval throughout).
