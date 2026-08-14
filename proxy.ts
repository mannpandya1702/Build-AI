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

  return NextResponse.next();
}

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
