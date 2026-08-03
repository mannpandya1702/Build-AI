import { SESSION_COOKIE, authConfigured, verifySessionToken } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

// Auth gate (MASTER_SPEC §9, audit C-1): every route requires a valid operator session EXCEPT the
// login flow and the HMAC-verified Cal.com webhook. When auth isn't configured yet, fail CLOSED on a
// hosted deploy (503) but allow local dev through — production MUST set AUTH_PASSWORD + AUTH_SECRET.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/webhooks/calcom"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  if (!authConfigured()) {
    if (process.env.VERCEL) return new NextResponse("Auth not configured", { status: 503 });
    return NextResponse.next(); // local dev convenience only
  }

  const ok = await verifySessionToken(
    process.env.AUTH_SECRET as string,
    req.cookies.get(SESSION_COOKIE)?.value,
  );
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals + static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
