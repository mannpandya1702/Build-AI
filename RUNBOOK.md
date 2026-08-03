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

## 2b. Deploy the dashboard to Vercel (public webhook + hosted DB)

The dashboard needs a HOSTED Postgres (a Vercel deployment cannot reach a laptop/container DB).
ENV NOTE: this dev container blocks raw TCP :5432 egress, so use **Neon** (Postgres over
HTTPS/WebSocket on :443) — the db seams auto-detect a `*.neon.tech` URL. Supabase becomes viable
once the worker lives on a VPS with normal egress.

1. Create a free Neon project (neon.tech, ~2 min), copy its connection string.
2. Run `./scripts/deploy-dashboard.sh "<neon url>"`. It migrates the hosted DB, copies local data
   (skip-if-present, safe to re-run), deploys `apps/dashboard` with Vercel deployment protection
   ON (the CRM must never be public without auth), sets env, mints a Protection Bypass secret,
   and prints the Cal.com Subscriber URL (webhook route + bypass token).
3. Switch `.env.local` `DATABASE_URL` to the Neon URL and restart the worker, so the worker and
   the deployed dashboard share one database.
4. Paste the printed Subscriber URL into Cal.com (triggers: Booking created + Booking canceled;
   Secret: the CALCOM_WEBHOOK_SECRET value from .env.local).

## 3. Container/host restarted. What do I do?

In remote (Claude Code web) sessions this is AUTOMATIC: the SessionStart hook
(`.claude/hooks/session-start.sh`) starts postgres and `scripts/worker-supervisor.sh` on every
session start, and the supervisor keeps one worker alive (liveness = the postgres advisory lock;
it terminates zombie lock sessions with stale heartbeats and restarts). Caveat: the hook fires on
session START — if the container is reclaimed while nobody is talking to the session, the worker
stays down until the next message/session. The worker still BOOTS PAUSED and honors the dashboard
toggle. The permanent fix for 24/7 uptime is the VPS deploy (§2): this container is a build
environment, not a server.

Manual bring-up (local dev, or if the hook is unavailable):
```bash
service postgresql start
cd apps/worker && MOCK_MODE=false pnpm dev     # (or MOCK_MODE=true for fixture work)
cd apps/dashboard && pnpm dev
```

The worker BOOTS PAUSED (settings.worker_enabled, default false): it heartbeats, bridges, and
monitors, but schedules no pipeline work and completes queued jobs as no-ops until the operator
flips the sidebar Worker toggle to Running (dashboard, local or hosted; hosted toggles reach the
worker via the bridge within ~1 minute). Pause = stop new work + drop queued jobs safely (the
scheduler re-derives all work from lead status on resume). The dashboard cannot START a dead
process — if the switch shows Offline, run the commands above on the host.
The Worker card also holds the DEMO LIMIT ("build the top N demos first"): with a limit set, only
the N best-scored leads get admitted into design+build, then admission stops until the operator
sets a new number (setting one restarts the count from that moment; clear = no limit). Final
builds for signed deals are never gated by it.
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
- Outreach mailbox (OPERATOR DECISION 2026-07-11): mann@tradecraftsites.com — the main-domain
  mailbox IS the outreach sender. Verified: Resend domain auth passes, DMARC p=quarantine live.
  The trade-off accepted: cold-email complaints/bounces hit the primary domain's reputation, so
  caps run a warm-up ramp (10/day now; raise toward 25 after ~2 clean weeks, checking bounce and
  complaint rates in Resend before each raise). Revisit a dedicated outreach domain + extra
  mailboxes if volume grows past one mailbox's safe ceiling (~25/day).

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
| Approved an email, nothing sent | worker paused/offline (approvals execute only while Running), or the gate refused (no contact email, suppression, caps) | /outbox shows it under "Approved, waiting to send" or "Blocked" with the reason; fix the cause, or re-draft after adding a contact email |
| `outreach.blocked` event | no demo URL or unconfirmed agency facts | deploy the demo / fill config/agency-facts.yaml |
| Digest "no worker heartbeat" | worker down | §3 above |

## 8. Data hygiene

- `data/screenshots/`, `data/builds/`, `/tmp/outbox/` are regenerable artifacts, gitignored.
- Real prospect data lives only in Postgres. Test rows use the `ZZ ...` name prefix and `.example`
  emails and are cleaned up by their tests; if you find strays: `delete from leads where company_name like 'ZZ %'`.
- The bridge up-sync has NO delete tombstone: deleting a row locally leaves its hosted copy alive
  (2026-07-10: two locally-reverted drafts stayed in the hosted Outbox and got approved into a dead
  end). Any manual local delete of a bridged table must delete the hosted row in the same session.
- Suppression list and sent-email rows are the legal record. Never bulk-delete `emails`,
  `suppression_list`, or `agent_events`.
