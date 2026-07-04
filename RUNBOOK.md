# RUNBOOK — Agency Autopilot

Operational manual (spec §13 Phase 7). Concise on purpose. If a step here disagrees with reality,
fix the runbook in the same commit that fixes the problem.

## 1. Bring the system up from scratch (local / dev container)

```bash
# 1. Postgres (dev stand-in for Supabase; same engine)
service postgresql start
# db + role exist already; if starting from a truly blank machine:
#   createuser autopilot; createdb agency_autopilot -O autopilot; set password autopilot_local_dev

# 2. Install + migrate + seed
pnpm install
pnpm migrate                      # applies supabase/migrations/*.sql in order
cd apps/worker && pnpm exec tsx src/seed-looks.ts    # idempotent looks registry seed

# 3. Secrets: copy .env.example -> .env.local and fill. NEVER commit .env.local.

# 4. Worker (choose ONE mode)
cd apps/worker && MOCK_MODE=true  pnpm dev   # fixtures, zero external calls, zero spend
cd apps/worker && MOCK_MODE=false pnpm dev   # real adapters: Places, PageSpeed, Sonnet, Vercel

# 5. Dashboard
cd apps/dashboard && pnpm dev     # http://localhost:3100
```

The worker takes a Postgres advisory lock (`autopilot_worker`); a second worker exits at boot.
That is deliberate. Never run two workers against one database.

## 2. Deploy the worker to a VPS (production shape)

1. Provision a small VPS (1-2 GB). Install Node 22 + pnpm. Clone the repo, `pnpm install`.
2. Swap `DATABASE_URL` in `.env.local` to the real Supabase Postgres connection string. Run
   `pnpm migrate` against it once. Migrations are files; never mutate schema via the dashboard.
3. Run the worker under a supervisor so it restarts on crash:
   `systemd` unit or `pm2 start "pnpm --dir apps/worker dev" --name autopilot-worker`.
4. Deploy the dashboard to Vercel (it is a Next.js app) with the same env vars; put Supabase Auth
   in front before exposing it publicly (local dev has NO auth by design).
5. Point the Cal.com webhook at `https://<dashboard>/api/webhooks/calcom` with
   `CALCOM_WEBHOOK_SECRET` set on both sides. The endpoint 503s until the secret exists and 401s
   any unsigned/mis-signed post.

## 3. Container/host restarted. What do I do?

Exactly this, in order:
```bash
service postgresql start
cd apps/worker && MOCK_MODE=false pnpm dev     # (or MOCK_MODE=true for fixture work)
cd apps/dashboard && pnpm dev
```
Recovery is designed to be boring: jobs are idempotent keyed on (lead, step), sends carry
idempotency keys (retried sends never double-send), builds use an atomic claim row, and stale
claims (>30 min in 'building') are auto-failed on the next builder pass so a mid-build crash never
wedges a lead. Verified across repeated real container restarts and the Phase 5/7 tests.

## 4. Caps and budgets (config/caps.yaml)

Hard limits; hitting one pauses that resource and notifies, never silently drops:
- `places_calls_per_day` (200): discovery + photo fetches stop; scheduler skips scrape until the
  day rolls over. Stuck-at-`discovered` leads catch up on the new day's budget.
- `total_daily_sends` (50) / `mailbox_daily_send_cap` (25): outreach queue holds.
- `anthropic_usd_per_day` and per-lead demo budget ($3): llm() throws before spending past it.

## 5. Email / outreach operations

- Mode lives in `OUTREACH_MODE`: `review` (default; drafts wait in the Outbox) or `auto`.
- Suppression is sacred: any unsubscribe/not_interested reply suppresses ADDRESS AND DOMAIN and
  halts the sequence. Never delete suppression rows.
- Every send passes the gate (suppression, caps, CAN-SPAM footer, honest subject) — the gate lives
  in `packages/adapters/src/email.ts`, single choke point.
- Cold SMS does not exist in this system. Do not add it (TCPA, CLAUDE.md §0.4).
- Before real sending exists: outreach domain + 2-3 Google Workspace mailboxes, warmed 2-3 weeks;
  verify DKIM/SPF/DMARC; keep the main agency domain out of cold outreach.

## 6. Rotate credentials

All keys live ONLY in `.env.local` (never committed; `.gitignore` covers it). To rotate: replace
the value in `.env.local`, restart the worker + dashboard. Rotation list and where they are used:
- `GOOGLE_PLACES_API_KEY` (discovery, photos), `PAGESPEED_API_KEY` (audits + QA)
- `ANTHROPIC_API_KEY` (all agents), `VERCEL_TOKEN` (deploys)
- `RESEND_API_KEY` (email), `CALCOM_API_KEY` + `CALCOM_WEBHOOK_SECRET` (booking)
- 21st.dev key lives in `~/.claude.json` local scope (interactive tooling only, not the repo).
ALL keys shared in chat during the build are considered exposed: rotate them before go-live.

## 7. Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Worker exits at boot: "advisory lock" | another worker running | find it (`ps -eo pid,args \| grep tsx`), kill it, restart |
| Worker exits at boot: "REFUSING to run MOCK stubs" | MOCK_MODE=true against real data | use MOCK_MODE=false, or a scratch DATABASE_URL. Do not use the override casually: this guard exists because fixture stubs contaminated real leads twice |
| Leads pile at `discovered`, `scrape.deferred` events | Places daily cap spent | nothing; next day resumes. Raise cap only with billing headroom |
| Lead wedged in `demo_building` >30 min | worker died mid-build | next builder pass auto-fails the stale claim and rebuilds |
| `pagespeed 500: Lighthouse returned error` | Google-side transient | adapter retries x2; persistent failures become an audit finding, not a crash |
| Demo behind a Vercel login wall | SSO protection re-enabled | deploy adapter PATCHes it off; check project settings if it recurs |
| Email stuck `awaiting_approval` | review mode, operator has not acted | approve/reject in /outbox |
| `outreach.blocked` event | no demo URL or unconfirmed agency facts | deploy the demo / fill config/agency-facts.yaml |
| Digest "no worker heartbeat" | worker down | §3 above |

## 8. Data hygiene

- `data/screenshots/`, `data/builds/`, `/tmp/outbox/` are regenerable artifacts, gitignored.
- Real prospect data lives only in Postgres. Test rows use the `ZZ ...` name prefix and `.example`
  emails and are cleaned up by their tests; if you find strays: `delete from leads where company_name like 'ZZ %'`.
- Suppression list and sent-email rows are the legal record. Never bulk-delete `emails`,
  `suppression_list`, or `agent_events`.
