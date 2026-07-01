# web-studio

Pipeline for a one-person web studio: find local businesses, qualify them, build a live demo site
from their real Google data, and draft outreach in the founder's voice. The whole thing runs on the
operating contract in [`CLAUDE.md`](./CLAUDE.md). This scaffold was bootstrapped per
[`SETUP.md`](./SETUP.md).

Current target: **roofers** in **Dallas, TX** (see `config.ts`).

## The loop

```
FIND → QUALIFY → BUILD DEMO → DRAFT OUTREACH → FOLLOW UP → CLOSE → TRACK
```

## Setup

1. Install deps: `npm install`
2. Paste rotated keys into `.env.local` (gitignored, never committed):
   ```
   GOOGLE_PLACES_API_KEY=...
   VERCEL_TOKEN=...
   ```
3. Fill the studio-identity fields in `config.ts` (they read as `[NEEDS: ...]` until you do). These
   block the first email/deploy, not the build.

## Commands

| Command | What it does |
|---|---|
| `npm run find` | Places API (New) search + score, writes `data/leads.json`. First run samples 20 and prints a cost check; add `-- --confirm-cost` to scale. |
| `npm run build-demo <place_id>` | Fills `templates/roofers` with the lead's real data, runs the QA/security pass, then deploys (refuses on the first deploy until `-- --confirm-deploy`). |
| `npm run draft <place_id>` | Touch-1 email + call script in the founder's voice. Refuses to finalize the email until CAN-SPAM identity fields are set. |
| `npm run run-niche` | The full loop across every qualified lead. |
| `npm run typecheck` | `tsc --noEmit` over the pipeline. |

## Layout

- `config.ts` — single source of config (targeting, identity, cost guardrails).
- `src/discovery/` — Places client, scoring rubric (CLAUDE.md §4), the `find` entrypoint.
- `src/crm/leads.ts` — zod-validated lead store, deduped by `place_id`.
- `src/demo/` — demo generator, QA pass (CLAUDE.md §5e), Vercel deploy.
- `src/outreach/draft.ts` — outreach drafter (CLAUDE.md §6, §7).
- `templates/roofers/` — the reusable Next.js + Tailwind + Framer Motion demo template.

## Guardrails

Keys live only in `.env.local`. Nothing is fabricated: missing facts become `[NEEDS: ...]`
placeholders, never invented. Nothing deploys or sends silently on first use.
