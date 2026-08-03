# AI Agency Master Spec

**Version 1.0 · 2026-07-17 · Owner: Mann Pandya · Status: Approved for execution**

**System:** Agency Autopilot → AI Agency platform. **Codebase:** pnpm + Turborepo monorepo, ~7.2k LOC TypeScript, branch `claude/read-pdf-89t95k`.

**Companion documents:** `CLAUDE.md` (operator behavioral contract), `IMPLEMENTATION_PLAN.md`, `AUDIT_AND_PRODUCTION_PLAN.md`, `AI_AGENCY_EVOLUTION_PLAN.md`, `BUILD_STATUS_REPORT.pdf`.

**Precedence:** `CLAUDE.md` governs behavior. This spec governs vision, business model, pricing, compliance, and architecture direction. `IMPLEMENTATION_PLAN.md` governs file-level tasks. On any conflict: stop and ask the operator. Do not resolve conflicts silently.

---

## 0. How Claude Code must use this document

- Read this entire document before writing code. It is the single source of truth for what the business is and why each system exists.
- Execute in phase order (Section 14). Never start a phase that spends real money without an explicit operator "GO" for that phase.
- Every feature is proven in MOCK_MODE first. No exceptions. The MOCK_ON_REAL_DB refusal stays in place permanently.
- Never weaken, bypass, or raise a cap in `config/caps.yaml` without operator approval in writing.
- Never fabricate a metric, testimonial, or claim in any client-facing artifact. The `[NEEDS:]` placeholder discipline and anti-fabrication lint apply to everything this system generates: demos, proposals, reports, emails, call scripts.
- Compliance rules in Section 10 are hard constraints. They are encoded as system behavior, not documentation. If a task conflicts with Section 10, the task is wrong.
- When a decision is ambiguous, prefer: revenue safety over speed, one good default over configurable options, boring proven tech over novel tech, and asking the operator over guessing.

---

## 1. Vision

One system that runs a profitable AI agency for US local service businesses with a single human operator. The machine finds businesses that are losing money to a bad web presence and missed calls, proves it to them with a working personalized demo, sells them a fix, deploys the fix, bills them monthly, and proves its own value with telemetry every month.

The agency sells four things, each deployable by the pipeline without human build labor:

1. **Websites**: fast static Next.js sites from the internal block library, deployed on Vercel.
2. **Chatbots**: an embeddable AI assistant trained on the client's business, capturing and booking leads 24/7.
3. **Voice agents**: AI phone assistants (inbound reception, speed-to-lead callback, confirmations, reactivation) on Vapi.
4. **Automations**: productized workflow packs (missed-call text-back, review requests, quote follow-up) on Trigger.dev.

The website is the wedge. The chatbot is the first retainer. The voice agent is the anchor retainer. The Growth System bundle is the destination product. Everything is one lead record moving through one state machine, with the operator approving every dollar of build spend.

**End state (12 months):** 40 to 50 active clients, $35k to $50k MRR, gross margin at or above 75%, churn under 3% monthly, operated by one person plus this system.

---

## 2. Operating principles (non-negotiable)

- **Operator controls spend.** Nothing expensive runs without passing the approval gate. `BUILD_MODE=review` is the permanent default. `auto` mode requires per-session operator opt-in.
- **No cold outbound AI voice calls. Ever.** Voice products are inbound or consent-based outbound only (Section 10). Prospecting happens over compliant email.
- **Honesty is the moat.** Every number shown to a client is tagged `measured | allocated | estimated` and only `measured` numbers appear in client-facing SLA and ROI reports.
- **Crash-tolerant by design.** Job scheduling stays a projection of status. Any process can die at any point and the system self-heals on the next scan.
- **Idempotent side effects.** Every external call (email send, Stripe charge, Vapi provision, Vercel deploy, SMS) carries an idempotency key and is safe to retry.
- **One database, one truth.** After Phase 2 there is exactly one Postgres (Supabase). No bridges, no mirrors.
- **Small blast radius.** Per-client data isolation, per-client spend tracking, per-mailbox send caps, per-day API caps. A failure or ban in one place must not take down the fleet.
- **Ship the smallest sellable version.** Three automation templates, not an automation builder. Four assistant templates, not a voice IDE.

---

## 3. Market, niche, and positioning

**Niche (first 6 months): US home services.** Roofing first (Myriad Roofing is the existing proof), then HVAC and plumbing. Rationale: average job values of $5k to $15k make one recovered missed call worth more than a year of our retainer; websites in the segment are demonstrably bad; decision maker is the owner; sales cycle is days, not quarters.

**Positioning statement:** "We build your website, then staff it. Every call answered, every web lead called back in under 60 seconds, every past customer reactivated. One system, one monthly bill, and a monthly report that proves it paid for itself."

**Why now (verified market data, sources in Appendix):**

- AI answered roughly 14% of inbound small-business calls in late 2025, up from about 2% a year earlier. Adoption is crossing the mainstream line and owners now know what an AI receptionist is.
- The median business takes about 42 hours to respond to an inbound lead, and only about 7% respond within five minutes. Responding within five minutes makes qualification roughly 21x more likely than at 30 minutes, and about 78% of customers buy from the first responder. Our speed-to-lead product attacks exactly this gap with a sub-60-second SLA.
- Done-for-you AI agencies charge $800 to $3,500 per month plus $2,000 to $25,000 setup. Small-local-business AI receptionist retainers cluster at $297 to $497 per month. Our pricing sits inside proven bands while our delivery cost is hours of compute.

**Competitive edge:** competitors sell one product with manual delivery. This system cross-sells four products off one lead, delivers in hours, proves SLAs from its own event stream, and enforces a 10-mile niche exclusivity that creates urgency and justifies premium pricing.

---

## 4. Offer ladder and pricing

All prices USD. Overage minutes billed monthly in arrears. A2P carrier fees passed through at cost.

| Product | Setup | Monthly | What the client gets |
|---|---|---|---|
| Website | $1,500 | $99 care plan | 5-10 page site, 48h delivery, hosting, edits, uptime monitoring, monthly report |
| Chatbot | $297 (waived with website) | $197 | Embedded AI assistant, lead capture, booking, KB refresh, transcripts |
| Voice: single assistant | $497 | $397 (500 min incl., $0.35/min over) | One assistant (usually Inbound Receptionist), number, KB, SLA report |
| Automation pack | $297 | $247 | Missed-call text-back + review requests + quote follow-up, A2P registration handled |
| AI Front Desk (bundle) | $997 | $797 | Voice (500 min) + chatbot + automation pack |
| Growth System (flagship) | $2,997 | $1,297 (1,000 min incl.) | All four assistants + chatbot + automations + 10-mile exclusivity + SLA guarantee |

**Contract terms (encode into generated agreements):**

- Client owns their site, content, data, and configurations. Agency owns the platform, templates, block library, and skills. License granted for the term. Never copy the ClinicPro IP clause that assigns platform IP to the client.
- Guarantees: 99.5% uptime and sub-60-second speed-to-lead response, backed by service credits, proven monthly from `agent_events` telemetry.
- Client-facing spend cap: monthly costs never exceed the agreed amount without written client approval (mirror of our internal caps).
- 10-mile, single-trade exclusivity for Growth System clients, enforced by the exclusivity registry.
- 60-day termination notice. Setup fees non-refundable after delivery; pro-rated refund if we fail integration after reasonable effort.
- Contracts are generated programmatically from templates with validated variables. A contract with a blank field or contradictory pricing must be impossible to generate.

**Pricing sanity vs market:** home-service agency websites run $800 to $3,000 with care plans at $50 to $500 per month; managed chatbot setups are valued at $3,000 to $15,000; local AI receptionists retail $297 to $497 per month; done-for-you systems run $800 to $3,500 per month plus large setup fees. Every price above sits inside these observed bands. Sources in Appendix.

---

## 5. Unit economics and financial model

**Estimated COGS per client per month (tag: estimated until measured):**

| Product | COGS drivers | Est. COGS | Gross margin |
|---|---|---|---|
| Website care | Vercel, monitoring, LLM for edits | ~$10 | ~90% |
| Chatbot | Haiku tokens (cached), embeddings, hosting | ~$15 | ~92% |
| Voice 500 min | Vapi all-in $0.10-0.20/min realistic, number rental | ~$80 | ~80% |
| Automation pack | Trigger.dev, Twilio segments + A2P fees | ~$25 | ~90% |
| AI Front Desk | Sum of above minus overlap | ~$130 | ~84% |
| Growth System | 1,000 min + all lines + support time allocation | ~$300 | ~77% |

Voice margin math assumes Vapi all-in lands in the observed $0.10 to $0.30 per minute band; design targets $0.10 to $0.15 through Haiku on the live path and efficient STT/TTS choices. If measured COGS exceeds $0.20/min sustained, evaluate Retell as fallback (roughly $0.07/min base, ~620ms latency, no platform fee) before touching prices.

**Customer acquisition cost budget:** discovery + audit + scoring ≤ $2 per qualified lead; approved demo build ≤ $6 (LLM + deploy); target measured CAC ≤ $150 per closed client including email infrastructure amortization.

**Revenue milestones:**

| Milestone | Timeline | Target |
|---|---|---|
| M1 | 30 days | Security + spend gate live. 3 website closes (~$4.5k cash, $297 MRR) |
| M2 | 90 days | 12 active clients, $5k MRR, first 2 Growth Systems |
| M3 | 180 days | 25 clients, $15k MRR, churn < 4%/mo, referral program live |
| M4 | 365 days | 40-50 clients, $35-50k MRR, gross margin ≥ 75%, churn < 3%/mo |

**Per-client P&L is a first-class feature.** The finance module already tags `measured|allocated|estimated`. Extend it to a per-client view: retainer in, measured COGS out (Vapi minutes, LLM tokens, Twilio, Vercel), margin percent, trend. Operator uses it monthly to reprice or fire unprofitable clients.

---

## 6. Go-to-market engine

### 6.1 Funnel

```
discover (Places) → scrape → qualify/score → [OPERATOR APPROVAL GATE]
→ build Demo Hub (site + chatbot + voice demo) → email sequence (3 touches)
→ reply classify → booking (Cal.com) → sales call (human) → proposal + checkout
→ onboarding → live → monthly value report → cross-sell
```

Funnel targets (measured, reviewed monthly): 400+ prospects contacted/mo per sending cluster; reply rate ≥ 6%; positive-reply-to-booked ≥ 35%; call-to-close ≥ 40%; ≥ 4 new clients/mo by M2.

### 6.2 Outreach deliverability spec (2026 rules, mandatory)

Mailbox providers now hard-reject non-compliant bulk mail rather than spam-foldering it. Compliance is enforced in code, not in a runbook.

| Requirement | Threshold | System enforcement |
|---|---|---|
| SPF + DKIM + DMARC aligned | Every sending domain | Setup runbook + automated DNS check in CI; sends blocked if check fails |
| One-click unsubscribe (RFC 8058) | Every outreach email | Already in email gate; header presence asserted in tests |
| Spam complaint rate | Warn 0.05%, auto-pause 0.08%, hard limit 0.10% | Postmaster Tools polling job + auto-pause cap per domain |
| Bounce rate | < 2% | Pre-send verification (syntax, MX), auto-suppression on bounce |
| Bulk-sender line | 5,000/day/domain triggers strictest rules | Stay far below: ≤ 30/day/mailbox, 2 mailboxes/domain, 3-5 domains |
| New domain warm-up | 5-10/day, ramp over 4-6 weeks | Warm-up schedule encoded in caps.yaml per mailbox |
| Microsoft-specific | New domains ≥ 14 days old, ramp ≤ 200/day, strictest filtering | Separate treatment for MS-destined segments; monitor engagement |

Copy rules: plain-text-leaning, one link only (the Demo Hub URL), no open trackers on cold sends, truthful subject lines (already in CAN-SPAM gate), physical address and unsubscribe in footer, suppression list global and permanent.

### 6.3 Demo Hub (the conversion weapon)

One URL per lead: `demo.<agencydomain>/<lead-slug>`. Contains: audit summary with before/after screenshots, the rebuilt demo site with the chatbot already embedded and trained on the prospect's scraped content, a "talk to your AI receptionist" web-call button (Vapi web SDK, no phone number needed), a sample missed-call text-back exchange, and a Cal.com booking embed. Every outreach email points at this single link. The demo site the pipeline already builds is the carrier: chatbot and voice demos ride on it at near-zero marginal cost because the RAG corpus is the scrape output already collected.

### 6.4 Sales ammunition (verified, citable to clients)

- Contacting a lead within 5 minutes makes qualification ~21x more likely than at 30 minutes (MIT/InsideSales Lead Response Management study; replicated in 2026 benchmarks).
- ~78% of customers buy from the first business that responds.
- Median business response time is ~42 hours; only ~7% respond within 5 minutes. Contact within 60 seconds is associated with conversion lifts up to ~391% (Velocify).
- Our system's pitch line: "Your competitors answer in two days. Your AI answers in one ring."

### 6.5 Cross-sell ladder

Website close → 30-day value report shows traffic and form fills → chatbot offer ("your site now answers questions") → voice offer with measured missed-call count from the automation pack's call tracking → Growth System upgrade with exclusivity urgency. Each step is a generated, personalized artifact from Part G machinery, never a generic upsell email.

---

## 7. Service line specifications

### 7.1 Websites (exists; extend)

Keep: block library (~14 blocks, 4 presets, looks system), Vercel deploy, QA gates. Add: consent-compliant lead forms as a standard block (TCPA consent language + timestamp/IP capture wired to `consent_records`), per-site analytics beacon feeding value reports, care-plan edit queue (client emails an edit request; classifier routes; small edits auto-applied behind operator toggle).

### 7.2 Chatbots (new: `packages/chat`)

- RAG over the client's `kb_documents` (seeded from the existing scrape output; refreshed monthly).
- Live path: Claude Haiku with prompt caching; escalation summary path: Sonnet.
- Widget: one `<script>` embed, brandable, mobile-first, no layout shift, loads deferred.
- Behaviors: answer business questions, capture name/phone/email with consent language, book via Cal.com, hand off to SMS follow-up, log transcript.
- Guardrails: refuses off-topic and medical/legal advice, never invents prices or availability (anti-fabrication lint applies to KB answers), configurable blocked-topics list.
- QA: golden question set per client generated at onboarding; regression-run on every KB refresh.
- Demo mode: same widget, `demo=true`, rate-limited, watermarked, embedded in every demo site automatically.

### 7.3 Voice agents (new: `packages/voice`, Vapi)

Four assistant templates, stamped out per client from config plus the client KB:

1. **Inbound Receptionist:** answers, discloses AI, qualifies, books, takes messages, transfers on request. 24/7.
2. **Speed-to-Lead Responder:** fires on form-submission webhook from client's site (ours or external). Calls the lead back in under 60 seconds, SMS fallback if no answer. Outbound but consent-based: only numbers with a stored consent record from the form that includes call-consent language. This is the flagship differentiator: we build the site, so every form feeds this assistant natively.
3. **Appointment Confirmation:** confirms and reminds via SMS-first with voice fallback, reschedules, feeds no-show recovery.
4. **Reactivation Assistant:** re-engages the client's own past customers (established business relationship + stored opt-in only). SMS-first campaigns, voice for responders. Never runs on purchased or scraped lists.

Platform: Vapi (operator's deep production expertise is the moat; strongest custom multi-agent control). Per-assistant config: voice, persona from `agency-brand-voice` + `voice-agent-playbook` skills, tool set (booking, KB lookup, transfer, SMS send), hard disclosure line at call start, opt-out honored instantly and written to suppression.

QA before go-live: scripted test call per assistant (existing pattern), assertion on transcript (disclosure present, booking created, no fabricated claims), latency budget check. Telemetry: every call event lands in `agent_events` with minutes and cost; `sla_metrics` materializes uptime and speed-to-lead percentiles for the monthly client report.

### 7.4 Automation packs (new: `packages/automation`, Trigger.dev)

Exactly three templates, versioned TypeScript in the monorepo, tested in CI. No general builder.

1. **Missed-call text-back:** missed call on tracked number → instant SMS with booking link → conversation handled by chatbot brain over SMS.
2. **Review requests:** job-complete trigger (manual mark or calendar event) → delayed SMS/email review ask with direct Google review link → negative-sentiment intercept routes to owner instead of public review.
3. **Quote follow-up:** quote-sent trigger → day 2/5/10 follow-up sequence → stop on reply or booking.

A2P 10DLC onboarding is part of client onboarding, not an afterthought: brand registration (~$4 sole prop, ~$48 standard with vetting), campaign registration (~$15-17 one-time plus ~$1.50-10/month), carrier surcharges ~$0.003-0.005 per message passed through. Timeline: brand 1-3 business days; campaign review running ~10-15 business days in mid-2026, so registration starts on day one of onboarding. Twilio requires live privacy-policy and terms URLs on new campaign submissions (effective 2026-06-30): our website product ships both pages by default, which is itself a selling point. Opt-in proof stored in `consent_records`. STOP/HELP handled globally. Quiet hours enforced.

### 7.5 Delivery ops and retention (Part G, extended)

- Post-close health checks: uptime, form deliverability, number health, KB freshness.
- Monthly value report per client, auto-generated, `measured`-only numbers: calls answered, minutes, leads captured, bookings, response-time percentiles, SLA attainment, review count delta. Delivered as a branded PDF plus portal page.
- SLA credits computed automatically when thresholds are missed. Trust compounds; churn drops.
- Case-study engine: at day 30 and day 90, if metrics clear a bar, auto-draft a testimonial request and a case-study page; operator approves before anything publishes.
- Cross-sell prompts generated from measured gaps (e.g., missed-call count high and no voice product → voice offer artifact).

---

## 8. System architecture

### 8.1 Principles

Single Postgres as source of truth. Statuses drive everything; jobs are projections. Event bus (`agent_events`) is append-only and feeds dashboard, monitor, finance, SLA, and notifications. Every worker action idempotent. Every external fetch SSRF-guarded. Every LLM call cost-tracked.

### 8.2 Monorepo layout (target)

```
apps/
  dashboard/        Next.js 14 operator app
  demo-hub/         Public demo pages per lead
  portal/           Client portal (reports, invoices) [Phase 8]
packages/
  core/             statuses, transitions, advanceLead/advanceOpportunity
  agents/           research, scrape, qualify, analyzer, solution,
                    uiux, builder, qa, sales, monitor
  blocks/           website block library
  chat/             chatbot runtime + widget + KB tooling      [new]
  voice/            Vapi assistant templates + provisioning     [new]
  automation/       Trigger.dev templates                       [new]
  billing/          Stripe products, checkout, invoices, dunning [new]
  compliance/       consent records, suppression, A2P state,
                    calling-window + disclosure enforcement      [new]
  evals/            golden sets + eval runners                   [new]
  integrations/     places, psi, vercel, resend, smtp, gmail,
                    calcom, vapi, twilio, stripe (safeFetch everywhere)
config/
  caps.yaml         all spend/volume caps incl. warm-up schedules
skills/             installed + custom agency skills
```

### 8.3 Data model (tables; RLS on all)

`leads`, `opportunities` (one lead → many, keyed by `service_type`), `clients`, `contracts`, `subscriptions`, `invoices`, `service_instances` (a deployed asset: site, bot, assistant, automation; with config, version, health), `kb_documents` (per-client RAG corpus, embedded), `consent_records` (number/email, basis: form|EBR|written, snapshot, timestamp, IP, retention 5y), `suppression_list` (global, permanent, channel-scoped), `exclusivity_claims` (trade + geo point + radius; unique constraint checked against Places lat/lng at approval time), `agent_events` (append-only, partitioned monthly), `costs` (per-call/per-token, joins to client), `sla_metrics` (materialized views), `jobs` (Graphile Worker schema).

Enums: `service_type = website | chatbot | voice_agent | ai_automation` (extensible). `opportunity_status = identified → proposed → awaiting_build_approval → building → demo_ready → in_outreach → negotiating → closed_won → onboarding → live → paused → churned | closed_lost`.

### 8.4 State machines

Keep `advanceLead` exactly as designed (transactional, total transition map, illegal transitions rejected). Add `advanceOpportunity` with the same guarantees. Scheduler dispatches on `(status, service_type)`. The approval gate is a status (`awaiting_build_approval`), not a flag, so it inherits crash-tolerance for free.

### 8.5 Worker and jobs

Fly.io (or Railway) always-on machine. Graphile Worker on the same Supabase Postgres executes jobs (retries, exponential backoff, priorities, concurrency limits) while status remains the source of truth: the scan reconciles status → desired jobs, Graphile executes them. Single-worker advisory lock retired in favor of Graphile's job locking; the demo-batch limit and all caps remain. External dead-man's switch: worker heartbeats to healthchecks.io; missed heartbeat pages Telegram. Backups: Supabase PITR plus nightly `pg_dump` to object storage.

### 8.6 Realtime

Supabase Realtime on `leads`, `opportunities`, `agent_events` (filtered channels) → TanStack Query cache invalidation in the dashboard. Delete all 9 pollers. Optimistic updates on approvals.

### 8.7 LLM layer

- Routing: Haiku for extract/score/classify/chat-live; Sonnet for analyze/design/QA/post-call. Model versions pinned in one config file.
- Anthropic prompt caching on every large static agent prompt (analyzer, uiux, qa, chat system prompts). Batch API for non-latency-sensitive backlogs (qualify/score reruns) at half price.
- Structured outputs via tool-use schemas everywhere an agent returns data. Retry with backoff on 429/5xx; circuit-break per provider; degrade to queue, never to silent failure.
- Per-call cost written to `costs` with client attribution. This feeds the per-client P&L.

### 8.8 Integrations map

Places (discovery), PageSpeed Insights + Playwright (audit), Vercel (deploy), Resend + SMTP cluster (email), Gmail API (replies), Cal.com (booking, HMAC verified), Vapi (voice), Twilio (numbers, SMS, A2P), Stripe (billing), Telegram (ops + inline approvals), Sentry (errors), healthchecks.io (dead-man). All prospect-controlled URL fetches go through `safeFetch` (private/metadata IP blocklist, redirect re-check) including Playwright request interception.

---

## 9. Security

- **Auth:** Supabase Auth (email OTP for the operator), `middleware.ts` gating every dashboard and API route, RLS enabled on every table, service-role key server-side only, settings-key allowlist, dev tools fail closed.
- **Public surfaces** (demo hub, chat widget API, webhooks): rate-limited (per-IP and per-lead), input-validated, no PII echoed, webhook signatures verified (Cal.com HMAC pattern extended to Stripe and Twilio).
- **Secrets:** rotate all previously exposed keys first, then purge repo history (`git-filter-repo`), then verify rotation. Purging without rotation is theater. Secrets live in Fly/Vercel secret stores; `.env` files gitignored and linted against.
- **PII:** real lead and client PII never committed; fixtures are synthetic; logs scrub emails/phones; retention policy on transcripts (configurable per client contract).
- **Supply chain:** lockfile-only installs in CI, `pnpm audit` gate, Dependabot.
- **OWASP mapping** from the audit plan remains the checklist for Phase 1 sign-off.

---

## 10. Compliance rules of engagement (encoded as system behavior)

**Voice (TCPA).** The FCC's February 2024 ruling classifies AI-generated voices as "artificial or prerecorded voice" under the TCPA; violations run $500 to $1,500 per call with no aggregate cap, enforced heavily through class actions. Therefore, enforced in code:

- Outbound AI calls only to numbers with a matching `consent_records` row (form consent with call language, written agreement, or documented established-business-relationship for the client's own customers). No record, no call: the dialer refuses.
- Design to the strictest standard (prior express written consent for anything marketing-adjacent) even where circuit splits are looser.
- DNC: suppression checked before every outbound; client attests list provenance at onboarding; purchased/scraped lists are rejected by policy and by the importer.
- Calling window 8:00 to 21:00 recipient local time, enforced by scheduler.
- AI disclosure in the first utterance of every call. Opt-out honored instantly, written to global suppression across all channels (aligning early with the FCC's cross-channel revocation rule taking effect January 2027).
- Consent records retained 5 years with snapshot of the form as seen.

**Email (CAN-SPAM + provider rules).** Existing gate stays; Section 6.2 thresholds are enforced by caps and auto-pause, not by vigilance.

**SMS (A2P 10DLC).** No SMS sends for a client until their brand and campaign are approved; registration is an onboarding task with status tracked in `compliance`. Opt-in proof stored; STOP/HELP global; quiet hours enforced; carrier fees passed through itemized.

**Exclusivity.** Growth System approval checks `exclusivity_claims` (same trade within 10 miles → hard block with operator override logged).

**Our own agency stays out of healthcare.** No PHI, no BAA surface, no HIPAA scope. The operator's day-job domain knowledge informs the playbook; the assets and vertical do not transfer.

---

## 11. Quality: CI, tests, evals

- **CI (GitHub Actions):** Biome lint + format, typecheck, Vitest unit suites, Playwright e2e on dashboard critical paths, DNS/deliverability check script, `pnpm audit`. PRs blocked on red. Replace all `echo` test stubs.
- **Priority test targets** (incident-prone modules first): email gate (suppression, unsubscribe header, idempotency), approval gate (no build job exists without an approval event), state machines (illegal-transition fuzzing), safeFetch (SSRF corpus), billing webhooks (replay + signature), each service builder (MOCK_MODE end-to-end), consent enforcement (dialer refuses without record).
- **Eval harness (`packages/evals`):** golden sets frozen from the ~108 processed leads: `qualify_v1` (scores), `qa_verdicts_v1` (pass/fail demos), `reply_classifier_v1` (labeled replies), plus `chat_answers_v1` per client at onboarding. Evals run in CI against recorded fixtures; a PR that drops any metric more than 2 points fails. Prompt changes are treated like schema migrations: versioned, evaluated, reversible.
- **MOCK_MODE:** every new package ships with full mock coverage before any live credential exists in its environment.

---

## 12. Operator dashboard spec

Stack: shadcn/ui on existing tokens, TanStack Query + Supabase Realtime (pollers deleted), TanStack Table with virtualization for pipeline views, sonner toasts, proper error/not-found boundaries, a11y completed (dialogs, focus traps, keyboard nav).

Surfaces:

- **Shortlist (the daily driver):** approval queue with score, detected gaps by service line, projected build cost, contact, exclusivity check result. Keyboard-first: j/k navigate, a approve, x reject, shift+a approve top-N within budget. Budget remaining visible at all times.
- **Telegram inline approvals:** the existing alert bot gains Approve/Deny buttons emitting the same `lead.build_approved` event. Operator can run the agency from a phone.
- **Command palette (cmdk):** jump to lead/client, trigger safe actions, search events.
- **Client P&L:** per-client margin table with trend sparklines, sortable by margin; red flags for negative-margin clients.
- **SLA board:** per-client uptime and speed-to-lead percentiles from `sla_metrics`, with the same numbers the client sees.
- **Spend gauges:** live caps consumption (Anthropic, Places, minutes, sends) in the header.

---

## 13. Skills layer

Per-agent installs (safety-reviewed, pinned versions): Firecrawl → scrape; SEO/Local-SEO → analyzer; Frontend Design + Vercel Web Design Guidelines → website builder; Webapp Testing + Trail-of-Bits review → QA.

Custom agency skills (the moat, in priority order):

1. `niche-playbook-roofing` (deep: trade language, seasonality, objections, demo angles; do this one excellently before any other trade)
2. `agency-brand-voice` (all copy everywhere)
3. `demo-quality-bar` (what a shippable demo looks like; QA consumes it)
4. `voice-agent-playbook` (persona, disclosure, escalation, booking scripts)
5. `automation-blueprint` (the three templates' logic and edge cases)
6. `proposal-and-pricing` (assembles offers from measured gaps; never invents numbers)
7. `objection-handling` (sales agent + operator crib sheet)
8. `client-onboarding` (checklist incl. A2P registration, consent basis, exclusivity claim)
9. `compliance-checklist` (CAN-SPAM, TCPA, A2P; consumed by QA on every outbound artifact)
10. `case-study-writer` (feeds off value reports; measured numbers only)

---

## 14. Build phases and acceptance criteria

Execute in order. Each phase ends with a demo to the operator in MOCK_MODE plus the listed criteria green. Operator says GO before the next phase. Phases F (frontend) and S (skills) run in parallel from Phase 4 onward.

**Phase 0: Quality rails (week 1).** GitHub Actions CI, Biome, Vitest scaffold, Playwright smoke, eval harness skeleton with `qualify_v1` frozen. AC: red PR cannot merge; evals run on PR; all echo stubs gone.

**Phase 1: Security (week 1-2).** Supabase Auth + middleware + RLS on all tables; safeFetch on all 4 adapters + Playwright interception; keys rotated then history purged then verified; rate limits on public routes. AC: unauthenticated request to any route returns 401; SSRF corpus tests pass; no secret matches in repo history scan; OWASP checklist signed off.

**Phase 2: One database + spend gate (week 2-3, same sprint).** Migrate to single Supabase Postgres; worker on Fly.io with Graphile Worker; bridge deleted; dead-man's switch live; `awaiting_build_approval` status + Shortlist + Telegram inline approvals; `BUILD_MODE=review` default; build budget in caps.yaml. AC: kill -9 the worker mid-build and the system self-heals with no duplicate side effects; zero expensive jobs run without an approval event; bridge code deleted, not disabled.

**Phase 3: Revenue rails (week 3-4).** `packages/billing`: Stripe products/prices matching Section 4, proposal page generator (scope + guarantees + checkout link), contract generation from validated templates, invoices, dunning with service auto-pause, payment webhooks verified. AC: MOCK checkout → subscription → invoice → simulated dunning → auto-pause, end to end; generated contract passes a validation suite (no blanks, no contradictory pricing, IP clause correct).

**Phase 4: Opportunities spine (week 4-5).** `service_type` enum with `chatbot` included; `opportunities` table; `advanceOpportunity`; scheduler dispatch on (status, service_type); multi-gap analyzer creating opportunities per lead; exclusivity registry + check. AC: one mock lead yields website + chatbot + voice opportunities, each independently advanceable; exclusivity conflict blocks approval with logged override path.

**Phase 5: Chatbot + Demo Hub (week 5-7).** `packages/chat` per Section 7.2; `apps/demo-hub` per Section 6.3; chatbot auto-embedded in every demo site; `chat_answers_v1` eval per onboarded client. AC: demo hub renders for a mock lead with working chatbot grounded only in scraped KB (fabrication lint green); widget passes CLS/latency budget; rate limiting proven.

**Phase 6: Voice line (week 7-9).** `packages/voice`: four templates, provisioning, web-call demo on the hub, consent-gated speed-to-lead webhook path, QA scripted calls, SLA telemetry to `sla_metrics`. AC: dialer provably refuses a number without a consent record (test); disclosure asserted in every QA transcript; mock speed-to-lead fires < 60s from webhook; per-call cost lands in `costs` with client attribution.

**Phase 7: Automation line (week 9-10).** Three Trigger.dev templates; A2P onboarding state machine in `compliance`; quiet hours + STOP/HELP global. AC: each template has a side-effect assertion test; SMS send hard-blocked until campaign status = approved; STOP writes to global suppression across channels.

**Phase 8: Delivery ops + portal (week 10-12).** Health checks, monthly value report generator (measured-only), SLA credits, case-study engine, client portal (reports + invoices), cross-sell artifact generation. AC: value report for a mock client contains zero `estimated` numbers; SLA credit computed correctly from seeded telemetry.

**Phase 9: Scale + observability (ongoing).** Sentry, `agent_events` partitioning + retention, prompt caching + Batch API enabled and measured, pinned models, spend/queue gauges, per-client P&L dashboard. AC: cache hit rate and batch savings visible in finance; P&L view matches `costs` sums to the cent.

**Parallel F: Frontend overhaul** per Section 12 (start Phase 4). **Parallel S: Skills** per Section 13 (start Phase 4; `niche-playbook-roofing` first).

---

## 15. KPIs (reviewed weekly by operator)

| KPI | Target | Source |
|---|---|---|
| Qualified leads/week | ≥ 75 | pipeline |
| Approved demos/week | operator's call, budget-capped | Shortlist |
| Reply rate | ≥ 6% | outreach events |
| Booked calls/mo | ≥ 8 by M2 | Cal.com |
| Close rate on calls | ≥ 40% | CRM |
| Measured CAC | ≤ $150 | finance |
| MRR | per Section 5 milestones | Stripe |
| Gross margin | ≥ 75% blended | per-client P&L |
| Churn | < 3%/mo by M4 | subscriptions |
| Speed-to-lead SLA | < 60s p95 | sla_metrics |
| Uptime | ≥ 99.5% per client | sla_metrics |
| Complaint rate | < 0.08% every domain | Postmaster poll |
| Eval regressions shipped | 0 | CI |

---

## 16. Appendix: market data and sources (accessed 2026-07-17)

- Voice platform all-in costs and comparisons: retellai.com/blog/vapi-vs-bland; techsy.io/en/blog/retell-ai-vs-vapi-vs-bland; ainora.lt/blog/ai-voice-agent-cost-per-minute-2026; builts.ai/blog/vapi-vs-bland-ai-vs-retell-ai (includes Deepgram adoption stat: AI answered ~14% of SMB inbound calls late 2025).
- Agency pricing bands: trillet.ai/blogs/voice-agent-pricing-strategy-guide; trillet.ai/blogs/voice-ai-agency-business-model-canvas; callsy.ai/insights/ai-voice-agent-cost-2026; digitalagencynetwork.com/ai-agency-pricing.
- Website + care plan pricing: impeladv.com (home services $800-3,000); gruffygoat.com (care $50-500); astriden.com; oui.digital (subscription $225-499/mo).
- Chatbot pricing: dorianmediagroup.com; quickchat.ai; superdupr.com/blog/ai-chatbot-cost.
- TCPA / AI voice: retellai.com TCPA playbook 2026; klariqo.com (FCC Feb 2024 ruling); getassay.io; ringlyn.com (FCC 24-17); callsphere.ai.
- Deliverability 2026: powerdmarc.com bulk sender requirements; firstsales.io (0.10% cap, 0.08% buffer); litemail.ai (Microsoft ramp rules); instantly.ai; gtmbud.com; hothawk.ai (hard rejection era).
- Speed-to-lead: aloware.com benchmarks 2026 (42h median, 7% within 5 min, ~21% vs 2.3% conversion); apten.ai (Velocify 391% at 60s); leadresponse.co (78% first responder); digitalapplied.com (MIT/InsideSales 100x/21x).
- A2P 10DLC: tuco.ai (fees + Feb 2025 enforcement); conduit.ai (2026 requirements); sipnex.ca (Twilio privacy-policy rule eff. 2026-06-30; FCC revocation rule to Jan 2027); pitchprfct.com (campaign review 10-15 days mid-2026).

All third-party figures above are market context, tagged `estimated` until measured by this system. Client-facing artifacts use measured numbers only.

*End of spec. Build well, spend nothing without approval, and never fabricate a number.*
