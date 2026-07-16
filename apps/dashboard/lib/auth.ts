// Operator session (MASTER_SPEC §9). Edge-compatible (Web Crypto only, no Node APIs) so the same
// helpers work in middleware and route handlers. Interim model: a single operator password
// (AUTH_PASSWORD) mints an HMAC-signed session cookie (AUTH_SECRET). This is real protection when
// configured and upgrades cleanly to Supabase Auth at the single-DB cutover — the middleware contract
// (valid session -> allowed) is unchanged.
const enc = new TextEncoder();

function bytesToB64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  const b64 = (s + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return bytesToB64Url(new Uint8Array(sig));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const SESSION_COOKIE = "autopilot_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export async function createSessionToken(secret: string): Promise<string> {
  const payload = bytesToB64Url(
    enc.encode(JSON.stringify({ sub: "operator", exp: nowSeconds() + SESSION_MAX_AGE })),
  );
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await hmacSign(secret, payload);
  if (!constantTimeEqual(sig, expected)) return false;
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(b64UrlToBytes(payload))) as { exp?: number };
    return typeof exp === "number" && exp > nowSeconds();
  } catch {
    return false;
  }
}

export function checkPassword(input: unknown, expected: string): boolean {
  return typeof input === "string" && constantTimeEqual(input, expected);
}

/** True only when both the password and signing secret are configured. */
export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_PASSWORD && process.env.AUTH_SECRET);
}
