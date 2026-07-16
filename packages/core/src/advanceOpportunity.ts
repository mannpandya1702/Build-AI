import { getPool } from "./db.js";
// advanceOpportunity (MASTER_SPEC §8.4): the single legal way to move an opportunity through its
// lifecycle. Same guarantees as advanceLead — transactional, row-locked, illegal transitions rejected
// and logged. Every transition writes an agent_events row (carrying the opportunity + its lead).
import { emitEvent } from "./events.js";
import { type OpportunityStatus, canTransitionOpportunity } from "./opportunityStatuses.js";

export class IllegalOpportunityTransitionError extends Error {
  constructor(
    public from: OpportunityStatus,
    public to: OpportunityStatus,
    public opportunityId: string,
  ) {
    super(`illegal opportunity transition ${from} -> ${to} (opportunity ${opportunityId})`);
  }
}

export async function advanceOpportunity(
  opportunityId: string,
  to: OpportunityStatus,
  opts: { agent: string; reason?: string } = { agent: "system" },
): Promise<{ from: OpportunityStatus; to: OpportunityStatus; leadId: string | null }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const cur = await client.query<{ status: OpportunityStatus; lead_id: string | null }>(
      "select status, lead_id from opportunities where id = $1 for update",
      [opportunityId],
    );
    if (cur.rowCount === 0) throw new Error(`opportunity ${opportunityId} not found`);
    const from = cur.rows[0].status;
    const leadId = cur.rows[0].lead_id;

    if (from === to) {
      await client.query("rollback"); // idempotent no-op: retried jobs may re-advance
      return { from, to, leadId };
    }
    if (!canTransitionOpportunity(from, to)) {
      await client.query("rollback");
      await emitEvent({
        agent: opts.agent,
        leadId,
        level: "error",
        type: "opportunity.transition_rejected",
        message: `illegal transition ${from} -> ${to}`,
        payload: { opportunityId, from, to, reason: opts.reason },
      });
      throw new IllegalOpportunityTransitionError(from, to, opportunityId);
    }

    await client.query("update opportunities set status = $1 where id = $2", [to, opportunityId]);
    await client.query(
      `insert into agent_events (agent, lead_id, level, type, message, payload)
       values ($1,$2,'info','opportunity.status_changed',$3,$4)`,
      [
        opts.agent,
        leadId,
        `${from} -> ${to}`,
        JSON.stringify({ opportunityId, from, to, reason: opts.reason }),
      ],
    );
    await client.query("commit");
    return { from, to, leadId };
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
