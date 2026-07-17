// Opportunity creation (MASTER_SPEC §8.3). Called once a lead is real (qualified): ensure its website
// opportunity exists + is projected from lead_status, and create any expansion lines detection turned
// up. This is the CALL SITE that gives the dispatch spine real inputs — without it, only backfilled
// website opportunities exist and nothing carries chatbot/voice/automation.

import { getPool } from "./db.js";
import { type BusinessSignals, detectServiceOpportunities } from "./detectServiceOpportunities.js";
import { emitEvent } from "./events.js";
import type { LeadStatus } from "./statuses.js";
import { websiteOpportunityStatusFor } from "./websiteOpportunityStatus.js";

export interface EnsureOpportunitiesResult {
  /** expansion service_types newly created this call (idempotent — empty on a repeat) */
  created: string[];
  /** the website opportunity's projected status */
  websiteStatus: string;
}

/**
 * Ensure the lead's service opportunities exist. The website line is upserted at its projected status
 * (kept in sync with lead_status on every call); expansion lines are inserted at `identified` and
 * never reset (do nothing on conflict), so the hold/lifecycle already in flight is preserved. Emits
 * `opportunity.detected` when new expansion lines are created.
 */
export async function ensureServiceOpportunities(
  leadId: string,
  signals: BusinessSignals,
  opts: { leadStatus: LeadStatus; score: number | null; agent?: string },
): Promise<EnsureOpportunitiesResult> {
  const pool = getPool();
  const detected = detectServiceOpportunities(signals);
  const websiteStatus = websiteOpportunityStatusFor(opts.leadStatus);

  // Website line: always present, mirrors lead_status (do update keeps it synced if re-called).
  await pool.query(
    `insert into opportunities (lead_id, service_type, status, score)
     values ($1, 'website', $2::opportunity_status, $3)
     on conflict (lead_id, service_type) do update set status = excluded.status, score = excluded.score`,
    [leadId, websiteStatus, opts.score],
  );

  // Expansion lines: create at 'identified', never disturb one already advancing (do nothing).
  const created: string[] = [];
  for (const d of detected) {
    if (d.service_type === "website") continue;
    const res = await pool.query(
      `insert into opportunities (lead_id, service_type, status)
       values ($1, $2::service_type, 'identified')
       on conflict (lead_id, service_type) do nothing`,
      [leadId, d.service_type],
    );
    if ((res.rowCount ?? 0) > 0) created.push(d.service_type);
  }

  if (created.length > 0) {
    await emitEvent({
      agent: opts.agent ?? "system",
      leadId,
      type: "opportunity.detected",
      level: "info",
      message: `expansion lines identified: ${created.join(", ")}`,
      payload: { created, website_status: websiteStatus },
    });
  }

  return { created, websiteStatus };
}
