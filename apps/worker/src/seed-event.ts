// Phase 0 acceptance helper: seed a test event and confirm it lands in agent_events.
import { closePool, emitEvent, getPool } from "@autopilot/core";

const pool = getPool();
await emitEvent({
  agent: "seed",
  type: "system.seed",
  message: "Phase 0 seeded test event",
  payload: { phase: 0 },
});
const r = await pool.query(
  "select agent, type, message, created_at from agent_events order by created_at desc limit 3",
);
console.table(r.rows);
await closePool();
