import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await db().query(
    `select id, company_name, slug, industry, city, region, status, score,
            extract(epoch from (now() - updated_at)) as seconds_in_stage
     from leads order by updated_at desc limit 500`,
  );
  return NextResponse.json({ leads: r.rows });
}
