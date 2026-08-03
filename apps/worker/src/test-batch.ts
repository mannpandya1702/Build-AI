// Verifies demo-batch accounting against the live local DB using ZZ test rows.
// SAFETY: refuses to run while the worker is enabled — the test swaps settings.demo_batch around,
// and a running scheduler reading a transient value could admit real leads. It snapshots the
// operator's batch setting and restores it on exit. Dev tool, not part of the worker runtime.
import { closePool, getPool } from "@autopilot/core";
import { demoBatchRemaining } from "./batch.js";

const pool = getPool();
let failures = 0;
function check(name: string, got: unknown, want: unknown) {
  const ok = got === want;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}

async function main() {
  const enabled = await pool.query<{ value: unknown }>(
    "select value from settings where key='worker_enabled'",
  );
  if (String(enabled.rows[0]?.value ?? "false").replace(/"/g, "") === "true") {
    console.error(
      "REFUSING to run: worker is ENABLED. Pause it first (the test mutates settings.demo_batch).",
    );
    process.exit(1);
  }
  const saved = await pool.query<{ value: unknown }>("select value from settings where key='demo_batch'");
  const savedValue = saved.rows[0]?.value;

  // clean slate for ZZ rows
  await pool.query(
    "delete from agent_events where lead_id in (select id from leads where company_name like 'ZZ %')",
  );
  await pool.query("delete from leads where company_name like 'ZZ %'");
  await pool.query("delete from settings where key='demo_batch'");

  // 1. no row -> null (unlimited)
  check("no batch row", await demoBatchRemaining(pool), null);

  // 2. size 0 (cleared) -> null
  await pool.query(
    `insert into settings (key, value) values ('demo_batch', '{"size":0,"started_at":"2026-07-10T00:00:00Z"}')`,
  );
  check("size 0 = cleared", await demoBatchRemaining(pool), null);

  // 3. size 5, nothing used -> 5
  const startedAt = new Date(Date.now() - 60_000).toISOString();
  await pool.query(`update settings set value = $1 where key='demo_batch'`, [
    JSON.stringify({ size: 5, started_at: startedAt }),
  ]);
  check("size 5, 0 used", await demoBatchRemaining(pool), 5);

  // 4. two ZZ leads reach design.ready after started_at -> 3 left
  const leads = await pool.query<{ id: string }>(
    `insert into leads (company_name, industry, city, region, country, source, status)
     values ('ZZ Batch Test A','roofing','Dallas','TX','US','manual','solution_ready'),
            ('ZZ Batch Test B','roofing','Dallas','TX','US','manual','solution_ready'),
            ('ZZ Batch Test C','roofing','Dallas','TX','US','manual','solution_ready')
     returning id`,
  );
  for (const l of leads.rows.slice(0, 2)) {
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

  // 6. an ADMITTED lead (design.admitted, not yet design.ready) consumes a slot: in-flight work
  //    counts, so a late-arriving high scorer can never over-admit (2026-07-11 fix).
  await pool.query(
    "insert into agent_events (agent, lead_id, type, level, message) values ('uiux',$1,'design.admitted','debug','ZZ test admitted')",
    [leads.rows[2].id],
  );
  check("admitted counts as used", await demoBatchRemaining(pool), 2);

  // 7. admitted lead completing (design.ready) does not double-count
  await pool.query(
    "insert into agent_events (agent, lead_id, type, message) values ('uiux',$1,'design.ready','ZZ test complete')",
    [leads.rows[2].id],
  );
  check("admit->ready single count", await demoBatchRemaining(pool), 2);

  // 8. events BEFORE started_at do not count: restart the batch now -> back to full
  await pool.query(`update settings set value = $1 where key='demo_batch'`, [
    JSON.stringify({ size: 2, started_at: new Date(Date.now() + 1_000).toISOString() }),
  ]);
  check("new batch restarts count", await demoBatchRemaining(pool), 2);

  // cleanup + restore the operator's batch setting
  await pool.query(
    "delete from agent_events where lead_id in (select id from leads where company_name like 'ZZ %') or message like 'ZZ test%'",
  );
  await pool.query("delete from leads where company_name like 'ZZ %'");
  if (savedValue === undefined) {
    await pool.query("delete from settings where key='demo_batch'");
  } else {
    await pool.query(
      `insert into settings (key, value) values ('demo_batch', $1)
       on conflict (key) do update set value = excluded.value`,
      [JSON.stringify(savedValue)],
    );
  }
  await closePool();
  console.log(failures ? `\n${failures} FAILURES` : "\nALL PASS");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
