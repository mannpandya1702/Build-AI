// File-based migration runner (spec §4.8: migrations are files, never dashboard mutations).
// Applies /supabase/migrations/*.sql in filename order, exactly once each.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool } from "./db.js";

const MIGRATIONS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../../supabase/migrations");

async function main(): Promise<void> {
  const pool = getPool();
  await pool.query(
    "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set(
    (await pool.query<{ name: string }>("select name from _migrations")).rows.map((r) => r.name),
  );
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    if (applied.has(f)) {
      console.log(`skip  ${f}`);
      continue;
    }
    const sql = readFileSync(resolve(MIGRATIONS_DIR, f), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into _migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log(`apply ${f}`);
    } catch (err) {
      await client.query("rollback");
      throw new Error(`migration ${f} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
  await closePool();
  console.log("migrations up to date");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
