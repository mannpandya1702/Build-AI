# Agency Autopilot → AI Agency — Final End-to-End Implementation Plan

**Prepared:** 2026-07-16
**Consolidates:** `AUDIT_AND_PRODUCTION_PLAN.md` (security/infra/UX audit) + `AI_AGENCY_EVOLUTION_PLAN.md`
(product expansion). This is the **single build spec** — file-level, sequenced, with acceptance
criteria — to take the system from a website-delivery autopilot to a secure, multi-service AI agency
that you control.

**Grounded in the real code** (branch `claude/read-pdf-89t95k`): the state machine
(`packages/core/src/statuses.ts`), the single mover `advanceLead` (`packages/core/src/advanceLead.ts`),
the status-triggered scheduler (`apps/worker/src/index.ts`), the agent registry
(`packages/agents/src/registry.ts`), and the schema (`supabase/migrations/00001_init.sql`).

**Prime directives** (every phase honors these):
- **Reuse, don't rewrite.** The sales engine — discovery→qualify→demo→outreach→booking→deliver, the
  event bus, layered idempotency, the email gate, MOCK-first — is kept intact.
- **MOCK_MODE proves every phase before a dollar is spent.** No phase is "done" until it runs green
  end-to-end in mock.
- **You control spend.** After Part B, nothing expensive runs without your explicit approval.
- **Secure by construction.** Security is woven into each part, not bolted on (OWASP map in §J).

---

## 0. The shape of the change (one picture)

```
   AUTONOMOUS & CHEAP              ⛔ YOU APPROVE          OPERATOR-GATED & EXPENSIVE
   discover → enrich → qualify ──► SHORTLIST ──► analyze → solution → build → QA → outreach → book → deliver
                                   (per client,                 │ dispatch on service_type
                                    per service)      ┌─────────┼──────────┐
                                                   website   voice_agent  ai_automation
                                                  (blocks)    (Vapi)      (Trigger.dev)
```

One repo, one DB, one worker, one dashboard. Each service is a **builder behind the same stages**; the
gate sits **once**, in front of the expensive half, and protects all services.

---

## Part A — Foundations & Security *(must land before any real exposure)* · ~1.5–2 weeks

### A0 · Quality gates (do first — everything rides on these)
- **Files:** `.github/workflows/ci.yml`, `biome.json`, per-package real `test` scripts (replace the
  `echo "tests land later"` stubs in `agents`, `adapters`, `worker`, `dashboard`).
- **Do:** CI runs `pnpm typecheck && biome ci && pnpm test && pnpm build` on every PR, required to
  merge. Add **Biome** (one fast tool, lint+format) — the dead `eslint-disable` comments currently
  guard nothing.
- **Accept:** a red test blocks merge; `biome ci` is clean.

### A1 · Authentication + write-surface lockdown  *(audit C-1)*
- **Files:** `apps/dashboard/middleware.ts` (new), `apps/dashboard/lib/auth.ts` (new),
  `app/api/settings/route.ts`, `apps/dashboard/lib/devtools.ts`.
- **Do:** Supabase Auth (single operator, magic-link/password + TOTP). `middleware.ts` gates **every**
  route except the HMAC-verified Cal.com webhook. **Allowlist keys** in `POST /api/settings` (today it
  accepts arbitrary key+JSON). Make dev-tools **fail closed** (`ALLOW_DEV_TOOLS==="1"` only, not
  `!VERCEL`).
- **Accept:** unauthenticated request to any `/api/*` (except webhook) → 401; a non-allowlisted settings
  key → 400; dev fabricator routes → 403 unless explicitly enabled.

### A2 · SSRF guard  *(audit H-1 / OWASP LLM05)*
- **Files:** `packages/adapters/src/safeFetch.ts` (new); apply in `qualify.ts`, `crawl.ts`, `copy.ts`,
  and the Playwright request-interception handler in `screenshots.ts`.
- **Do:** resolve the target host → reject private/link-local/metadata ranges (`10/8`, `127/8`,
  `169.254/16`, `::1`, fc00::/7, …) → **re-check after every redirect** → same guard inside Puppeteer
  interception.
- **Accept:** a lead whose `website_url` resolves to `169.254.169.254` or `localhost` is refused and
  logged; a normal public site passes.

### A3 · Data hygiene  *(audit H-2/H-3)*
- **Do:** add `data/leads.json`, `data/research/`, `drafts/*.md` to `.gitignore`; scrub from history
  (git-filter-repo); keep prospect data in Postgres only. **Complete + verify** rotation of every
  chat-exposed key (Places, Vercel, Anthropic, PageSpeed, 21st, Resend, Cal.com).
- **Accept:** `git log -p` shows no PII; a written rotation checklist is signed off.

### A4 · Collapse the split-brain  *(audit C-2/C-3 — the highest-leverage infra move)*
- **Do:** move the worker to **Fly.io/Railway** (systemd/PM2, direct `:5432`); collapse to **one
  Supabase Postgres**; **delete `apps/worker/src/bridge.ts`** and the dual-DB toggle machinery; add an
  **external dead-man's-switch** (Healthchecks.io/BetterStack querying heartbeat age) + wire
  `notifyOperator` → **Telegram + Sentry**; ship logs off `/tmp` to Axiom/BetterStack.
- **Accept:** kill the worker → external alert fires within minutes; a Cal.com cancellation stays
  cancelled (the bug the bridge caused is structurally impossible with one DB).

> After Part A the system is safe to expose. Parts B–H can then proceed in the sequence below.

---

## Part B — Spend control: the client-approval gate *(your #1 pain)* · ~2–3 days

**Root cause:** the scheduler auto-fires `qualified → analyzed` (`registry.ts:18`,
`statuses.ts:40`), and the only throttle (`batch.ts`) auto-picks *top-N by score*. So it spends on
businesses you never chose.

### B1 · New status + transition
- **File:** `packages/core/src/statuses.ts`, `supabase/migrations/00002_build_approval.sql` (new,
  `alter type lead_status add value 'awaiting_build_approval'`).
- **Do:** insert `awaiting_build_approval` between `qualified` and `analyzed`. New transitions:
  `qualified → awaiting_build_approval → analyzed | disqualified`.

### B2 · Scheduler gate
- **File:** `apps/worker/src/index.ts` (scheduler loop), `registry.ts` (analyzer trigger →
  `awaiting_build_approval` handled by an approval check, not auto-advance).
- **Do:** qualified leads advance to `awaiting_build_approval` and **stop**. The analyzer only fires
  for a lead that has an operator `lead.build_approved` event (mirrors the existing Outbox approval
  pattern in the outbox-poll at `index.ts:254`). `BUILD_MODE=review` (default) requires the click;
  `BUILD_MODE=auto` keeps today's top-N behavior for when you trust it.

### B3 · Build budget + projected cost
- **Files:** `config/caps.yaml` (add `build_spend_per_day`, `build_spend_per_lead`),
  `config/unit-costs.yaml` (already exists — source of the projection).
- **Do:** the Shortlist shows "approve these N ≈ $X" before you click; hitting the daily build ceiling
  **pauses and notifies** (reusing the existing Places/Anthropic cap pattern), never silently drains.

### B4 · Shortlist dashboard page
- **Files:** `apps/dashboard/app/shortlist/page.tsx` (new), `app/api/shortlist/route.ts` (new),
  `app/api/shortlist/approve/route.ts` (new), `components/Sidebar.tsx` (nav entry).
- **Do:** list every `awaiting_build_approval` lead with score, detected gaps, contact, projected cost;
  single + bulk "Approve for build" → emits `lead.build_approved` (authed, per A1). Reuses the existing
  `StatusPill`/`Card`/`Empty` kit.
- **Accept (MOCK):** run 10 mock leads → all stop at Shortlist, **zero** analyzer/build spend until you
  approve; approve 3 → exactly those 3 proceed; the other 7 stay put.

---

## Part C — Multi-service spine *(websites → agency)* · ~1 week

This is the pivot. It generalizes the pipeline so "build" means *any* service.

### C1 · `service_type` + `opportunities`
- **File:** `supabase/migrations/00003_opportunities.sql` (new).
- **Schema:**
  ```sql
  create type service_type as enum ('website','voice_agent','ai_automation'); -- extensible: seo, ads
  create table opportunities (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references leads(id) on delete cascade,
    service_type service_type not null,
    status lead_status not null default 'qualified',   -- the state machine now moves THIS
    score int, score_breakdown jsonb,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
    unique (lead_id, service_type)
  );
  -- artifacts gain opportunity_id (nullable during migration, then backfilled + set not null):
  alter table audits    add column opportunity_id uuid references opportunities(id) on delete cascade;
  alter table solutions add column opportunity_id uuid references opportunities(id) on delete cascade;
  alter table designs   add column opportunity_id uuid references opportunities(id) on delete cascade;
  alter table builds    add column opportunity_id uuid references opportunities(id) on delete cascade;
  alter table emails    add column opportunity_id uuid references opportunities(id); -- outreach is per-offer
  ```
- **Backfill:** every existing lead gets one `website` opportunity carrying its current `status`;
  existing artifacts link to it. The `leads` row stays the **CRM/company record**; the **opportunity**
  becomes the pipeline unit. One lead → many opportunities = cross-sell.

### C2 · `advanceOpportunity` + dispatch
- **Files:** `packages/core/src/advanceLead.ts` → add `advanceOpportunity(opportunityId, to, opts)`
  (same `BEGIN … FOR UPDATE … validate … UPDATE … event … COMMIT` shape, keyed on `opportunities`),
  keep `advanceLead` as a thin wrapper during migration; `packages/agents/src/registry.ts` →
  triggers become `(status, service_type)`; `apps/worker/src/index.ts` scheduler selects
  opportunities and dispatches to the right service module.
- **Do:** the scheduler's per-status query (`index.ts:196`) becomes per-`(status, service_type)`; the
  agent handler map gains a service dimension: `handlers[agent.name][service_type]`.

### C3 · Multi-gap analyzer
- **File:** `packages/agents/src/real/analyzer.ts` (+ per-service analyze modules).
- **Do:** one analyze pass detects **all three** opportunity types from data the scraper already
  collects: weak/absent site → `website`; voicemail/"missed call" complaints in `reviews` → `voice_agent`;
  "call for a quote"/no online booking → `ai_automation`. Each detected gap **creates an opportunity**
  at `awaiting_build_approval`. Now the Shortlist recommends *which service* per client.

### C4 · Generalize builds/QA/outbox
- **Do:** `builds`, `qa_reports`, and the Outbox key off `opportunity_id`. A voice demo stores its
  demo phone number in `builds.deploy_url`; an automation demo stores its sandbox trigger link — same
  table, same "here's your demo" outreach.
- **Accept (MOCK):** a mock lead spawns 2 opportunities (website + voice), both stop at Shortlist,
  approve both → two independent demos build and two offers reach the Outbox.

---

## Part D — Service builders *(the new products)* · ~1–2 weeks each

Each service implements the **same four hooks** — `analyze · solution · build · qa` — behind the
interface Part C defines. Website is the existing code, moved behind the interface (`D0`, ~2 days).

### D1 · Voice agents — `packages/voice` (recommended first)
- **Stack:** **Vapi** (adapter `packages/adapters/src/vapi.ts`), mock-backed like every adapter.
- **build:** provision a temporary **demo phone number**; system prompt built from the lead's real
  facts (services, hours, `contact_phone`, booking link); inbound-only (no cold-call consent issues).
- **qa:** place a **scripted test call**, score the transcript for correctness + booking success +
  latency; fail → rebuild (same QA-loop the website builder uses).
- **outreach:** "Call this number — that's your 24/7 receptionist." Monthly-retainer offer.
- **Skill:** custom `voice-agent-playbook` (below).
- **Accept (MOCK):** mock Vapi returns a fake number + canned transcript; QA passes; Outbox draft
  contains the number. No real telephony spend in mock.

### D2 · AI automation — `packages/automation`
- **Stack:** **Trigger.dev** (adapter `packages/adapters/src/triggerdev.ts`); n8n later for
  client-owned/white-label.
- **build:** generate a **sandboxed** workflow seeded with the lead's public data (missed-call
  text-back, review-request, quote auto-reply); runs against **your** test tools, never the prospect's
  real systems, until close.
- **qa:** dry-run the workflow, **assert the side effect** (test SMS sent, mock row created).
- **outreach:** a one-click "run the demo" link that produces a visible result.
- **Skill:** custom `automation-blueprint`.
- **Accept (MOCK):** the demo fires against a stub, QA asserts the side effect, nothing touches a real
  external system.

---

## Part E — Skills layer *(make every subagent a specialist)* · ongoing, parallel from Part C

Skills are folders (`SKILL.md` + refs + scripts) an agent loads **only when relevant** (progressive
disclosure). They live in-repo under `.claude/skills/` and are versioned with the code — **not a
separate system**.

### E1 · Install vetted third-party skills (per agent)
**Every third-party skill is safety-reviewed before install** (they carry executable scripts) — the
same discipline the repo already used for the marketing skills.

| Agent / area | Skill | Source |
|---|---|---|
| scrape/research | Firecrawl skill + CLI | firecrawl |
| qualify/analyzer | SEO Audit & AEO, Local SEO Manager | alirezarezvani/claude-skills |
| solution | CRO Specialist, Contracts & Proposals, Market Research | alirezarezvani |
| website builder | Frontend Design, Vercel Web Design Guidelines, Vercel React Best Practices | firecrawl roundup |
| qa | Webapp Testing (Playwright), Trail of Bits Security (CodeQL/Semgrep) | firecrawl |
| sales | Content Creator, Growth Marketer | alirezarezvani |

Catalogs to mine (all safety-reviewed first): `anthropics/skills`, `ComposioHQ/awesome-claude-skills`,
`hesreallyhim/awesome-claude-code`.

### E2 · Author the custom agency skills *(your moat)*
These encode **your** winning patterns so every run reproduces them:
- `agency-brand-voice` — the outreach/site voice, wired to the existing anti-fabrication guards.
- `niche-playbook-<trade>` (roofing, HVAC, dental, …) — proven gaps + copy + look per vertical.
- `demo-quality-bar` — the "does this demo clear the bar" checklist the QA agent applies.
- `voice-agent-playbook` — Vapi prompt/flow templates, objection handling, booking hooks.
- `automation-blueprint` — the Trigger.dev/n8n patterns you productize.

**SKILL.md shape** (progressive disclosure — short entry, detail in refs):
```
---
name: voice-agent-playbook
description: Build and QA a Vapi voice-agent demo for a local-service business.
  Use when service_type=voice_agent — designing the system prompt, call flow,
  booking hooks, and the QA test-call rubric. Triggers: "voice agent", "receptionist demo".
---
# Voice Agent Playbook
[short instructions] · see references/prompts.md, references/qa-rubric.md
```
Descriptions carry the **exact trigger phrases** the work uses — that is what makes the agent load the
right skill at the right moment.

### E3 · Wire skills to agents
- **Do:** each pipeline agent references its skill(s) in its prompt-assembly step
  (`packages/agents/*/prompts/`), and the Anthropic adapter loads the skill body as system context when
  that agent runs. Keep the sweet spot: a few specialist skills per agent, not dozens.
- **Accept:** the website builder's output measurably clears the Vercel Web Design Guidelines checks;
  the voice builder produces a flow that passes the `voice-agent-playbook` QA rubric.

---

## Part F — Frontend / UX overhaul *(fabulous & appealing)* · ~2–3 weeks

Build **on** the existing token system (it's good) — this is finishing, not redesigning.
- **Primitives:** adopt **shadcn/ui (Radix)** on the current tokens — replaces native `confirm()`, the
  incomplete tab pattern, the custom bell menu with accessible dialogs/menus/tabs/toasts. Use **v0** +
  the installed **21st.dev Magic MCP** to generate components fast.
- **Data layer:** replace the 9 copy-pasted pollers with **TanStack Query + Supabase Realtime**; add
  `error.tsx`/`not-found.tsx` and explicit per-page error UI (no more infinite skeletons). SSR initial
  data + stream; subscribe for deltas.
- **New surfaces:** the **Shortlist** page (B4), a **service badge** per opportunity, and
  demo-experience cards ("Call the demo" / "Run the automation") on the lead page.
- **A11y:** stop using the 3.2:1 `faint` token on small body text; complete the lead-page tab ARIA;
  **sandbox** the demo iframes; trim font weights.
- **Accept:** Lighthouse a11y ≥ 95 on dashboard pages; no page shows an infinite skeleton on a failed
  fetch; the Vercel Web Design Guidelines skill passes on the new components.

---

## Part G — Delivery ops & retention *(what makes it an agency)* · ~1 week

Post-`closed_won` today is one-and-done. Voice/automation are **living** services:
- **Health checks:** a monitor job verifies each delivered service weekly (number answers? automation
  fired?) → alert on failure.
- **Monthly value report:** an email (transactional, review-mode) summarizing outcomes (calls handled,
  hours saved) — the retainer justification.
- **Cross-sell prompts:** a delivered website opportunity surfaces "pitch the voice agent" on the lead
  page — the next `opportunity`, warm.
- **Accept (MOCK):** a delivered opportunity generates a mock value report and a cross-sell suggestion.

---

## Part H — Observability, testing & launch · ~1–2 weeks

- **Observability:** Sentry (worker + dashboard), external heartbeat monitor (A4), `agent_events`
  **monthly partitioning + retention**, composite index `(type, created_at)`, in-dashboard spend/queue
  gauges.
- **LLM resilience:** localized 429/5xx retry-with-backoff in `anthropic.ts`, **prompt caching** on the
  large static system prompts (cost + latency win), **pin** the Sonnet model, move models/prices to
  `caps.yaml`.
- **Tests (the incident-prone modules):** email gate, `approveAndSend` idempotency, `advanceOpportunity`
  under concurrent callers, the **build-approval gate**, SSRF guard, each service builder's QA in mock;
  Playwright e2e for login → approve-shortlist → approve-outbox.
- **Launch checklist:** all caps set to warm-up values; `BUILD_MODE=review`; keys rotated; one full
  **MOCK** pipeline run per service green; then one **real** run of a single approved lead per service,
  watched.

---

## I. Dependency-ordered timeline

| Order | Part | Gates | Rough effort |
|------|------|-------|--------------|
| 1 | **A0** CI/lint/test scaffold | — | 2–3 d |
| 2 | **A1–A3** auth, SSRF, data hygiene | A0 | 4–6 d |
| 3 | **B** spend gate (ship value early) | A1 | 2–3 d |
| 4 | **A4** collapse split-brain | A1 | 4–7 d |
| 5 | **C** opportunities/service_type spine | A4, B | ~1 wk |
| 6 | **D1** voice builder | C | 1–2 wk |
| 7 | **E** skills (parallel from step 5) | C | ongoing |
| 8 | **D2** automation builder | C | 1–2 wk |
| 9 | **F** frontend overhaul (parallel from step 3) | A1 | 2–3 wk |
| 10 | **G** delivery/retention | C, D1 | ~1 wk |
| 11 | **H** observability/testing/launch | all | 1–2 wk |

**Fastest path to relief:** steps 1→2→3 (CI + security + spend gate) in the first ~2 weeks stops the
bleeding and closes the critical holes. The agency expansion (C, D, E) builds on that foundation.

## J. Security woven through — OWASP LLM Top 10 (2025) coverage

| Risk | Covered by |
|---|---|
| LLM01 Prompt Injection | untrusted-content delimiters in agent prompts; existing output guards kept |
| LLM02 Sensitive Info | A1 auth; A3 PII purge; secrets in env only |
| LLM05 Improper Output Handling (→SSRF) | A2 `safeFetch` on every adapter + Playwright interception |
| LLM06 Excessive Agency | **Part B build-approval gate** + email review mode + hard caps |
| LLM09 Misinformation | anti-fabrication guards + `[NEEDS:]` extended to voice/automation scripts |
| LLM10 Unbounded Consumption | build budget (B3) + `agent_events` retention (H) |
| Web classics | webhook HMAC (kept), CSRF once sessions exist, least-privilege keys, rotation (A3) |

New-surface security: voice demos **inbound-only** + call-recording disclosure + per-number spend caps;
automation demos **sandboxed** against your test tools, least-privilege-scoped, fully logged.

---

## K. Acceptance philosophy (how we know each part is real)

Every part ships with a **MOCK_MODE end-to-end proof first** (zero external spend), then a single
**watched real run**. The system's own guardrails make this safe: `MOCK_ON_REAL_DB` refusal, the
advisory single-worker lock, and — after Part B — your approval on every expensive action. Nothing
reaches a prospect, and no dollar is spent, without both a green mock run and your click.

---

*Companion specs: `AUDIT_AND_PRODUCTION_PLAN.md`, `AI_AGENCY_EVOLUTION_PLAN.md`. This plan is
design-only — no application code changed. On your go-ahead I start at step 1 (CI scaffold) and step 3
(the spend gate) against the code branch `claude/read-pdf-89t95k`, proving each in MOCK_MODE before
anything spends.*
