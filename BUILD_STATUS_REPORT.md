# Build Status Report — What's Built vs. What We're Adding

**Prepared:** 2026-07-16 · **System:** Agency Autopilot (→ AI Agency) · **Codebase:** branch
`claude/read-pdf-89t95k`, ~7.2k LOC TypeScript, pnpm + Turborepo monorepo.

**Legend:** ✅ Built & working · ⚠️ Built but at-risk / incomplete · 🔨 Adding (planned) · ➕ New capability

> Purpose: an honest inventory of what exists today, and exactly what the implementation plan layers on.
> Companion to `IMPLEMENTATION_PLAN.md`, `AUDIT_AND_PRODUCTION_PLAN.md`, `AI_AGENCY_EVOLUTION_PLAN.md`.

---

## 1. Snapshot

| | Today | After the plan |
|---|---|---|
| **What it sells** | Websites only | Websites + **voice agents** + **AI automation** (cross-sold on one lead) |
| **Who controls spend** | The system (auto-picks top-N by score) | **You** — per-client, per-service approval before any expensive build |
| **Security** | ⚠️ No dashboard auth, SSRF open, PII in git | 🔨 Auth, SSRF guard, secrets clean, OWASP-mapped |
| **Infrastructure** | ⚠️ Split-brain 2-DB bridge, worker on ephemeral container | 🔨 One Supabase DB, worker on a real always-on host |
| **Revenue shape** | One-time builds | One-time **+ monthly retainers** (voice, automation) |
| **Quality gates** | ⚠️ ~2 tests, no CI, no linter | 🔨 CI + Biome + real test suite on incident-prone modules |
| **Frontend** | ✅ Good tokens, ⚠️ 9 pollers, native dialogs | 🔨 shadcn/Radix + realtime, a11y complete |

**Bottom line:** the *sales engine* is genuinely built and has run against real data. What's missing is
**(a)** control over spend, **(b)** production security/infra, and **(c)** the two new service lines
that make it an agency. We add those **on top of** the existing engine — no rewrite.

---

## 2. What's currently built ✅

### 2.1 The pipeline (the core — built and proven)
The full lead-to-delivery flow runs today as chained agents driven by a state machine:

```
research → scrape → qualify → analyzer → solution → uiux → builder → qa → sales → (monitor)
discover   enrich   score     Lighthouse  pitch     design  Vercel    checks outreach/
                              + vision                       deploy           followup/booking
```

- ✅ **10 pipeline agents** (`packages/agents`): research, scrape, qualify, analyzer, solution, uiux,
  builder, qa, sales, monitor — each a module that does one job and advances the lead.
- ✅ **State machine** (`packages/core/statuses.ts`): 23 statuses, a total transition map, and
  `advanceLead` — a single transactional (`BEGIN … FOR UPDATE … COMMIT`) mover that rejects illegal
  transitions. The strongest primitive in the codebase.
- ✅ **Event bus** (`agent_events`): every agent emits structured events; the dashboard, monitor, cost
  tracking, and notifications are all consumers of this one append-only stream.
- ✅ **Status-derived scheduling**: jobs are a projection of lead status, so crashes and exhausted
  retries self-heal on the next scan. Crash-tolerant by design.

### 2.2 Integrations wired (built)
- ✅ **Lead discovery** — Google Places API (New).
- ✅ **Site auditing** — PageSpeed Insights (Lighthouse) + Playwright screenshots/crawl.
- ✅ **LLM** — Anthropic adapter, Haiku (extract/score/classify) + Sonnet (analyze/design/QA), with
  **per-call cost tracking** into `agent_events`.
- ✅ **Website builds** — static Next.js sites from an internal **block library** (`packages/blocks`:
  ~14 blocks, 4 presets, a "looks" system), deployed via the **Vercel API**.
- ✅ **Email** — Resend (transactional) + SMTP (cold outreach); **CAN-SPAM email gate** (suppression
  list, unsubscribe, physical address, truthful subject, idempotency key).
- ✅ **Booking** — Cal.com webhook with **HMAC verification** (raw body, timing-safe, fails closed).
- ✅ **Reply ingestion** — Gmail API polling + a reply classifier.

### 2.3 Operator dashboard (built)
- ✅ **Next.js 14** app with pages: pipeline (kanban), outbox (approvals), meetings, builds, activity,
  reports, settings, lead detail.
- ✅ **Design system** — semantic tokens with *documented* contrast ratios, above-average a11y
  baseline, thorough empty/loading states, hand-rolled UI kit + inline SVG icons.
- ✅ **Worker control** — on/off switch, demo-batch limit, liveness indicator.

### 2.4 Safety & operations (built)
- ✅ **MOCK_MODE** — the entire pipeline runs end-to-end with **zero external calls / zero spend**.
- ✅ **`MOCK_ON_REAL_DB` refusal** — mock stubs refuse to run against a DB holding real leads (born
  from a real incident).
- ✅ **Single-worker advisory lock** — a second worker exits instead of double-running.
- ✅ **Hard caps** (`config/caps.yaml`) — per-mailbox/day sends, Places calls/day, concurrent builds,
  Anthropic spend/day; hitting a cap pauses + notifies.
- ✅ **Monitoring** — hourly anomaly sweep + daily digest; **finance module** that honestly tags numbers
  `measured|allocated|estimated`.
- ✅ **Anti-fabrication guards** — invented-number / unevidenced-claim / voice-lint with a feedback-retry
  loop; `[NEEDS:]` discipline so demos never show placeholders.

### 2.5 Skills already installed (built)
- ✅ `ui-ux-pro-max` design skill + **21st.dev Magic MCP** (component generation).
- ✅ 9 marketing skills from `alirezarezvani/claude-skills` (safety-reviewed on install).

### 2.6 Real operational track record (evidence it works)
- ✅ ~**108 real leads** processed through the CRM; a recent fleet rebuild deployed **34/34 demos, QA
  green**.
- ✅ First live demos deployed end-to-end (e.g. Myriad Roofing) and **first real outreach sent**.
- ✅ Warm-up sending caps (10/day) live; DNS/DMARC verified for the outreach domain.

### 2.7 Built but at-risk / incomplete ⚠️ *(the reasons it's not production-ready)*
- ⚠️ **No dashboard authentication** — every API route is world-reachable (money-spending + PII).
- ⚠️ **Split-brain 2-database bridge** (local Postgres ↔ Neon, 45s last-write-wins) — silently
  clobbers hosted-only writes; the worker lives on an **ephemeral, reclaimable container**.
- ⚠️ **SSRF open** in 4 adapters that fetch prospect-controlled URLs.
- ⚠️ **Real PII + a sent email committed to git**; chat-exposed API keys not verifiably rotated.
- ⚠️ **~2 real test files, no CI, no linter.**
- ⚠️ **Spend is autonomous** — the demo batch auto-picks *top-N by score*; it never asks you which
  client. (Your #1 pain.)
- ⚠️ **One service only** — websites. No voice, no automation.
- ⚠️ **Frontend**: 9 copy-pasted 2–5s pollers, native `confirm()` dialogs, silent fetch failures.

---

## 3. Capability matrix — current → target

| Capability | Now | Target |
|---|---|---|
| Discover + qualify leads (cheap, capped) | ✅ | ✅ (unchanged) |
| Prove value with a demo | ✅ website only | ➕ website **+ voice + automation** |
| **Choose which client to spend on** | ❌ auto | ➕ **operator approval gate** |
| Compliant outreach + booking + delivery | ✅ | ✅ (generalized per service) |
| One lead → multiple offers (cross-sell) | ❌ | ➕ `opportunities` model |
| Dashboard authentication | ❌ | ➕ Supabase Auth + middleware |
| Single authoritative database | ❌ split-brain | ➕ one Supabase Postgres |
| Worker always-on + external death alert | ❌ | ➕ real host + dead-man's-switch |
| CI / linter / real tests | ❌ | ➕ GitHub Actions + Biome + Vitest/Playwright |
| Realtime UI (no polling) | ❌ | ➕ TanStack Query + Supabase Realtime |
| Recurring-revenue delivery/retention ops | ❌ | ➕ health checks + value reports + cross-sell |
| Specialist skills per subagent | ⚠️ partial (design/marketing) | ➕ per-agent installs + custom agency skills |

---

## 4. What we're adding 🔨 (by plan part)

### Part A — Foundations & security *(before any real exposure)*
- 🔨 CI (GitHub Actions) + **Biome** lint/format + real test scripts replacing `echo` stubs.
- 🔨 **Supabase Auth** + `middleware.ts` gating every route; settings-key **allowlist**; dev-tools
  **fail closed**.
- 🔨 **`safeFetch` SSRF guard** on all adapters + Playwright interception (blocks private/metadata IPs,
  re-checks redirects).
- 🔨 **PII purge** from repo + history; **key rotation** completed and verified.
- 🔨 **Collapse the split-brain** → one Supabase Postgres, worker on **Fly.io/Railway**, delete the
  bridge, **external dead-man's-switch** + Telegram/Sentry alerting.

### Part B — The client-approval spend gate ➕ *(your #1 pain)*
- 🔨 New status **`awaiting_build_approval`** — qualified leads stop here; nothing expensive runs.
- 🔨 A **Shortlist page**: each candidate's score, gaps, contact, and **projected build cost**; you
  approve one/several/top-N with a click (emits `lead.build_approved`).
- 🔨 **Build budget** in `caps.yaml` + `BUILD_MODE=review` (default) vs `auto`.

### Part C — Multi-service spine ➕ *(websites → agency)*
- 🔨 **`service_type` enum** (`website | voice_agent | ai_automation`, extensible) + an
  **`opportunities` table** (one lead → many offers).
- 🔨 **`advanceOpportunity`** + scheduler **dispatch on `(status, service_type)`**.
- 🔨 **Multi-gap analyzer** — one pass detects website/voice/automation gaps and creates opportunities.

### Part D — New service builders ➕
- 🔨 **Voice agents** — `packages/voice` (Vapi): a **callable demo number** trained on the business;
  QA places a scripted test call. Monthly retainer.
- 🔨 **AI automation** — `packages/automation` (Trigger.dev): a **sandboxed workflow demo**
  (missed-call text-back, review requests, quote auto-reply); QA asserts the side effect.

### Part E — Skills layer ➕
- 🔨 **Per-agent installs** (safety-reviewed): Firecrawl → scrape, SEO/Local-SEO → analyzer, Frontend
  Design + Vercel Web Design Guidelines → website builder, Webapp Testing + Trail-of-Bits → QA.
- 🔨 **Custom agency skills** (your moat): `agency-brand-voice`, `niche-playbook-<trade>`,
  `demo-quality-bar`, `voice-agent-playbook`, `automation-blueprint`.

### Part F — Frontend / UX overhaul 🔨
- 🔨 **shadcn/ui (Radix)** on the existing tokens (accessible dialogs/menus/tabs/toasts); **v0** +
  21st.dev for generation.
- 🔨 **TanStack Query + Supabase Realtime** replacing the 9 pollers; error/not-found boundaries;
  a11y fixes; new Shortlist + service-badge surfaces.

### Part G — Delivery ops & retention ➕
- 🔨 Post-close **health checks**, **monthly value reports**, **cross-sell prompts** — the retainer
  engine.

### Part H — Observability, testing & launch 🔨
- 🔨 **Sentry**, `agent_events` **retention/partitioning**, in-dashboard spend/queue gauges.
- 🔨 **LLM resilience** — retry/backoff, **prompt caching**, pinned models.
- 🔨 **Test coverage** on the email gate, approval gate, idempotency, SSRF, each service builder;
  Playwright e2e.

---

## 5. Before → After (one page)

**Before:** an autonomous *website* autopilot that finds leads, scores them, **auto-spends** to build
demos for the top-scoring ones, runs outreach, and ships a site after close — impressive, but
unauthenticated, on fragile split-brain infra, untested, and out of your control on spend.

**After:** a **secure, multi-service AI agency platform** where discovery/qualification run hands-free
and cheap, **you approve exactly which client and which service** gets an expensive build, and the
system can prove and deliver a **website, a callable voice agent, or a working automation** — each a
skill-sharpened specialist, each sold once or on a **monthly retainer**, all inside the **same one
system** you already have, on production-grade infra.

---

## 6. Build sequence (fastest path to value)

| Step | Add | Effect |
|---|---|---|
| 1 | CI + lint + test scaffold | Every change is gated |
| 2 | Auth + SSRF + data hygiene | Critical holes closed |
| 3 | **Spend gate** | **Runaway spend stops — you're in control** |
| 4 | Collapse split-brain | Fragile infra → production-grade |
| 5 | Opportunities / service_type spine | The agency pivot |
| 6 | Voice builder → 7. Automation builder | New products live |
| — | Skills (parallel) · Frontend overhaul (parallel) · Delivery ops · Observability | Quality + retention + scale |

Steps **1–3** (≈2 weeks) stop the bleeding and put you in control; everything else builds on that
foundation.

---

*Design/status report only — no application code has been changed. On your go-ahead I begin at steps
1 + 3 against the code branch `claude/read-pdf-89t95k`, proving each part in MOCK_MODE before any spend.*
