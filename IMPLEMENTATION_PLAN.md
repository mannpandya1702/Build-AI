# Final Implementation Plan — Agency Autopilot → AI Agency (v2.0)

**Version:** 2.0 · **Prepared:** 2026-07-16 · **Supersedes:** v1.0
**Governed by:** `AI_AGENCY_MASTER_SPEC.md` (the source of truth for vision, business model, pricing,
compliance, architecture). This document is the **file-level "how"** for that spec's phases.
**Precedence:** `CLAUDE.md` (behavior) → `AI_AGENCY_MASTER_SPEC.md` (what & why) → **this plan** (how).
On any conflict: **stop and ask the operator.**
**Companions:** `AUDIT_AND_PRODUCTION_PLAN.md`, `AI_AGENCY_EVOLUTION_PLAN.md`, `BUILD_STATUS_REPORT.md`.
**Codebase:** branch `claude/read-pdf-89t95k`, ~7.2k LOC, pnpm + Turborepo.

**Prime directives (every phase):**
- **MOCK-first, always.** Each phase ends with a MOCK_MODE demo to the operator, criteria green, before
  the next phase. The `MOCK_ON_REAL_DB` refusal stays permanently.
- **Operator approves every dollar of build spend.** `BUILD_MODE=review` is the permanent default.
- **No phase spends real money without an explicit "GO"** for that phase.
- **Compliance is code, not documentation** (spec §10). A task conflicting with §10 is wrong.
- **Never fabricate a number.** `[NEEDS:]` + anti-fabrication lint apply to every generated artifact.
- **Honesty tagging** — `measured|allocated|estimated`; only `measured` reaches client-facing reports.

---

## 1. What v2.0 adds over v1.0

v1.0 planned security + a 3-service pivot. The master spec (and this v2) extends it to the full agency
and folds in the **operator-approved niche-expansion engine + premium pricing tier**:

| Added in v2.0 | Source |
|---|---|
| **Chatbot** as a 4th service line + first retainer (`packages/chat`, RAG on scrape corpus) | spec §7.2 |
| **Demo Hub** — one URL/lead carrying site + embedded chatbot + web-call voice demo + booking | spec §6.3 |
| **Revenue rails** — Stripe billing, proposal/contract generation, invoices, dunning (`packages/billing`) | spec §7, §14 P3 |
| **Compliance-as-code** — `consent_records`, TCPA/A2P/CAN-SPAM enforcement (`packages/compliance`) | spec §10 |
| **Eval harness** — golden sets frozen from the ~108 leads, CI-gated (`packages/evals`) | spec §11 |
| **Graphile Worker** replaces pg-boss; advisory lock retired (see §8 decision) | spec §8.5 |
| **Client portal, SLA metrics/credits, per-client P&L, case-study engine** | spec §7.5, §12 |
| **➕ Niche-Expansion Engine** — target any vertical as config + compliance profile + playbook + price tier | **Amendment A** |
| **➕ Premium / high-ticket pricing tier** ($5k–$10k setup for high-LTV niches) | **Amendment A** |

---

## 2. Architecture deltas (grounded in the real code)

- **State machine → opportunities.** Keep `advanceLead` exactly as built (`packages/core/advanceLead.ts`
  — transactional `BEGIN … FOR UPDATE … COMMIT`, total transition map, illegal transitions rejected).
  Add `advanceOpportunity` with identical guarantees. The **approval gate is a status**
  (`awaiting_build_approval`), not a flag, so it inherits crash-tolerance for free.
- **Scheduler dispatch** (`apps/worker/src/index.ts`) moves from `status → agent` (today via
  `AGENT_BY_TRIGGER` in `registry.ts`) to **`(status, service_type) → agent`**.
- **One database.** Collapse the split-brain to a single Supabase Postgres; **delete
  `apps/worker/src/bridge.ts`** (not disable). RLS on every table.
- **Jobs.** Graphile Worker on the same Postgres executes jobs; **status stays the source of truth** —
  the scan reconciles `status → desired jobs`, Graphile executes with retries/backoff/priorities.
- **Demo Hub** (`apps/demo-hub`) rides on the site the pipeline already builds; chatbot + voice-web-call
  demos reuse the **scrape corpus** already collected → four-product demo at ~website-demo cost.

---

## 3. Phased execution (spec §14, made file-level)

Each phase: MOCK demo + acceptance criteria green + operator **GO** before the next. **F (frontend)** and
**S (skills)** run in parallel from Phase 4.

### Phase 0 · Quality rails (wk 1)
- **Files:** `.github/workflows/ci.yml`, `biome.json`, `packages/evals/**` (harness skeleton),
  replace every `echo` test script.
- **Do:** CI = Biome + typecheck + Vitest + Playwright smoke + `pnpm audit`, required to merge. Freeze
  `qualify_v1` golden set from the ~108 leads.
- **AC:** red PR cannot merge; evals run on PR; all `echo` stubs gone.

### Phase 1 · Security (wk 1–2)
- **Files:** `apps/dashboard/middleware.ts`, `apps/dashboard/lib/auth.ts`,
  `packages/adapters/src/safeFetch.ts` (applied in `qualify.ts`, `crawl.ts`, `copy.ts`,
  `screenshots.ts` interception), `app/api/settings/route.ts` (allowlist), `lib/devtools.ts` (fail closed).
- **Do:** Supabase Auth (operator email OTP) + middleware on every route (webhook excepted); **RLS on all
  tables**; SSRF guard; **rotate keys → purge history (`git-filter-repo`) → verify**; rate-limit public
  routes.
- **AC:** unauthenticated request → 401; SSRF corpus tests pass; no secret in history scan; OWASP
  checklist (from `AUDIT_AND_PRODUCTION_PLAN.md`) signed off.

### Phase 2 · One database + spend gate (wk 2–3)
- **Files:** `supabase/migrations/00002_build_approval.sql` (`awaiting_build_approval` +
  transitions in `packages/core/statuses.ts`), scheduler guard in `apps/worker/src/index.ts`, worker on
  Fly.io + Graphile Worker, delete `bridge.ts`, `config/caps.yaml` (`build_spend_per_day/_per_lead`),
  Shortlist API + page (Phase F), Telegram inline approvals.
- **Do:** single Supabase Postgres; qualified leads stop at `awaiting_build_approval`; analyzer fires
  only on a `lead.build_approved` event; `BUILD_MODE=review` default; dead-man's-switch → healthchecks.io
  → Telegram.
- **AC:** `kill -9` the worker mid-build → self-heals, **no duplicate side effects**; **zero expensive
  jobs run without an approval event**; bridge **deleted**, not disabled.

### Phase 3 · Revenue rails (wk 3–4)  *(monetize the existing website product now)*
- **Files:** `packages/billing/**` (Stripe products/prices per spec §4 incl. **the new tiers, Amendment
  A**), proposal generator, contract generator (validated templates), invoices, dunning + service
  auto-pause, Stripe webhook (HMAC).
- **Do:** programmatic contracts — **impossible to generate with a blank field or contradictory pricing**;
  **do not** copy the ClinicPro IP clause (client owns their site/data; **agency owns the platform**).
- **AC:** MOCK checkout → subscription → invoice → dunning → auto-pause end-to-end; contract validation
  suite green (no blanks, no price contradictions, correct IP clause).

### Phase 4 · Opportunities spine + Niche engine (wk 4–5)
- **Files:** `supabase/migrations/00003_opportunities.sql` (`service_type` enum incl. `chatbot`;
  `opportunities`, `clients`, `service_instances`, `exclusivity_claims` tables),
  `packages/core` (`advanceOpportunity`), scheduler `(status, service_type)` dispatch, multi-gap
  analyzer, **Niche-Expansion Engine (Amendment A)**.
- **AC:** one mock lead yields website + chatbot + voice opportunities, each independently advanceable;
  exclusivity conflict blocks approval with a logged override path; **a niche cannot be activated until
  its compliance profile is satisfied** (Amendment A).

### Phase 5 · Chatbot + Demo Hub (wk 5–7)
- **Files:** `packages/chat/**` (RAG on `kb_documents`, Haiku live + Sonnet escalation, `<script>`
  widget, consent-aware capture), `apps/demo-hub/**`.
- **AC:** demo hub renders for a mock lead; chatbot grounded **only** in scraped KB (fabrication lint
  green); widget passes CLS/latency budget; rate-limiting proven.

### Phase 6 · Voice line (wk 7–9)
- **Files:** `packages/voice/**` (4 Vapi templates; consent-gated speed-to-lead webhook), web-call demo
  on the hub, QA scripted calls, `sla_metrics`.
- **AC:** **dialer provably refuses a number without a `consent_records` row**; AI disclosure asserted in
  every QA transcript; mock speed-to-lead fires <60s from webhook; per-call cost lands in `costs` with
  client attribution. **Measure real Vapi $/min early** (margin-critical, spec §5).

### Phase 7 · Automation line (wk 9–10)
- **Files:** `packages/automation/**` (3 Trigger.dev templates), A2P onboarding state machine in
  `packages/compliance`, quiet hours + STOP/HELP global.
- **AC:** each template has a side-effect assertion test; **SMS hard-blocked until campaign status =
  approved**; STOP writes to global suppression across channels.

### Phase 8 · Delivery ops + portal (wk 10–12)
- **Files:** health-check jobs, monthly value-report generator (measured-only), SLA credits, case-study
  engine, `apps/portal/**`, cross-sell artifact generation.
- **AC:** value report for a mock client contains **zero `estimated` numbers**; SLA credit computed
  correctly from seeded telemetry.

### Phase 9 · Scale + observability (ongoing)
- **Files:** Sentry, `agent_events` monthly partitioning + retention, prompt caching + Batch API, pinned
  models config, spend/queue gauges, per-client P&L dashboard.
- **AC:** cache-hit rate + batch savings visible in finance; P&L view matches `costs` sums to the cent.

**Parallel F — Frontend** (from P4): shadcn/ui on existing tokens, TanStack Query + Supabase Realtime
(delete 9 pollers), TanStack Table virtualized, sonner toasts, error/not-found boundaries, a11y,
Shortlist (keyboard-first), command palette, Client P&L, SLA board, spend gauges (spec §12).
**Parallel S — Skills** (from P4): §6 below.

---

## 4. Amendment A — Niche-Expansion Engine + Premium Tier ➕ *(operator-approved 2026-07-16)*

**Rationale.** ICP is already configuration (`config/icp.yaml`), so the system can target *any* vertical.
Pricing power is a property of the **niche**, not the software: a recovered dental/med-spa/PI-law lead
is worth far more than a roofing lead, which is what makes a **$5k–$10k setup** defensible (cf. the
ClinicPro comparable at $10.5k). This amendment makes "target any niche, priced to its LTV" a
**first-class, safe, one-flip capability** — without overturning the spec's healthcare-default-off
stance (§10): a high-compliance niche simply requires its compliance profile satisfied before activation.

### A.1 A niche is a **Niche Profile** = four bound artifacts
- **Targeting** — `config/niches/<niche>.yaml`: vertical, Places search terms, cities, scoring rubric,
  qualification thresholds. (Generalizes today's `icp.yaml`.)
- **Compliance profile** — flags the `packages/compliance` engine enforces, e.g.
  `requires_baa`, `phi_handling`, `insurance_required: [E&O 1M/2M]`, `advertising_rules: <bar|none>`.
  Home services = baseline; **healthcare (dental/med-spa/chiro) = HIPAA/BAA/PHI/insurance ON**; legal =
  advertising-ethics ON.
- **Playbook skill** — `skills/niche-playbook-<niche>` (gap detection, objections, demo angles, brand-
  voice tuning). The conversion moat; **roofing done excellently first** (spec §13).
- **Price tier** — `config/pricing/<tier>.yaml`, consumed by the contract/proposal generator (Phase 3),
  validated (no blanks, no contradictions).

### A.2 The niche-activation gate (safe by construction)
Activating a niche is an operator action, gated exactly like the spend gate: the system **refuses to run
discovery/outreach for a niche whose compliance profile is unmet** — e.g. a healthcare niche cannot
activate until a BAA template exists, insurance is on file, and `phi_handling` is on. This keeps spec
§10 intact: healthcare is *off by default* and only reachable through a satisfied compliance profile.
- **Files:** `packages/compliance/src/nicheProfile.ts` (load + validate), `apps/dashboard` niche-admin
  surface, an `agent_events` `niche.activated` record with the compliance attestation.
- **Discipline:** spec's *one active vertical at a time* holds — activation is deliberate and sequenced,
  not a spray.

### A.3 Premium / high-ticket pricing tier (extends spec §4)
Two coexisting models, both driven by the same automated pipeline:

| Tier | Niches | Setup | Monthly | Delivery |
|---|---|---|---|---|
| **Volume** (default) | Home services (roofing→HVAC→plumbing) | $1.5k–$3k | $99–$1,297 | Fully automated (spec §4) |
| **➕ High-Ticket** | High-LTV: med spa, dental, PI/family law, multi-location | **$5k–$10k** | $1k–$2.5k | Automated **+ white-glove onboarding SKU** (a few operator hours) to meet the price expectation |

- **Why the price holds:** high niche LTV + heavier integration + compliance burden (BAA/insurance) —
  the setup fee is *earned*, not arbitrary. The white-glove onboarding SKU is what a $10k buyer expects
  and prevents the refund/chargeback risk of selling automated-only delivery at a premium price.
- **Guardrails:** premium contracts still generated programmatically + validated; still no fabricated
  numbers; still `measured`-only client reports. The premium tier changes the *price and compliance
  profile*, never the honesty or spend-gate rules.

### A.4 Where it lands in the phases
- **Phase 1/7 (`packages/compliance`):** compliance profiles + the per-niche enforcement flags.
- **Phase 3 (`packages/billing`):** the High-Ticket price tiers + white-glove SKU in the pricing/contract
  generator.
- **Phase 4 (spine):** niche-activation gate + `config/niches/**`.
- **Parallel S (skills):** `niche-playbook-<niche>` per activated vertical (roofing first, then one
  high-ticket niche as a proof).
- **AC (amendment):** activating a healthcare niche is **blocked** until BAA + insurance + PHI handling
  are present (test); a High-Ticket contract generates with the correct tier, IP clause, and no price
  contradiction; the volume model is unaffected.

---

## 5. Pricing ladder v2 (spec §4 + Amendment A)

| Product / tier | Setup | Monthly |
|---|---|---|
| Website (wedge) | $1,500 | $99 |
| Chatbot (first retainer) | $297 *(waived w/ website)* | $197 |
| Voice — single assistant | $497 | $397 (500 min) |
| Automation pack | $297 | $247 |
| AI Front Desk (bundle) | $997 | $797 |
| Growth System (flagship) | $2,997 | $1,297 (1,000 min) |
| **➕ High-Ticket Niche (Amendment A)** | **$5,000–$10,000** | **$1,000–$2,500** |

Economics unchanged for volume tiers (spec §5). High-Ticket margins are set per niche once COGS +
compliance/insurance amortization are **measured**, not assumed.

---

## 6. Skills plan (spec §13)

**Per-agent installs** (safety-reviewed, pinned): Firecrawl → scrape; SEO/Local-SEO → analyzer; Frontend
Design + Vercel Web Design Guidelines → website builder; Webapp Testing + Trail-of-Bits → QA.

**Custom agency skills (the moat, priority order):** `niche-playbook-roofing` (first, excellently) →
`agency-brand-voice` → `demo-quality-bar` → `voice-agent-playbook` → `automation-blueprint` →
`proposal-and-pricing` → `objection-handling` → `client-onboarding` → `compliance-checklist` →
`case-study-writer`. **Amendment A adds** one `niche-playbook-<niche>` per activated high-ticket vertical.

---

## 7. Sequencing & timeline

| Wk | Phase | Ship |
|---|---|---|
| 1 | 0 Quality rails | CI/evals gate every change |
| 1–2 | 1 Security | 401 everywhere; SSRF closed; keys clean |
| 2–3 | 2 One DB + **spend gate** | **runaway spend stops** |
| 3–4 | 3 Revenue rails (+ premium tiers) | **monetize websites now** |
| 4–5 | 4 Spine + **Niche engine** | agency pivot + any-niche capability |
| 5–7 | 5 Chatbot + Demo Hub | the conversion weapon |
| 7–9 | 6 Voice line | anchor retainer |
| 9–10 | 7 Automation line | ops retainer + A2P |
| 10–12 | 8 Delivery + portal | retention + SLA proof |
| ongoing | 9 Scale/observability | margins + P&L to the cent |
| ∥ from 4 | F Frontend · S Skills | UX overhaul + playbooks |

**Fastest value:** weeks 1–3 (rails + security + spend gate) stop the bleeding and put you in control;
week 3–4 turns on revenue for the product that already works.

---

## 8. Open decisions (operator)

1. **Branch.** This plan + the master spec live on the docs branch (`claude/agency-audit-production-plan-198p01`);
   the code is on `claude/read-pdf-89t95k`. **Confirm I execute against the code branch** before any code.
2. **Graphile Worker vs. keep pg-boss.** The spec mandates Graphile (retires the advisory lock); the audit
   found pg-boss adequate. It's a real migration on a queue layer that works. **Confirm Graphile is a
   deliberate priority**, or keep pg-boss and bank the time.
3. **First high-ticket niche (Amendment A).** After roofing proof, which premium vertical first — **med
   spa / dental** (highest LTV, but HIPAA/BAA/insurance) or **PI/family law** (high LTV, no HIPAA, but
   advertising-ethics rules)? This sets which compliance profile we build first.

---

*Governed by `AI_AGENCY_MASTER_SPEC.md`. Design-only; no application code changed. On GO + the branch
confirmation (§8.1), I start at Phase 0, MOCK-first, criteria green before each next phase.*
