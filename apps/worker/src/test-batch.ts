// Verifies demoBatchRemaining accounting against the live local DB using ZZ test rows.
// Never enables the worker; cleans up after itself.
// NOTE: it deletes settings.demo_batch while running, so an operator-set batch limit is cleared;
// re-set it from the dashboard afterwards. Dev tool, not part of the worker runtime.
import { getPool, closePool } from "@autopilot/core";
import { demoBatchRemaining } from "./batch.js";

const pool = getPool();
let failures = 0;
function check(name: string, got: unknown, want: unknown) {
  const ok = got === want;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

async function main() {
  // clean slate
  await pool.query("delete from agent_events where lead_id in (select id from leads where company_name like 'ZZ %')");
  await pool.query("delete from leads where company_name like 'ZZ %'");
  await pool.query("delete from settings where key='demo_batch'");

  // 1. no row -> null (unlimited)
  check("no batch row", await demoBatchRemaining(pool), null);

  // 2. size 0 (cleared) -> null
  await pool.query(`insert into settings (key, value) values ('demo_batch', '{"size":0,"started_at":"2026-07-10T00:00:00Z"}')`);
  check("size 0 = cleared", await demoBatchRemaining(pool), null);

  // 3. size 5, nothing used -> 5
  const startedAt = new Date(Date.now() - 60_000).toISOString();
  await pool.query(
    `update settings set value = $1 where key='demo_batch'`,
    [JSON.stringify({ size: 5, started_at: startedAt })],
  );
  check("size 5, 0 used", await demoBatchRemaining(pool), 5);

  // 4. two ZZ leads reach design.ready after started_at -> 3 left
  const leads = await pool.query<{ id: string }>(
    `insert into leads (company_name, industry, city, region, country, source, status)
     values ('ZZ Batch Test A','roofing','Dallas','TX','US','manual','solution_ready'),
            ('ZZ Batch Test B','roofing','Dallas','TX','US','manual','solution_ready')
     returning id`,
  );
  for (const l of leads.rows) {
    await pool.query(
      "insert into agent_events (agent, lead_id, type, message) values ('uiux',$1,'design.ready','ZZ test')",
      [l.id],
    );
  }
  check("size 5, 2 used", await demoBatchRemaining(pool), 3);

  // 5. duplicate design.ready for the same lead (QA re-entry / rebuild) does NOT double-count
  await pool.query(
    "insert into agent_events (agent, lead_id, type, message) values ('uiux',$1,'design.ready','ZZ test rebuild')",
    [leads.rows[0].id],
  );
  check("rebuild not double-counted", await demoBatchRemaining(pool), 3);

  // 6. events BEFORE started_at do not count: restart the batch now -> back to full
  await pool.query(
    `update settings set value = $1 where key='demo_batch'`,
    [JSON.stringify({ size: 2, started_at: new Date(Date.now() + 1_000).toISOString() })],
  );
  check("new batch restarts count", await demoBatchRemaining(pool), 2);

  // cleanup
  await pool.query("delete from agent_events where lead_id in (select id from leads where company_name like 'ZZ %') or message like 'ZZ test%'");
  await pool.query("delete from leads where company_name like 'ZZ %'");
  await pool.query("delete from settings where key='demo_batch'");
  await closePool();
  console.log(failures ? `\n${failures} FAILURES` : "\nALL PASS");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
