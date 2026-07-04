import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// /reports data (spec §8.7): the funnel (artifact-backed milestones, so each count is provable),
// spend trend, and unit-economics tiles. Chart choices per the ui-ux-pro-max skill: Funnel for the
// pipeline (conversion % per stage), Line/Area for spend over time.
export async function GET() {
  const one = async (q: string, p: any[] = []) => Number((await db().query(q, p)).rows[0]?.n ?? 0);

  const [found, qualified, audited, solutioned, designed, deployed, contacted, meetings, won] = await Promise.all([
    one("select count(*)::int n from leads"),
    one("select count(*)::int n from leads where status not in ('discovered','enriched','disqualified','suppressed')"),
    one("select count(distinct lead_id)::int n from audits"),
    one("select count(distinct lead_id)::int n from solutions"),
    one("select count(distinct lead_id)::int n from designs"),
    one("select count(distinct lead_id)::int n from builds where deploy_url is not null and kind='demo'"),
    one("select count(distinct lead_id)::int n from emails where direction='outbound' and kind='outreach' and status='sent'"),
    one("select count(*)::int n from meetings"),
    one("select count(*)::int n from leads where status in ('closed_won','delivery_approval','delivered')"),
  ]);

  const funnel = [
    { stage: "Discovered", count: found },
    { stage: "Qualified", count: qualified },
    { stage: "Audited", count: audited },
    { stage: "Solution", count: solutioned },
    { stage: "Demo built", count: deployed },
    { stage: "Contacted", count: contacted },
    { stage: "Meeting", count: meetings },
    { stage: "Won", count: won },
  ];

  // spend over the last 14 days from metered agent_events (spec §9)
  const spendRows = await db().query(
    `select to_char(date_trunc('day', created_at), 'MM-DD') as day, coalesce(sum(cost_usd),0)::float as usd
     from agent_events where cost_usd is not null and created_at >= now() - interval '14 days'
     group by 1 order by 1`,
  );
  const totalSpend = await one("select coalesce(sum(cost_usd),0)::float n from agent_events where cost_usd is not null");

  const tiles = {
    total_spend: totalSpend,
    cost_per_demo: deployed ? totalSpend / deployed : 0,
    cost_per_qualified: qualified ? totalSpend / qualified : 0,
    demos_deployed: deployed,
    qualified,
    reply_rate: contacted ? (await one("select count(distinct lead_id)::int n from emails where direction='inbound'")) / contacted : 0,
  };

  // daily digests (spec §6.10), newest first
  const digests = (await db().query(
    "select date, summary_md, anomalies from daily_reports order by date desc limit 7",
  )).rows;

  return NextResponse.json({ funnel, spend: spendRows.rows, tiles, digests });
}
