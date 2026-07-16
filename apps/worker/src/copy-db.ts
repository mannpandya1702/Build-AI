// One-shot data copy: local dev Postgres -> hosted Postgres (Neon), used at dashboard go-live.
// Schema must already exist on the target (run `DATABASE_URL=<target> pnpm migrate` first).
// FK-safe table order. Batched multi-row INSERTs (per-row round-trips over HTTPS are ~100ms each;
// batching makes the copy minutes -> seconds). Idempotent: `on conflict do nothing` everywhere and
// a table is skipped only when source and target counts already MATCH, so a re-run after a partial
// failure resumes cleanly instead of skipping a half-copied table. Usage:
//   pnpm exec tsx src/copy-db.ts "<target DATABASE_URL>"   (source = DATABASE_URL from .env.local)
import { closePool, createPoolForUrl, getPool } from "@autopilot/core";

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('usage: tsx src/copy-db.ts "<target DATABASE_URL>"');
  process.exit(1);
}

const src = getPool();
const dst = createPoolForUrl(targetUrl, 4);

// FK-safe order (looks before designs, builds before qa_reports, sequences+emails before replies).
const TABLES = [
  "looks",
  "leads",
  "audits",
  "solutions",
  "designs",
  "builds",
  "qa_reports",
  "email_sequences",
  "emails",
  "replies",
  "meetings",
  "suppression_list",
  "notifications",
  "agent_events",
  "daily_reports",
  "settings",
] as const;

const READ_BATCH = 1000;
const WRITE_BATCH = 100;

for (const table of TABLES) {
  const srcCount = Number(
    (await src.query<{ n: string }>(`select count(*)::text n from ${table}`)).rows[0].n,
  );
  const dstCount = Number(
    (await dst.query<{ n: string }>(`select count(*)::text n from ${table}`)).rows[0].n,
  );
  if (srcCount === dstCount) {
    console.log(`SKIP  ${table}: counts already match (${srcCount})`);
    continue;
  }
  const cols = (
    await src.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name=$1 and table_schema='public' order by ordinal_position`,
      [table],
    )
  ).rows.map((r) => r.column_name);

  let offset = 0;
  let written = 0;
  while (offset < srcCount) {
    const rows = (
      await src.query(
        `select * from ${table} order by created_at asc, id asc limit ${READ_BATCH} offset ${offset}`,
      )
    ).rows;
    if (rows.length === 0) break;
    for (let i = 0; i < rows.length; i += WRITE_BATCH) {
      const chunk = rows.slice(i, i + WRITE_BATCH);
      const params: unknown[] = [];
      const tuples = chunk.map((row, r) => {
        const ph = cols.map((c, j) => {
          const v = (row as Record<string, unknown>)[c];
          params.push(v !== null && typeof v === "object" && !(v instanceof Date) ? JSON.stringify(v) : v);
          return `$${r * cols.length + j + 1}`;
        });
        return `(${ph.join(",")})`;
      });
      await dst.query(
        `insert into ${table} (${cols.join(",")}) values ${tuples.join(",")} on conflict do nothing`,
        params,
      );
      written += chunk.length;
    }
    offset += rows.length;
  }
  const finalDst = Number(
    (await dst.query<{ n: string }>(`select count(*)::text n from ${table}`)).rows[0].n,
  );
  console.log(
    `OK    ${table}: source=${srcCount} target=${finalDst}${finalDst === srcCount ? "" : "  <-- MISMATCH"}`,
  );
}

const a = (await src.query<{ n: string }>("select count(*)::text n from leads")).rows[0].n;
const b = (await dst.query<{ n: string }>("select count(*)::text n from leads")).rows[0].n;
console.log(
  `\nleads: source=${a} target=${b} ${a === b ? "MATCH" : "MISMATCH — investigate before switching DATABASE_URL"}`,
);
await dst.end();
await closePool();
