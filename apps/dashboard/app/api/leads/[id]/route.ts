import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Full lead story (spec §8.2): overview + audit + solution + design + builds/QA + emails + timeline.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const lead = await db().query("select * from leads where id = $1", [id]);
  if (lead.rowCount === 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [audit, solution, design, builds, qa, emails, events] = await Promise.all([
    db().query(
      "select lighthouse, findings, summary, screenshots, pages_crawled, created_at from audits where lead_id=$1 order by created_at desc limit 1",
      [id],
    ),
    db().query(
      "select pitch_angle, proposed_pages, features, differentiators, estimated_impact, call_sheet_md, created_at from solutions where lead_id=$1 order by created_at desc limit 1",
      [id],
    ),
    db().query(
      `select d.brand, d.sitemap, d.page_specs, d.look_locked, l.name as look_name, d.created_at
       from designs d left join looks l on l.id=d.look_id where d.lead_id=$1 order by d.created_at desc limit 1`,
      [id],
    ),
    db().query(
      "select id, kind, status, deploy_url, iteration, created_at from builds where lead_id=$1 order by created_at desc",
      [id],
    ),
    db().query(
      `select r.passed, r.iteration, r.checks, r.issues, r.created_at, b.kind
       from qa_reports r join builds b on b.id=r.build_id where b.lead_id=$1 order by r.created_at desc`,
      [id],
    ),
    db().query(
      "select id, direction, kind, subject, status, sent_at, created_at from emails where lead_id=$1 order by created_at",
      [id],
    ),
    db().query(
      "select id, agent, level, type, message, cost_usd, created_at from agent_events where lead_id=$1 order by created_at desc limit 200",
      [id],
    ),
  ]);

  const spend = events.rows.reduce(
    (s: number, e: { cost_usd: string | null }) => s + (e.cost_usd ? Number(e.cost_usd) : 0),
    0,
  );

  return NextResponse.json({
    lead: lead.rows[0],
    audit: audit.rows[0] ?? null,
    solution: solution.rows[0] ?? null,
    design: design.rows[0] ?? null,
    builds: builds.rows,
    qa: qa.rows,
    emails: emails.rows,
    events: events.rows,
    spend,
  });
}
