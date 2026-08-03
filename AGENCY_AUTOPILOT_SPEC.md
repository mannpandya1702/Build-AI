# AGENCY AUTOPILOT: Claude Code Build Spec

You are Claude Code. This document is the single source of truth for building **Agency Autopilot**: an autonomous multi-agent system that finds businesses with weak web presence, audits them, builds a demo website, runs cold outreach, books sales meetings, and delivers a final polished website after the client converts.

Read this entire document before writing any code. Build in the exact phase order in Section 13. Do not skip acceptance criteria. Do not relitigate the architecture decisions in Section 2.

**This spec extends an EXISTING repo: the Web Studio system.** Its root `CLAUDE.md` (Web Studio Operator: the Founder/Salesman/Developer contract) already defines the operator's voice, sales philosophy, demo quality bar, and non-negotiables. That contract stays in force. Precedence: `CLAUDE.md` governs behavior, voice, copy, and quality judgment; this spec governs architecture, data, and process. If they ever conflict on behavior, `CLAUDE.md` wins and you flag the conflict in `PROGRESS.md`.

The operator is Mann, working solo. Wherever this doc says "notify the operator," it means Mann via the dashboard notification system (and Telegram if configured).

---

## 1. Mission

One command starts lead discovery. From there the system autonomously: researches targets, filters and qualifies them, analyzes each business's web presence gaps, proposes a solution, designs and builds a 3-4 page demo website, QA-tests it, sends a personalized outreach email with the demo link and a booking link, handles follow-ups and replies, books meetings on the operator's calendar, and after a client converts, builds and QA-tests the final production site for delivery. The operator watches and controls everything from a realtime dashboard.

---

## 2. Architecture decisions (final, do not change)

1. **Agents are pipeline stages, not standalone processes.** Each "agent" is a TypeScript module with one job, consumed from a Postgres-backed job queue. One worker process runs them all.
2. **Demo before outreach, full build after close.** The expensive final build only happens for leads with status `closed_won`. Outreach carries a demo, not the finished product.
3. **ICP is configuration.** `config/icp.yaml` defines target geography, the active vertical, and the scoring rubric. Launch config: United States, ONE active vertical at a time per the contract's niche discipline (start: roofing), drawn from the contract's target list (roofers, HVAC, plumbers, electricians, med spas, dentists, chiropractors, landscapers, auto repair, law firms). Expansion is a config change plus a compliance check, never a code rewrite.
4. **Human-in-the-loop is a mode, not an argument.** `OUTREACH_MODE=review` (default): outreach emails queue for operator approval. `OUTREACH_MODE=auto`: sends within caps. Final-delivery emails are ALWAYS review-mode regardless of setting.
5. **Everything emits events.** Every agent writes structured rows to `agent_events`. The dashboard, the monitoring agent, and all notifications are consumers of this one stream. No silent work anywhere.
6. **All external I/O goes through adapters** (`/packages/adapters`) with typed interfaces and a mock implementation. `MOCK_MODE=true` runs the entire pipeline end-to-end with zero external calls and zero spend.
7. **This is an add-on, not a rewrite.** Restructure the existing Web Studio repo into the Section 3 layout in place. Delete nothing: migrate existing assets or archive them under `/legacy`. Existing demo sites become source material for the block library; any existing lead lists import into `leads` with `source = 'legacy'`.

---

## 3. Tech stack (pinned)

- **Monorepo:** pnpm + Turborepo
- **Dashboard:** Next.js 14 (App Router), Tailwind, shadcn/ui, Supabase Auth (single operator account)
- **Database:** Supabase Postgres. Migrations only via files in `/supabase/migrations`. Realtime channels for live dashboard updates.
- **Job queue:** pg-boss (Postgres-based, no Redis). Worker is a standalone Node/TS app deployable to a VPS.
- **LLM:** Anthropic API. Model map: Haiku for extraction/scoring/classification/digests, Sonnet for analysis, solution, design, code generation, and QA review.
- **Lead discovery:** Google Places API (New). No scraping of Google Maps HTML.
- **Site auditing:** PageSpeed Insights API (Lighthouse) + Playwright for screenshots and crawling public pages.
- **Demo/final site builds:** Static Next.js sites composed from an internal block library, deployed via Vercel API. Demos live at `{slug}.demo.{AGENCY_DOMAIN}`, noindexed, watermarked.
- **Email:** adapter interface with two backends. `resend` for transactional (booking confirmations, operator notifications, final delivery). `smtp` (Google Workspace mailboxes on a separate outreach domain) for cold outreach. Reply ingestion via Gmail API polling.
- **Booking:** Cal.com. One "15-min intro call" event type. Webhooks (`BOOKING_CREATED`, `BOOKING_CANCELLED`) drive meeting records and notifications.
- **Validation:** zod schemas for every agent input/output. **Tests:** vitest (unit), Playwright (dashboard e2e), full-pipeline integration test in mock mode.

### Repo layout

```
/apps/dashboard        Next.js operator UI
/apps/worker           pg-boss consumers (all agents)
/packages/core         types, zod schemas, state machine, event bus helpers
/packages/agents       one module per agent (research, scrape, qualify, analyzer,
                       solution, uiux, builder, qa, sales, monitor)
/packages/adapters     anthropic, places, pagespeed, playwright-crawl, vercel,
                       email (resend|smtp|mock), gmail-replies, calcom
/packages/blocks       website component library + industry presets
/config                icp.yaml, caps.yaml, email-templates/
/supabase/migrations
CLAUDE.md  PROGRESS.md  RUNBOOK.md
```

---

## 4. Non-negotiable rules (behavioral contract)

In Phase 0, MERGE these into the existing `CLAUDE.md` under a new `## System rules` section. Do not delete or weaken any existing operator rule; the contract's own non-negotiables (never fabricate, no spam behavior, CAN-SPAM, cold SMS off) sit above these.

1. **Never fabricate.** No invented lead data, contact info, metrics, testimonials, or claims about the operator's agency in any email or website copy. Unknown fields stay null. Website copy may only claim things listed in `config/agency-facts.yaml`. The contract's `[NEEDS: ...]` placeholder convention applies to internal docs and design specs only: a deployed demo must never show a placeholder. If a fact is unknown, the builder omits that section and logs the gap on the lead record.
2. **Email gate.** No email leaves the system unless ALL are true: recipient not in `suppression_list`, mode permits it, daily/mailbox caps not exceeded, unsubscribe link present, agency physical address in footer, subject line is truthful (CAN-SPAM).
3. **Unsubscribe is sacred.** Any unsubscribe request or reply classified `not_interested` adds the email AND domain to `suppression_list` immediately and halts the sequence.
4. **Idempotency everywhere.** Jobs are idempotent keyed on `(lead_id, step)`. Email sends carry a deterministic idempotency key; a retried job must never double-send.
5. **Caps are hard limits** (`config/caps.yaml`): per-mailbox daily send cap (default 25), total daily sends, Places API calls/day, concurrent demo builds (default 2), Anthropic spend per lead (default USD 3 demo phase) and per day. Hitting a cap pauses the queue for that resource and notifies the operator; it never silently drops work.
6. **Scraping ethics:** public pages only, no login walls, no CAPTCHA bypass, honest User-Agent, per-domain rate limit of 1 req/2s, obey robots.txt for crawling.
7. **Secrets** come from env only. Never committed, never logged, never echoed into `agent_events` payloads.
8. **Migrations** are files. Never mutate schema through the Supabase dashboard.
9. **If blocked,** write the question to the Blockers section of `PROGRESS.md` and continue with the next unblocked task. Do not stall the whole build on one question.
10. **Update `PROGRESS.md`** at the end of every work session and every phase. Keep `CLAUDE.md` current when conventions change.

---

## 5. Data model (Supabase)

Create these in Phase 0. All tables get `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at`.

- **leads**: company_name, slug, industry, city, region, country, website_url (nullable), google_place_id, gbp_url, review_count int, rating numeric, photos jsonb (storage paths of downloaded GBP photos), reviews jsonb (up to 5 real GBP reviews, verbatim), contact_name, contact_email, contact_phone, source, status (enum below), score int, score_breakdown jsonb, disqualify_reason
- **audits**: lead_id fk, lighthouse jsonb (perf/seo/a11y/best-practices scores), screenshots jsonb (storage paths per viewport), pages_crawled jsonb, findings jsonb (structured gap list), summary text
- **solutions**: lead_id fk, pitch_angle text, proposed_pages jsonb, features jsonb, differentiators jsonb, estimated_impact text, call_sheet_md text
- **designs**: lead_id fk, brand jsonb (palette, fonts, tone), sitemap jsonb, page_specs jsonb (per-page block sequence + copy), assets jsonb, look_id fk, look_locked bool default false
- **looks** (contract 5d "same bones, different skin"): preset text, name, palette jsonb, type_pairing jsonb, hero_variant text; assignment rules live in agent 6.7
- **builds**: lead_id fk, kind enum(demo, final), status enum(queued, building, deployed, failed), repo_path, vercel_deployment_id, deploy_url, iteration int
- **qa_reports**: build_id fk, passed bool, checks jsonb (links, console_errors, responsive, lighthouse), issues jsonb, iteration int
- **email_sequences**: lead_id fk, current_step int, next_send_at, state enum(active, paused, replied, completed, suppressed)
- **emails**: lead_id fk, sequence_id fk nullable, direction enum(outbound, inbound), kind enum(outreach, followup_1, followup_2, booking_confirm, delivery, operator_notice), subject, body_html, body_text, status enum(draft, awaiting_approval, approved, sent, bounced, failed), provider_message_id, idempotency_key unique, sent_at
- **replies** (inbound detail): email_id fk, classification enum(interested, question, not_interested, unsubscribe, auto_reply, other), classified_by, raw jsonb
- **meetings**: lead_id fk, cal_booking_uid, title, start_time, end_time, timezone, status enum(scheduled, cancelled, completed, no_show), attendee jsonb
- **agent_events** (append-only event bus): agent text, lead_id nullable fk, level enum(debug, info, warn, error), type text (e.g. `lead.qualified`, `build.deployed`, `email.sent`, `meeting.booked`), message text, payload jsonb, cost_usd numeric nullable
- **notifications**: type, title, body, lead_id nullable, read bool default false, channel_sent jsonb
- **suppression_list**: email nullable, domain nullable, reason, source
- **settings**: key unique, value jsonb (holds OUTREACH_MODE, caps overrides, ICP overrides so the dashboard can edit them)
- **daily_reports**: date, funnel jsonb, costs jsonb, anomalies jsonb, summary_md text

### Lead status enum (the state machine)

```
discovered → enriched → qualified | disqualified
qualified → analyzed → solution_ready → design_ready
design_ready → demo_building → demo_qa → outreach_ready
outreach_ready → awaiting_approval (review mode) → contacted
contacted → replied | meeting_booked | nurture
replied → negotiating | meeting_booked | nurture
negotiating → closed_won | closed_lost
meeting_booked → closed_won | closed_lost
closed_won → final_building → final_qa → delivery_approval → delivered
any state → suppressed (terminal)
```

This is a superset of the contract's stage list (`found | qualified | demo_built | contacted | replied | negotiating | closed_won | closed_lost | nurture`): `found` spans discovered/enriched, `demo_built` = outreach_ready, and `nurture` is a lead whose sequence exhausted without a reply (kept warm, never pestered).

Implement transitions as a single `advanceLead(leadId, event)` function in `/packages/core` with an explicit allowed-transition map. Illegal transitions throw and emit an `error` event. Every transition writes an `agent_events` row.

---

## 6. Agent specifications

Every agent: reads its input from the DB, validates with zod, does its job through adapters, writes its output to the DB, emits events, advances the lead state. Max 3 retries with exponential backoff, then status stays put and an `error` event + operator notification fires.

### 6.1 Research Agent
- **Trigger:** operator clicks "Discover leads" in dashboard (with count) or a daily cron.
- **Model/tools:** no LLM. Google Places adapter, queries generated from `icp.yaml` (industry keywords x cities).
- **Output:** `leads` rows with status `discovered`. Dedupe on google_place_id and normalized domain against existing leads and suppression_list.
- **Done when:** requested count discovered or Places cap hit.

### 6.2 Scrape/Enrichment Agent
- **Trigger:** lead enters `discovered`.
- **Tools:** Places Details (rating, review_count, up to 5 reviews verbatim, photo references), photo download into Supabase Storage, Playwright crawl adapter (homepage + contact/about pages, max 6 pages), Haiku for contact extraction from HTML text, MX-check for email validity.
- **Output:** gbp_url, review_count, rating, reviews (verbatim, never edited), photos stored, contact_name/email/phone filled where actually found (never guessed), website_url confirmed or null (no website is a strong signal, keep the lead), status `enriched`.
- **Rule:** a lead with no findable email and no contact form is `disqualified` with reason `no_contact_path`.

### 6.3 Qualifier Agent (filter)
- **Trigger:** `enriched`.
- **Scoring:** deterministic code, not LLM. Encode the contract's Section 4 rubric exactly into `icp.yaml`: 40+ Google reviews +30 (20+ = +15), rating 4.0+ +15, no website OR clearly outdated/broken/mobile-unfriendly site +25, target niche +15, real GBP photos available +10, phone number present +5. Haiku is used only for the "outdated/broken/mobile-unfriendly" judgment on the enrichment screenshot when a site exists.
- **Auto-disqualify (from the contract):** national chains and franchises, businesses already on a slick modern site, permanently closed, and any lead with no real photo or fact to personalize with.
- **Output:** score 0-100 + score_breakdown. `score >= icp.qualify_threshold` (**60**, the contract's bar) → `qualified`, else `disqualified` with reason.

### 6.4 Analyzer Agent
- **Trigger:** `qualified`.
- **Tools:** PageSpeed adapter, Playwright screenshots (mobile/tablet/desktop), Sonnet.
- **Output:** `audits` row. Findings is a structured list: `{category: performance|seo|design|content|trust|conversion, severity, evidence, why_it_costs_them}`. If the lead has no website, findings describe the cost of absence vs local competitors.
- **Rule:** every finding must cite evidence from the audit data (a score, a screenshot observation, a missing page). No generic filler findings.

### 6.5 Solution Maker Agent
- **Trigger:** `analyzed`.
- **Model:** Sonnet, input = audit findings + industry preset.
- **Output:** `solutions` row: pitch_angle (one sharp sentence tying the biggest gap to lost revenue), proposed_pages (3-4 pages, e.g. Home, Services, About/Trust, Contact+Booking), features, differentiators. Status `solution_ready`.

### 6.6 UI/UX Agent
- **Trigger:** `solution_ready`.
- **Model:** Sonnet, input = solution + any brand signals scraped from their existing presence (logo colors, name).
- **Output:** `designs` row: brand (palette, font pairing, tone of voice), sitemap, and per-page specs as an ordered sequence of blocks from `/packages/blocks` with final copy for each block. Copy must use only verified lead facts + `agency-facts.yaml`. Status `design_ready`.

### 6.7 Builder Agent (full stack)
- **Trigger:** `design_ready` (demo) or `closed_won` (final).
- **Tools:** block library + Sonnet for composition and any custom section, Vercel adapter.
- **Block library requirement (build this in Phase 4):** minimum 12 responsive Tailwind blocks (sticky tap-to-call header, hero x2, stats strip, services grid, niche-need band, process steps, before/after gallery, Google-reviews block that renders real curated 4+ star reviews verbatim, service-area map, FAQ, quote form 3-5 fields, footer) + presets built as verticals activate: roofing first, then plumbing, HVAC, dental, then the rest of the contract's niche list.
- **The authoritative build spec is `CLAUDE.md` Sections 5a through 5e**: the two jobs, the two personas, the conversion skeleton, the anti-slop design system (typography, color, glass, section rhythm), the whoa-layer rules, tech + delivery, and the QA/security pass. The block library and presets exist to implement that spec, never to replace it. The builder prompt embeds those sections directly.
- **Looks system (contract 5d):** each preset carries curated looks (palette + type pairing + hero layout variant) in the `looks` registry. A look is assigned per lead, stored on the design, never reused while free looks remain in the same niche + metro, and LOCKED the moment the demo is sent. No two prospects ever receive the same-looking demo.
- **Demo output:** static Next.js site, 3-4 pages, noindex meta, floating watermark bar "Demo preview built for {Company} by {Agency}", deployed to `{slug}.demo.{AGENCY_DOMAIN}` (or `{slug}-{studio}.vercel.app` until the custom domain exists). Status `demo_qa`.
- **Final output:** same pipeline, watermark removed, contact form wired to the client's email, analytics stub, deployed to a staging URL for delivery. Status `final_qa`.

### 6.8 QA Agent
- **Trigger:** `demo_qa` / `final_qa`.
- **Tools:** Playwright (crawl every internal link, capture console errors, screenshot 375/768/1440 widths per page), PageSpeed on the deployed URL, Sonnet vision review of screenshots (overflow, contrast, broken layout, lorem ipsum, placeholder images, fabricated claims).
- **Pass bar (the contract's Definition of Done, mechanized):** zero broken links, zero console errors, no placeholder content (grep for `[NEEDS:`, lorem ipsum, and stock-claim phrases), sticky tap-to-call present at 375px and dialing the lead's real GBP number, quote form validates and sanitizes input and submits correctly, no secrets in the client bundle (grep the build output), reviews shown are verbatim 4+ star GBP reviews only, mobile LCP < 2.5s, Lighthouse perf >= 85 and SEO >= 90 (demo) / perf >= 90 (final), `prefers-reduced-motion` respected, no visual defects flagged.
- **Loop:** failed report goes back to Builder with the issues list. Max 2 fix iterations, then notify operator with the report and hold.
- **On pass:** demo → `outreach_ready`; final → `delivery_approval` + operator notification.

### 6.9 Sales Agent (outreach, replies, booking, delivery)
- **Trigger:** `outreach_ready`, inbound replies, Cal.com webhooks, `delivery_approval` approval.
- **Model:** Sonnet for drafting, Haiku for reply classification.
- **Outreach email requirements (touch 1 = the demo drop, per the operator contract):** plain-text style, under 120 words, references ONE specific audit finding with its evidence, "so I built you a version: {demo link}" with an inline hero screenshot, Cal.com link, unsubscribe link, address footer. No hype words, no fake urgency, human tone. Subject under 6 words, honest and specific, e.g. `Built {FirstName}'s {trade} site (2 min look?)`.
- **Call sheet (calling beats email for local; the operator makes the calls):** for every `outreach_ready` lead, also generate `solutions.call_sheet_md`: a 30-second opener naming the one finding, the demo URL, two likely objections with responses, and the best call window in the lead's local timezone. Surfaced on the lead page with a "log call outcome" action.
- **TCPA guard, non-negotiable:** no AI voice calls (no VAPI on cold US numbers) and no cold SMS, regardless of how easy the wiring would be. AI voice is permitted only post-consent (e.g. booked-meeting reminders) and only if the operator explicitly enables it later.
- **Voice gate:** every human-facing draft is linted against `CLAUDE.md` Section 3 before it can be approved or sent: no em dashes, none of the banned phrases, no corporate words, ends with a question that moves toward live/paid. A failing draft regenerates; the lint result shows in the Outbox. Reply suggestions draw from the Section 7 objection playbook.
- **Sequence (the contract's Section 6 cadence, not a generic drip):** Touch 1 = the email demo drop. Touch 2 = the operator's phone call within 1 business day: the system creates a call task with the call sheet and reminds the operator (the phone is the primary close channel for local; email creates the clickable artifact and the paper trail). Touch 3 = one-line nudge email ~2 days after the call. One final nudge max, then the lead moves to `nurture`. Sequence halts instantly on reply, booking, bounce, or unsubscribe. The system never sends SMS; the contract permits SMS manually and only after a lead has replied or given a number.
- **Modes:** review mode → email saved `awaiting_approval`, operator approves/edits/rejects in dashboard Outbox. Auto mode → sends within caps. Every send randomizes minute-level timing inside the operator-set send window (default 9:00-16:00 recipient's local time, weekdays).
- **Replies:** Gmail adapter polls every 5 min, matches by thread/message id, classifies. `interested`/`question` → notify operator immediately + draft a suggested reply (never auto-sent). `not_interested`/`unsubscribe` → suppress + halt. Bounce → suppress email, mark lead.
- **Booking:** Cal.com `BOOKING_CREATED` webhook → `meetings` row, lead → `meeting_booked`, confirmation email, operator notification with lead one-pager link.
- **Delivery:** on operator approval, send delivery email with live final URL + handoff notes. Status `delivered`.

### 6.10 Monitoring Agent
- **Trigger:** hourly + daily cron (09:00 IST).
- **Hourly:** anomaly checks: lead stuck in any non-terminal status > 6h, error-event spike (>5/hour), cap exhaustion, worker heartbeat missing. Anomaly → notification.
- **Daily:** Haiku digest into `daily_reports`: funnel counts per status, emails sent/replied, calls due vs logged, meetings booked, demos shipped, spend (sum of cost_usd), anomalies. Written in the contract's Section 11 report voice (concise, technical, no fluff, no emojis) and always ending with the single highest-value lead right now and the single top blocker. Rendered in dashboard Reports + sent via email/Telegram.

---

## 7. Email deliverability (operator setup, system enforcement)

The system must assume and enforce this posture; the operator handles the purchases:
- Cold outreach NEVER sends from the main agency domain. Separate outreach domain(s) (e.g. `get{agency}.com`) with SPF, DKIM, DMARC configured; 2-3 Google Workspace mailboxes.
- New mailboxes warm for 2-3 weeks before the system uses them at full cap. `caps.yaml` supports a per-mailbox `warmup_until` date with a reduced cap ramp.
- Defaults: 25/day/mailbox hard cap, plain-text emails, no tracking pixels by default (deliverability > open-rate vanity), link domains match sending domain where possible.
- Startup check: worker verifies SPF/DKIM/DMARC DNS records for each configured mailbox domain and refuses to enter auto mode if they fail.

## 8. Dashboard spec (`/apps/dashboard`)

Supabase Auth, single operator. Realtime subscriptions on `agent_events` and `notifications`. Global: notification bell with unread count, toasts for high-priority events (reply received, meeting booked, QA failed twice, cap hit), global search over leads.

Pages:
1. **/pipeline**: kanban by lead status, card shows company, score, industry, city, days-in-stage; filters; click → lead detail.
2. **/leads/[id]**: the full story in tabs: Overview (contacts, score breakdown), Audit (findings, screenshots, Lighthouse), Solution, Design, Builds (demo + final links, QA reports), Emails (threaded, statuses), Meetings, Timeline (all agent_events for this lead). Actions: force-advance, disqualify, suppress, rebuild demo, regenerate email, log call outcome.
3. **/outbox**: approval queue (preview, edit, approve, reject, voice-lint status), scheduled sends, sent log, bounces. Inbox view of replies with classification and suggested responses. **Calls due today**: leads whose demo drop went out and whose Touch 2 call is pending, each showing the call sheet and a log-outcome action (outcome writes an `agent_events` row of type `call.logged`).
4. **/meetings**: upcoming list + calendar view, booking details, links to lead one-pager. Cancellations reflected via webhook.
5. **/builds**: gallery of demos and finals with live iframe previews, QA badges, deploy status.
6. **/activity**: live tail of agent_events, filterable by agent/level/lead.
7. **/reports**: daily digests, funnel conversion chart, cost per lead/demo/meeting, sends per mailbox.
8. **/settings**: OUTREACH_MODE toggle, caps editor, ICP editor (writes to settings/config), email template editor, suppression list manager, mailbox status (warmup, DNS checks), Cal.com and integration health.

## 9. Cost controls

- Model map is config, not code. Track every Anthropic call's cost into `agent_events.cost_usd`.
- Per-lead demo-phase budget (default USD 3) and daily global budget; exceeding pauses that lead/pipeline and notifies.
- Concurrent demo builds capped (default 2). Leads queue by score descending: best leads get demos first.

## 10. Environment variables

`ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, GOOGLE_PLACES_API_KEY, PAGESPEED_API_KEY, VERCEL_TOKEN, VERCEL_TEAM_ID, AGENCY_DOMAIN, DEMO_BASE_DOMAIN, RESEND_API_KEY, OUTREACH_MAILBOXES (json), GMAIL_OAUTH_* , CALCOM_API_KEY, CALCOM_WEBHOOK_SECRET, OUTREACH_MODE, MOCK_MODE, TELEGRAM_BOT_TOKEN (optional), TELEGRAM_CHAT_ID (optional)`

Ship `.env.example` with every key documented. Mock mode must run with only Supabase + a dummy key.

---

## 11. Mock mode (build this first, it is how everything gets tested)

`MOCK_MODE=true` swaps every adapter for a mock: fixture leads (12 across the 4 industries, varied quality), fake Places/PageSpeed responses, Playwright against locally served fixture sites, "deploys" to a local static server, emails written to `/tmp/outbox/*.eml` and shown in the dashboard as if sent, fake reply and booking injectors (dashboard dev panel buttons: "simulate reply: interested", "simulate booking"). The full state machine must be traversable start to finish in mock mode with zero external calls.

---

## 12. Testing requirements

- Unit (vitest): state machine transitions (legal + illegal), qualifier scoring, email gate logic, idempotency keys, cap enforcement.
- Integration: full pipeline in mock mode, one lead `discovered → delivered`, asserting every intermediate artifact exists.
- E2E (Playwright): dashboard critical paths: approve an email, view lead timeline, toggle outreach mode, receive a simulated booking notification.
- Chaos check (Phase 7): kill the worker mid-build and mid-send; on restart, no duplicate sends, no corrupted state.

---

## 13. Build phases with acceptance criteria

Work strictly in order. A phase is done only when every acceptance item passes. End each phase: update PROGRESS.md, commit, list any blockers.

**Phase 0: Foundation.** Restructure the existing Web Studio repo into the Section 3 layout (migrate or `/legacy`-archive every existing file, delete nothing), merge Section 4 into the existing CLAUDE.md as `## System rules`, Supabase migrations for the full Section 5 schema, pg-boss wiring, event bus helper, `advanceLead` state machine with tests, PROGRESS.md + `.env.example`.
✅ `pnpm dev` runs dashboard + worker; a seeded test event appears live on a bare /activity page; state machine tests green; original CLAUDE.md content intact with System rules appended; `git log` shows moves, not deletions.

**Phase 1: Pipeline skeleton in mock mode.** All 10 agent modules as stubs that read input, wait, write plausible fixture output, emit events, advance state. Kanban + lead detail timeline + notifications bell live.
✅ Clicking "Run mock lead" carries a lead `discovered → delivered` with every transition visible live on the kanban and timeline; illegal transition attempt logs an error event.

**Phase 2: Real discovery.** Research (Places), enrichment (crawl + extraction + MX check), qualifier (rubric scoring). Dedupe + suppression respected. ICP editable in settings.
✅ "Discover 50 leads" yields ≥ 30 enriched and scored real leads, zero duplicates, disqualifications carry reasons, Places cap enforcement demonstrated.

**Phase 3: Analysis + solution.** PageSpeed, screenshot crawl, analyzer findings, solution maker.
✅ A real qualified lead shows a full audit (scores, 3-viewport screenshots, evidence-backed findings) and a solution doc in lead detail; a no-website lead produces a coherent absence-based audit.

**Phase 4: Design, build, QA.** Block library (≥12 blocks, 4 presets), UI/UX agent, builder → Vercel demo deploy, QA agent with fix loop.
✅ One command takes a `solution_ready` lead to a live, watermarked, noindexed demo URL that passes the full QA bar; an intentionally broken build gets caught and fixed within 2 iterations.

**Phase 5: Outreach + booking.** Email adapters, gate + caps + suppression, sequence engine, Outbox approval UI, Gmail reply polling + classification, Cal.com webhooks, delivery flow, DNS startup checks.
✅ In mock: full sequence with approvals, simulated interested reply halts sequence and notifies, simulated booking creates meeting + notification. In live smoke test against an operator-owned inbox: send, reply, and booking all round-trip correctly. Duplicate-send test passes.

**Phase 6: Monitoring + reports.** Hourly anomaly checks, daily digest, /reports page with funnel + costs, Telegram channel if configured.
✅ Digest generates with real numbers; a lead artificially stuck 6h+ fires an alert; costs reconcile with agent_events sums.

**Phase 7: Hardening + docs.** Retry/backoff audit, idempotency audit, rate limiters, secrets scan, RUNBOOK.md (deploy worker to VPS, rotate mailboxes, recover from failures), chaos check.
✅ Chaos check passes; RUNBOOK lets the operator redeploy from scratch.

---

## 14. Ask the operator before the relevant phase (write into PROGRESS.md blockers, keep building elsewhere)

Before Phase 2: Google Places + PageSpeed API keys; confirm launch ICP cities.
Before Phase 4: Vercel token/team, `AGENCY_DOMAIN` and demo subdomain, agency name/logo/facts for `agency-facts.yaml`.
Before Phase 5: outreach domain + mailbox credentials and warmup dates, agency legal name + physical mailing address (CAN-SPAM footer), a US phone number (Google Voice/Twilio) for Touch 2 calls (the contract forbids calling from the +91), offer numbers (setup fee range + monthly retainer) for `config/agency-facts.yaml`, Cal.com API key + event type, Resend key, Telegram bot (optional).

## 15. Operating instructions for you, Claude Code

- Start now with Phase 0. Announce the plan for each phase before executing it, then execute without waiting unless a Section 14 blocker applies.
- Prefer boring, debuggable code over clever code. Small modules, typed boundaries, zod at every seam.
- When output quality depends on a prompt (analyzer, solution, uiux, sales), keep prompts in versioned files under `/packages/agents/*/prompts/` so the operator can tune them without touching code.
- Never mark a phase complete without running its acceptance criteria and pasting the evidence into PROGRESS.md.
