// Demo batch ("build the top N demos first", dashboard Worker card). settings.demo_batch =
// {"size": N, "started_at": iso}. size <= 0 or a missing row means NO batch (unlimited) — clearing
// writes size 0 instead of deleting the row, because the bridge's two-way settings merge has no
// delete tombstone (a deleted hosted row would be resurrected from the local copy).
//
// "Used" = distinct leads with a design.ready event after started_at. Admission happens at the
// uiux trigger (solution_ready): design_ready flows into the builder automatically, so admitting a
// lead there IS committing to build its demo. Counting the immutable event (not lead status) means
// QA-fix re-entries and rebuilds never double-count, and setting a new batch restarts the count
// from that moment ("N more from now").
import type { DbPool } from "@autopilot/core";

/** Remaining demo-batch slots, or null when no batch is active (unlimited). */
export async function demoBatchRemaining(pool: DbPool): Promise<number | null> {
  const s = await pool.query<{ value: { size?: number; started_at?: string } | null }>(
    "select value from settings where key='demo_batch'",
  );
  const v = s.rows[0]?.value;
  const size = Number(v?.size ?? 0);
  if (!v || !Number.isFinite(size) || size <= 0) return null;
  const used = await pool.query<{ n: string }>(
    "select count(distinct lead_id)::text n from agent_events where type='design.ready' and created_at > $1",
    [v.started_at ?? "1970-01-01T00:00:00Z"],
  );
  return size - Number(used.rows[0].n);
}
