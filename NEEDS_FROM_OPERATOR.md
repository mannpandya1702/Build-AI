# NEEDS FROM OPERATOR — placeholder tracker

The system is being built **MOCK-first**: every feature works with zero external credentials so it can
be proven before any real spend. This file tracks everything I need from you to flip a subsystem from
MOCK to LIVE. **Nothing here blocks the build** — each item has a safe mock default until you provide the
real value. Fill these in when you're ready; I'll wire them and remove the placeholder.

Convention: code uses `[NEEDS: <key>]` markers and env vars default to mock. Grep `[NEEDS:` to find every
live wiring point.

---

## Legend
- 🔑 Secret / API key (goes in the host secret store, never committed)
- ⚙️ Config decision (a value or a choice)
- 📄 Document / asset you provide
- ✅ Provided

---

## Phase 1 — Security & infra
- [ ] 🔑 `AUTH_PASSWORD` + `AUTH_SECRET` — operator login is BUILT (middleware gates every route); set these to turn it on. Production fails closed (503) until both are set. Upgrades to Supabase Auth at the DB cutover.
- [ ] 🔑 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — the single production Postgres + Auth.
- [ ] 🔑 `SUPABASE_DB_URL` — direct Postgres connection string for the worker (Fly.io).
- [ ] ⚙️ Fly.io (or Railway) account + `FLY_API_TOKEN` for the always-on worker.
- [ ] 🔑 `HEALTHCHECKS_URL` — dead-man's-switch ping URL (healthchecks.io).
- [ ] 🔑 `SENTRY_DSN` — error tracking (worker + dashboard).
- [ ] 🔑 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — ops alerts + inline approvals.
- [ ] ⚙️ **Key rotation confirmation** — rotate every previously chat-exposed key (Places, Vercel, Anthropic, PageSpeed, 21st, Resend, Cal.com) and confirm here so I can purge history.

## Phase 3 — Revenue rails (billing)
- [ ] 🔑 `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`.
- [ ] ⚙️ Confirm final prices for each tier (currently from master spec §4 + premium tier).
- [ ] 📄 Agency legal name, address, and any lawyer-reviewed contract clauses to lock into the generator.

## Phase 5 — Chatbot + Demo Hub
- [ ] ⚙️ `DEMO_BASE_DOMAIN` (e.g. `demo.tradecraftsites.com`) added to Vercel.
- [ ] 🔑 Embeddings provider key (if not reusing Anthropic) for `kb_documents`.

## Phase 6 — Voice line
- [ ] 🔑 `VAPI_API_KEY` (+ `VAPI_PHONE_NUMBER_POOL` or provisioning permission).
- [ ] 🔑 `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` — numbers, SMS, A2P.
- [ ] ⚙️ Approved AI-disclosure line wording for call openings.

## Phase 7 — Automation line
- [ ] 🔑 `TRIGGER_DEV_API_KEY` (+ project).
- [ ] ⚙️ A2P 10DLC brand details (per client at onboarding; agency brand for our own sends).

## Amendment A — First premium niche = **HEALTHCARE** (med spa / dental / mental health / chiropractic)
- [ ] 📄 **BAA template** (Business Associate Agreement) reviewed by counsel — required before any healthcare niche can activate.
- [ ] 🔑 Proof of **E&O insurance** ($1M/$2M per the comparable) on file.
- [ ] ⚙️ Confirm PHI handling + transcript retention policy (default: PHI scrub in logs, retention per client contract).
- [ ] ⚙️ Premium tier price point per niche ($5k–$10k setup / $1k–$2.5k mo — confirm once COGS measured).

## Content / brand
- [ ] 📄 Logo + brand assets for the premium dashboard and client-facing PDFs.
- [ ] 📄 `config/agency-facts.yaml` unconfirmed fields (offer numbers, years, trust facts) currently `[NEEDS: confirm]`.
- [ ] 📄 The ~108 real leads' labels to freeze the **eval golden sets** (`qualify_v1`, `qa_verdicts_v1`, `reply_classifier_v1`) — currently placeholder fixtures.

---

*Updated automatically as phases land. Last updated: Phase 0 (quality rails).*
