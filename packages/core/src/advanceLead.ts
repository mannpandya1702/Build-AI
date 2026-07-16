// advanceLead (spec §5): the single legal way to move a lead through the pipeline.
// Illegal transitions throw AND emit an error event. Every transition writes an event row.
import { getPool } from "./db.js";
import { emitEvent } from "./events.js";
import { type LeadStatus, canTransition } from "./statuses.js";

export class IllegalTransitionError extends Error {
  constructor(
    public from: LeadStatus,
    public to: LeadStatus,
    public leadId: string,
  ) {
    super(`illegal lead transition ${from} -> ${to} (lead ${leadId})`);
  }
}

export async function advanceLead(
  leadId: string,
  to: LeadStatus,
  opts: { agent: string; reason?: string } = { agent: "system" },
): Promise<{ from: LeadStatus; to: LeadStatus }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const cur = await client.query<{ status: LeadStatus }>(
      "select status from leads where id = $1 for update",
      [leadId],
    );
    if (cur.rowCount === 0) throw new Error(`lead ${leadId} not found`);
    const from = cur.rows[0].status;

    if (from === to) {
      await client.query("rollback"); // idempotent no-op: retried jobs may re-advance
      return { from, to };
    }
    if (!canTransition(from, to)) {
      await client.query("rollback");
      await emitEvent({
        agent: opts.agent,
        leadId,
        level: "error",
        type: "lead.transition_rejected",
        message: `illegal transition ${from} -> ${to}`,
        payload: { from, to, reason: opts.reason },
      });
      throw new IllegalTransitionError(from, to, leadId);
    }

    await client.query("update leads set status = $1 where id = $2", [to, leadId]);
    await client.query(
      `insert into agent_events (agent, lead_id, level, type, message, payload)
       values ($1,$2,'info','lead.status_changed',$3,$4)`,
      [opts.agent, leadId, `${from} -> ${to}`, JSON.stringify({ from, to, reason: opts.reason })],
    );
    await client.query("commit");
    return { from, to };
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
