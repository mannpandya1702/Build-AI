// Seed the `looks` table from the @autopilot/blocks registry (spec §5 data model). Idempotent:
// upserts on (preset, name) so re-running never duplicates. Run once after migrate; re-run when the
// looks registry changes.
import { getPool, closePool } from "@autopilot/core";
import { LOOKS } from "@autopilot/blocks";

const pool = getPool();
let n = 0;
for (const l of LOOKS) {
  await pool.query(
    `insert into looks (preset, name, palette, type_pairing, hero_variant)
     values ($1,$2,$3,$4,$5)
     on conflict (preset, name) do update set
       palette = excluded.palette, type_pairing = excluded.type_pairing, hero_variant = excluded.hero_variant`,
    [l.preset, l.name, JSON.stringify(l.palette), JSON.stringify(l.typePairing), l.heroVariant],
  );
  n++;
}
const r = await pool.query<{ preset: string; c: string }>("select preset, count(*)::text c from looks group by preset order by preset");
console.log(`seeded ${n} looks:`);
console.table(r.rows);
await closePool();
