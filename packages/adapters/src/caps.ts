// Cap enforcement (spec §4.5): counters ride on agent_events; hitting a cap pauses that resource
// and notifies the operator. Never silently drops work.
import { getPool, emitEvent, notifyOperator } from "@autopilot/core";
import { loadCaps } from "./config.js";

export class CapExceededError extends Error {
  constructor(public resource: string, public cap: number) {
    super(`cap exceeded: ${resource} (${cap}/day)`);
  }
}

/** Count today's usage events for a metered resource (e.g. type='places.call'). */
export async function usedToday(eventType: string): Promise<number> {
  const r = await getPool().query<{ n: string }>(
    `select count(*)::text as n from agent_events where type = $1 and created_at >= date_trunc('day', now())`,
    [eventType],
  );
  return parseInt(r.rows[0].n, 10);
}

export async function checkPlacesCap(): Promise<void> {
  const caps = loadCaps();
  const used = await usedToday("places.call");
  if (used >= caps.places_calls_per_day) {
    await emitEvent({ agent: "caps", level: "warn", type: "cap.hit", message: `places_calls_per_day (${caps.places_calls_per_day})` });
    await notifyOperator({ type: "cap_hit", title: "Places API daily cap hit", body: `Used ${used}/${caps.places_calls_per_day}. Discovery paused until tomorrow.` });
    throw new CapExceededError("places_calls_per_day", caps.places_calls_per_day);
  }
}

export async function meterPlacesCall(what: string): Promise<void> {
  await emitEvent({ agent: "places", level: "debug", type: "places.call", message: what });
}

export async function anthropicSpendToday(): Promise<number> {
  const r = await getPool().query<{ s: string | null }>(
    `select coalesce(sum(cost_usd),0)::text as s from agent_events where cost_usd is not null and created_at >= date_trunc('day', now())`,
  );
  return parseFloat(r.rows[0].s ?? "0");
}
