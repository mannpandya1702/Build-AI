import { NextResponse, type NextRequest } from "next/server";

/**
 * Password on the admin panel.
 *
 * HTTP Basic Auth rather than a login page and a session: the panel has exactly
 * one user, holds nothing a visitor could change, and adding a user table plus
 * session handling to a static marketing site would be a lot of moving parts
 * guarding a page of read-only numbers. The browser remembers the credentials,
 * so in practice it is one prompt.
 *
 * Lives in proxy.ts, which is what Next 16 renamed middleware.ts to; the
 * exported function has to be called `proxy` to match.
 *
 * Set ADMIN_USER and ADMIN_PASSWORD in the environment. If ADMIN_PASSWORD is
 * missing the panel is closed entirely rather than left open — a misconfigured
 * deploy should fail shut, not publish the site's internals.
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  const user = process.env.ADMIN_USER ?? "riwaaya";

  /*
   * A browser opens its native sign-in box for ANY request that comes back 401
   * with this header — including one the page made in the background. The
   * footer's studio link was a next/link, which prefetches routes as they
   * scroll into view, so visitors who reached the bottom of the public site
   * had /admin fetched behind their back and were shown a password prompt out
   * of nowhere.
   *
   * The fix is in the footer, which is now a plain anchor and prefetches
   * nothing. It deliberately is NOT here: suppressing the header for prefetch
   * requests was tried and cannot work, because Next strips RSC and
   * Next-Router-Prefetch before the proxy runs — measured, not assumed; the
   * proxy receives only accept, host, user-agent and the x-forwarded set. Any
   * guard written against those header names would be dead code that reads
   * like protection.
   */
  const deny = (message: string) =>
    new NextResponse(message, {
      status: 401,
      headers: {
        // The realm string is what the browser shows above the password box.
        "WWW-Authenticate": 'Basic realm="Riwaaya admin", charset="UTF-8"',
        "Cache-Control": "no-store",
      },
    });

  if (!password) {
    return new NextResponse(
      "The admin panel is not configured. Set ADMIN_PASSWORD in the environment to open it.",
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return deny("Authentication required.");

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return deny("Authentication required.");
  }

  // Split on the first colon only — passwords are allowed to contain them.
  const separator = decoded.indexOf(":");
  const givenUser = decoded.slice(0, separator);
  const givenPassword = decoded.slice(separator + 1);

  if (!safeEqual(givenUser, user) || !safeEqual(givenPassword, password)) {
    return deny("Those credentials were not accepted.");
  }

  /*
   * Flag the request so the root layout can leave the marketing chrome off.
   *
   * This replaced a client component that read the pathname and returned null.
   * That hid the nav and footer visually, but the server had already rendered
   * them to pass as children, so their markup still shipped inside the admin
   * page's payload — invisible, and pure waste. Setting a request header here
   * lets the layout decide before anything is rendered.
   *
   * It has to go on `request.headers`, not the response: headers() in a server
   * component reads the incoming request.
   */
  const forwarded = new Headers(request.headers);
  forwarded.set(CHROME_HEADER, "off");
  return NextResponse.next({ request: { headers: forwarded } });
}

/** Read by app/layout.tsx. Only ever set by this file. */
export const CHROME_HEADER = "x-riwaaya-chrome";

/**
 * Length-independent comparison. A plain `===` on secrets leaks a little
 * information through how long it takes to fail; over a network that is close
 * to unexploitable, but constant-time comparison is cheap and there is no
 * reason to write the version that needs the caveat.
 */
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export const config = {
  matcher: ["/admin/:path*"],
};
