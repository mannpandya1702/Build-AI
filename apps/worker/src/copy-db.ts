// One-shot data copy: local dev Postgres -> hosted Postgres (Neon), used at dashboard go-live.
// Schema must already exist on the target (run `DATABASE_URL=<target> pnpm migrate` first).
// FK-safe table order; idempotent-ish (skips a table whose target already has rows, so a re-run
// after a partial failure never duplicates). Usage:
//   pnpm exec tsx src/copy-db.ts "<target DATABASE_URL>"   (source = DATABASE_URL from .env.local)
import { getPool, closePool, createPoolForUrl } from "@autopilot/core";

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('usage: tsx src/copy-db.ts "<target DATABASE_URL>"');
  process.exit(1);
}

const src = getPool();
const dst = createPoolForUrl(targetUrl, 4);

// FK-safe order (looks before designs, builds before qa_reports, sequences+emails before replies).
const TABLES = [
  "looks", "leads", "audits", "solutions", "designs", "builds", "qa_reports",
  "email_sequences", "emails", "replies", "meetings", "suppression_list",
  "notifications", "agent_events", "daily_reports", "settings",
] as const;

const BATCH = 500;

for (const table of TABLES) {
  const already = await dst.query<{ n: string }>(`select count(*)::text n from ${table}`);
  if (already.rows[0].n !== "0") {
    console.log(`SKIP  ${table}: target already has ${already.rows[0].n} rows`);
    continue;
  }
  const cols = (await src.query<{ column_name: string }>(
    `select column_name from information_schema.columns where table_name=$1 and table_schema='public' order by ordinal_position`,
    [table],
  )).rows.map((r) => r.column_name);
  const total = Number((await src.query<{ n: string }>(`select count(*)::text n from ${table}`)).rows[0].n);
  let copied = 0;
  while (copied < total) {
    const rows = (await src.query(`select * from ${table} order by created_at asc limit ${BATCH} offset ${copied}`)).rows;
    if (rows.length === 0) break;
    for (const row of rows) {
      const vals = cols.map((c) => {
        const v = (row as Record<string, unknown>)[c];
        return v !== null && typeof v === "object" && !(v instanceof Date) ? JSON.stringify(v) : v;
      });
      const params = cols.map((_, i) => `$${i + 1}`).join(",");
      await dst.query(`insert into ${table} (${cols.join(",")}) values (${params}) on conflict do nothing`, vals);
    }
    copied += rows.length;
  }
  console.log(`OK    ${table}: ${copied}/${total} rows`);
}

// sanity: leads count must match
const a = (await src.query<{ n: string }>("select count(*)::text n from leads")).rows[0].n;
const b = (await dst.query<{ n: string }>("select count(*)::text n from leads")).rows[0].n;
console.log(`\nleads: source=${a} target=${b} ${a === b ? "MATCH" : "MISMATCH — investigate before switching DATABASE_URL"}`);
await dst.end();
await closePool();
