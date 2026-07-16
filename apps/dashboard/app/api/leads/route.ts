import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await db().query(
    `select id, company_name, slug, industry, city, region, status, score,
            (contact_email is not null) as has_email,
            extract(epoch from (now() - updated_at)) as seconds_in_stage
     from leads order by updated_at desc limit 500`,
  );
  return NextResponse.json({ leads: r.rows });
}
