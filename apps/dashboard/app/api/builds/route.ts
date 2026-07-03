import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// /builds gallery data (spec §8.5): every deployed demo/final with its lead + latest QA verdict.
export async function GET() {
  const r = await db().query(
    `select b.id, b.kind, b.status, b.deploy_url, b.iteration, b.created_at,
            l.id as lead_id, l.company_name, l.city, l.region, l.status as lead_status,
            q.passed as qa_passed, q.issues as qa_issues
     from builds b
     join leads l on l.id = b.lead_id
     left join lateral (
       select passed, issues from qa_reports r where r.build_id = b.id order by created_at desc limit 1
     ) q on true
     where b.deploy_url like 'https://%'
     order by b.created_at desc`,
  );
  return NextResponse.json({ builds: r.rows });
}
