// Demo batch ("build the top N demos first", dashboard Worker card). settings.demo_batch =
// {"size": N, "started_at": iso}. size <= 0 or a missing row means NO batch (unlimited) — clearing
// writes size 0 instead of deleting the row, because the bridge's two-way settings merge has no
// delete tombstone (a deleted hosted row would be resurrected from the local copy).
//
// Accounting is ADMISSION-time, not completion-time: the scheduler emits a design.admitted event
// the moment it enqueues a lead under a batch, and "used" counts distinct leads with an admitted
// OR completed (design.ready) event after started_at. Completion-only counting left a window where
// a newly qualified high scorer could slip in while admitted leads were still in flight — observed
// live on 2026-07-11: batch of 5 admitted 7. Counting admissions closes that window; design.ready
// stays in the count so pre-fix batches and no-batch-era completions are never re-admitted.
import type { DbPool } from "@autopilot/core";

export interface DemoBatch {
  size: number;
  startedAt: string;
  used: number;
}

/** Active batch state, or null when no batch is set (unlimited). */
export async function readDemoBatch(pool: DbPool): Promise<DemoBatch | null> {
  const s = await pool.query<{ value: { size?: number; started_at?: string } | null }>(
    "select value from settings where key='demo_batch'",
  );
  const v = s.rows[0]?.value;
  const size = Number(v?.size ?? 0);
  if (!v || !Number.isFinite(size) || size <= 0) return null;
  const startedAt = v.started_at ?? "1970-01-01T00:00:00Z";
  const used = await pool.query<{ n: string }>(
    "select count(distinct lead_id)::text n from agent_events where type in ('design.admitted','design.ready') and created_at > $1",
    [startedAt],
  );
  return { size, startedAt, used: Number(used.rows[0].n) };
}

/** Remaining demo-batch slots, or null when no batch is active (unlimited). */
export async function demoBatchRemaining(pool: DbPool): Promise<number | null> {
  const b = await readDemoBatch(pool);
  return b ? b.size - b.used : null;
}
