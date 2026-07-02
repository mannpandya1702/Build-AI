// Event bus (spec §2.5): every agent writes structured rows to agent_events. The dashboard,
// monitor, and notifications are consumers of this one stream. No silent work anywhere.
import { getPool } from "./db.js";

export type EventLevel = "debug" | "info" | "warn" | "error";

export interface AgentEvent {
  agent: string;
  leadId?: string | null;
  level?: EventLevel;
  type: string; // e.g. "lead.qualified", "build.deployed", "email.sent"
  message?: string;
  payload?: Record<string, unknown>;
  costUsd?: number | null;
}

export async function emitEvent(e: AgentEvent): Promise<void> {
  const pool = getPool();
  await pool.query(
    `insert into agent_events (agent, lead_id, level, type, message, payload, cost_usd)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [e.agent, e.leadId ?? null, e.level ?? "info", e.type, e.message ?? null, JSON.stringify(e.payload ?? {}), e.costUsd ?? null],
  );
}

export async function notifyOperator(input: {
  type: string;
  title: string;
  body?: string;
  leadId?: string | null;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `insert into notifications (type, title, body, lead_id) values ($1,$2,$3,$4)`,
    [input.type, input.title, input.body ?? null, input.leadId ?? null],
  );
}
