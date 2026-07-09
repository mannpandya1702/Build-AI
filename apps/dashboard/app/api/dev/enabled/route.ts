import { NextResponse } from "next/server";
import { devToolsEnabled } from "@/lib/devtools";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: devToolsEnabled() });
}
