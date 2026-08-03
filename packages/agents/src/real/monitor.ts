import { MOCK, anthropicSpendToday, llm, loadCaps, sendsToday, usedToday } from "@autopilot/adapters";
// Monitoring Agent (spec §6.10). Hourly: anomaly checks (lead stuck >6h in a non-terminal status,
// error spike >5/hour, cap exhaustion, worker heartbeat missing) -> operator notification, deduped
// so the same anomaly does not re-alert every hour. Daily (09:00 IST): a digest into daily_reports
// with funnel counts, emails sent/replied, calls due vs logged, meetings, demos shipped, spend
// (reconciled from agent_events.cost_usd), and anomalies; written in the contract's §11 voice
// (concise, technical, no fluff, no emojis) and ALWAYS ending with the single highest-value lead
// and the single top blocker. Numbers come from SQL, never the model; Haiku only phrases the
// narrative line and falls back to a deterministic sentence, so the digest never fabricates.
import { emitEvent, getPool, notifyOperator } from "@autopilot/core";

interface Anomaly {
  kind: string;
  detail: string;
  leadId?: string;
  leadIds?: string[];
}

/** Detect anomalies. Pure read; the caller decides notification/dedupe. */
export async function detectAnomalies(): Promise<Anomaly[]> {
  const pool = getPool();
  const out: Anomaly[] = [];

  // Leads stuck >6h in a non-terminal status. awaiting_approval/outreach_ready wait on the
  // OPERATOR by design, so they get a gentler 24h bar instead of 6h. Many leads stuck at once is
  // ONE systemic condition (a stalled pipeline), so it groups into a single anomaly: 31 separate
  // notifications for one stalled queue is spam, not signal (surfaced by the Phase 6 test run,
  // where 31 leads sat in `discovered` behind a spent Places cap).
  const stuck = await pool.query<{ id: string; company_name: string; status: string; hours: string }>(
    `select id, company_name, status, round(extract(epoch from (now() - updated_at))/3600)::text as hours
     from leads
     where status not in ('disqualified','closed_lost','delivered','suppressed','nurture')
       and updated_at < now() - (case when status in ('awaiting_approval','outreach_ready','contacted','replied','negotiating','meeting_booked','delivery_approval') then interval '24 hours' else interval '6 hours' end)
     order by updated_at asc limit 200`,
  );
  if (stuck.rows.length === 1) {
    const l = stuck.rows[0];
    out.push({
      kind: "lead_stuck",
      detail: `${l.company_name} stuck in ${l.status} for ${l.hours}h`,
      leadId: l.id,
      leadIds: [l.id],
    });
  } else if (stuck.rows.length > 1) {
    const byStatus = new Map<string, number>();
    for (const l of stuck.rows) byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
    const statuses = [...byStatus.entries()].map(([s, n]) => `${s} ${n}`).join(", ");
    const oldest = stuck.rows
      .slice(0, 3)
      .map((l) => `${l.company_name} (${l.status} ${l.hours}h)`)
      .join("; ");
    out.push({
      kind: "lead_stuck",
      detail: `${stuck.rows.length} leads stuck past their bar (${statuses}). Oldest: ${oldest}`,
      leadIds: stuck.rows.map((l) => l.id),
    });
  }

  // Error spike: >5 error events in the last hour.
  const errs = await pool.query<{ n: string }>(
    "select count(*)::text n from agent_events where level='error' and created_at > now() - interval '1 hour'",
  );
  if (Number.parseInt(errs.rows[0].n, 10) > 5)
    out.push({ kind: "error_spike", detail: `${errs.rows[0].n} error events in the last hour` });

  // Cap exhaustion (Places / sends / Anthropic budget).
  const caps = loadCaps();
  const places = await usedToday("places.call");
  if (places >= caps.places_calls_per_day)
    out.push({
      kind: "cap_exhausted",
      detail: `Places daily cap spent (${places}/${caps.places_calls_per_day})`,
    });
  const sends = await sendsToday();
  if (sends >= caps.total_daily_sends)
    out.push({
      kind: "cap_exhausted",
      detail: `daily send cap reached (${sends}/${caps.total_daily_sends})`,
    });
  const spend = await anthropicSpendToday();
  if (spend >= caps.anthropic_usd_per_day)
    out.push({
      kind: "cap_exhausted",
      detail: `Anthropic daily budget spent ($${spend.toFixed(2)}/$${caps.anthropic_usd_per_day})`,
    });

  // Worker heartbeat missing (>5 min since the last one; heartbeats fire every 60s).
  const hb = await pool.query<{ n: string }>(
    "select count(*)::text n from agent_events where type='worker.heartbeat' and created_at > now() - interval '5 minutes'",
  );
  if (hb.rows[0].n === "0")
    out.push({ kind: "heartbeat_missing", detail: "no worker heartbeat in 5+ minutes" });

  return out;
}

/** Hourly check: detect + notify, deduped per stable key per 12h so alerts don't spam. The key
 *  ignores the hour counters inside the detail text (which grow every run); a grouped lead_stuck
 *  anomaly re-alerts only when its COUNT changes (new information), not when the clock ticks. */
export async function hourly(): Promise<void> {
  const pool = getPool();
  const anomalies = await detectAnomalies();
  for (const a of anomalies) {
    const dedupeKey =
      a.kind === "lead_stuck"
        ? `lead_stuck:${a.leadIds?.length ?? 1}:${a.leadId ?? ""}`
        : `${a.kind}:${a.detail.replace(/\d+/g, "#")}`;
    const dupe = await pool.query<{ n: string }>(
      "select count(*)::text n from agent_events where type='anomaly' and payload->>'dedupe_key'=$1 and created_at > now() - interval '12 hours'",
      [dedupeKey],
    );
    if (dupe.rows[0].n !== "0") continue;
    await emitEvent({
      agent: "monitor",
      leadId: a.leadId ?? null,
      level: "warn",
      type: "anomaly",
      message: `${a.kind}: ${a.detail}`,
      payload: { dedupe_key: dedupeKey, lead_ids: a.leadIds ?? [] },
    });
    await notifyOperator({ type: "anomaly", title: a.detail, leadId: a.leadId });
  }
  await emitEvent({
    agent: "monitor",
    level: "debug",
    type: "monitor.hourly",
    message: `${anomalies.length} anomalies`,
  });
}

/** Build + store the daily digest. Idempotent per date (re-running a day updates it). */
export async function dailyDigest(dateISO?: string): Promise<string> {
  const pool = getPool();
  const day = dateISO ?? new Date().toISOString().slice(0, 10);

  const funnel = (
    await pool.query<{ status: string; n: number }>(
      "select status::text, count(*)::int n from leads group by status order by count(*) desc",
    )
  ).rows;
  const emailsSent = (
    await pool.query<{ n: string }>(
      "select count(*)::text n from emails where direction='outbound' and status='sent' and sent_at::date = $1::date",
      [day],
    )
  ).rows[0].n;
  const replies = (
    await pool.query<{ n: string }>(
      "select count(*)::text n from emails where direction='inbound' and created_at::date = $1::date",
      [day],
    )
  ).rows[0].n;
  const callsDue = (
    await pool.query<{ n: string }>("select count(*)::text n from leads where status='contacted'")
  ).rows[0].n;
  const callsLogged = (
    await pool.query<{ n: string }>(
      "select count(*)::text n from agent_events where type='call.logged' and created_at::date = $1::date",
      [day],
    )
  ).rows[0].n;
  const meetings = (
    await pool.query<{ n: string }>(
      "select count(*)::text n from meetings where created_at::date = $1::date",
      [day],
    )
  ).rows[0].n;
  const demos = (
    await pool.query<{ n: string }>(
      "select count(*)::text n from builds where kind='demo' and status='deployed' and created_at::date = $1::date",
      [day],
    )
  ).rows[0].n;
  // Spend reconciles 1:1 with agent_events.cost_usd (Phase 6 acceptance).
  const spendDay = (
    await pool.query<{ s: string }>(
      "select coalesce(sum(cost_usd),0)::text s from agent_events where cost_usd is not null and created_at::date = $1::date",
      [day],
    )
  ).rows[0].s;
  const anomalies = await detectAnomalies();

  // The single highest-value lead right now: best actionable lead, weighted by pipeline depth.
  const hv = (
    await pool.query<{
      company_name: string;
      status: string;
      score: number | null;
      review_count: number | null;
    }>(
      `select company_name, status, score, review_count from leads
     where status in ('outreach_ready','awaiting_approval','replied','negotiating','meeting_booked','solution_ready','design_ready')
     order by case status when 'meeting_booked' then 6 when 'negotiating' then 5 when 'replied' then 4
                          when 'awaiting_approval' then 3 when 'outreach_ready' then 3 else 1 end desc,
              coalesce(score,0) desc, coalesce(review_count,0) desc limit 1`,
    )
  ).rows[0];

  // The single top blocker: prefer a hard anomaly, else the known operator gate.
  const blocker =
    anomalies.find((a) => a.kind !== "lead_stuck")?.detail ??
    anomalies[0]?.detail ??
    "outreach mailboxes not set up; sends stay in mock until the outreach domain + warmed mailboxes exist";

  const facts = {
    day,
    funnel,
    emailsSent,
    replies,
    callsDue,
    callsLogged,
    meetings,
    demos,
    spendDay,
    anomalyCount: anomalies.length,
  };
  const deterministic =
    `Sent ${emailsSent} emails, ${replies} replies, ${demos} demos shipped, ${meetings} meetings booked. ` +
    `Spend $${Number(spendDay).toFixed(2)}. ${callsDue} calls due, ${callsLogged} logged. ${anomalies.length} anomalies.`;

  // Haiku phrases ONE narrative line from the numbers above; it may not add numbers of its own.
  let narrative = deterministic;
  try {
    const raw = await llm({
      tier: "haiku",
      agent: "monitor",
      maxTokens: 120,
      system:
        "Write ONE plain sentence summarizing the day for a solo web-studio founder. Concise, technical, no fluff, no emojis, no em dashes. Use ONLY the numbers given; do not invent any.",
      prompt: JSON.stringify(facts),
      mockResponse: deterministic,
    });
    if (raw.trim() && !/[—–]/.test(raw)) narrative = raw.trim();
  } catch {
    /* deterministic fallback stands */
  }

  const summary = [
    `# EOD ${day}`,
    "",
    narrative,
    "",
    `Funnel: ${funnel.map((f) => `${f.status} ${f.n}`).join(", ")}.`,
    `Emails: ${emailsSent} sent, ${replies} replies. Calls: ${callsDue} due, ${callsLogged} logged. Meetings: ${meetings}. Demos: ${demos}. Spend: $${Number(spendDay).toFixed(2)}.`,
    anomalies.length ? `Anomalies: ${anomalies.map((a) => a.detail).join("; ")}.` : "Anomalies: none.",
    "",
    hv
      ? `Highest-value lead: ${hv.company_name} (${hv.status}, score ${hv.score ?? "?"}, ${hv.review_count ?? "?"} reviews). Act on this one first.`
      : "Highest-value lead: none actionable.",
    `Top blocker: ${blocker}`,
  ].join("\n");

  await pool.query(
    `insert into daily_reports (date, funnel, costs, anomalies, summary_md)
     values ($1,$2,$3,$4,$5)
     on conflict (date) do update set funnel=excluded.funnel, costs=excluded.costs, anomalies=excluded.anomalies, summary_md=excluded.summary_md`,
    [
      day,
      JSON.stringify(funnel),
      JSON.stringify({ day_usd: Number(spendDay) }),
      JSON.stringify(anomalies),
      summary,
    ],
  );
  await emitEvent({
    agent: "monitor",
    type: "digest.generated",
    message: `EOD ${day}${MOCK() ? " (mock)" : ""}`,
  });
  return summary;
}
