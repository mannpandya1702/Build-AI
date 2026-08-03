import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Shortlist (MASTER_SPEC §12): every lead parked at the spend gate, with score, gaps, contact, and
// whether it is already approved. The operator approves here before any paid build runs. Projected
// per-lead build cost comes from settings.build_budget (seeded by the worker from caps.yaml).
export async function GET() {
  const [leads, budget] = await Promise.all([
    db().query(
      `select l.id, l.company_name, l.industry, l.city, l.region, l.score, l.score_breakdown,
              l.contact_email, l.contact_phone, l.website_url, l.updated_at,
              exists(select 1 from agent_events e where e.lead_id = l.id and e.type = 'lead.build_approved') as approved
         from leads l
        where l.status = 'awaiting_build_approval'
        order by coalesce(l.score,0) desc, l.updated_at asc
        limit 200`,
    ),
    db().query<{ value: { usd_per_lead?: number } }>("select value from settings where key='build_budget'"),
  ]);
  const estCostPerLead = Number(budget.rows[0]?.value?.usd_per_lead ?? 6);
  return NextResponse.json({ leads: leads.rows, est_cost_per_lead: estCostPerLead });
}
