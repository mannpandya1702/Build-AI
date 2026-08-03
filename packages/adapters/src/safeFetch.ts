// SSRF guard (MASTER_SPEC §8.8/§9, OWASP LLM05). Every fetch of a prospect-controlled URL goes
// through here: the target host is resolved and rejected if it points at a private, loopback,
// link-local, or cloud-metadata address, and the check is re-run after EACH redirect hop (redirects
// are followed manually so a public URL can't 302 to 169.254.169.254). Non-http(s) schemes are
// refused outright. The IP-classification core is pure and exhaustively unit-tested (safeFetch.test).
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class BlockedAddressError extends Error {
  constructor(reason: string) {
    super(`safeFetch refused: ${reason}`);
    this.name = "BlockedAddressError";
  }
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255 || (p.length > 1 && p.startsWith("0"))) return null;
    n = n * 256 + o;
  }
  return n >>> 0;
}

// [network, prefixBits] pairs of non-public IPv4 space (RFC1918/6598/5735/3927/5771/reserved).
const V4_BLOCKS: ReadonlyArray<[string, number]> = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (incl. 169.254.169.254 cloud metadata)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
  ["255.255.255.255", 32], // broadcast
];

function v4Blocked(ip: string): boolean {
  const addr = ipv4ToInt(ip);
  if (addr === null) return true; // unparseable -> treat as unsafe
  for (const [net, bits] of V4_BLOCKS) {
    const base = ipv4ToInt(net);
    if (base === null) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((addr & mask) === (base & mask)) return true;
  }
  return false;
}

function v6Blocked(raw: string): boolean {
  const ip = raw.toLowerCase().replace(/^\[|\]$/g, "");
  // IPv4-mapped / -embedded (::ffff:1.2.3.4, ::1.2.3.4) -> classify the embedded v4.
  const embedded = ip.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (embedded) return v4Blocked(embedded[1]);
  if (ip === "::1" || ip === "::") return true; // loopback / unspecified
  const firstHextet = ip.split(":")[0] ?? "";
  if (
    firstHextet.startsWith("fe8") ||
    firstHextet.startsWith("fe9") ||
    firstHextet.startsWith("fea") ||
    firstHextet.startsWith("feb")
  )
    return true; // fe80::/10 link-local
  if (firstHextet.startsWith("fc") || firstHextet.startsWith("fd")) return true; // fc00::/7 ULA
  if (firstHextet.startsWith("ff")) return true; // ff00::/8 multicast
  return false;
}

/** Pure classifier: is this IP literal in non-public (blocked) space? Unparseable -> blocked. */
export function isBlockedIp(ip: string): boolean {
  const fam = isIP(ip);
  if (fam === 4) return v4Blocked(ip);
  if (fam === 6) return v6Blocked(ip);
  return true; // not a valid IP literal
}

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

/** Throws BlockedAddressError unless every resolved address for `hostname` is public. */
export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) throw new BlockedAddressError("empty host");
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  )
    throw new BlockedAddressError(`disallowed host ${host}`);
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new BlockedAddressError(`private/reserved IP ${host}`);
    return;
  }
  let addrs: Array<{ address: string }>;
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new BlockedAddressError(`cannot resolve ${host}`);
  }
  if (addrs.length === 0) throw new BlockedAddressError(`no addresses for ${host}`);
  for (const { address } of addrs) {
    if (isBlockedIp(address))
      throw new BlockedAddressError(`${host} resolves to private/reserved ${address}`);
  }
}

export interface SafeFetchOptions {
  maxRedirects?: number;
}

/**
 * fetch() that refuses private/metadata targets and re-validates after every redirect. Only http(s).
 * Redirects are followed manually (init.redirect is ignored / forced to "manual" internally).
 */
export async function safeFetch(
  input: string,
  init: RequestInit = {},
  opts: SafeFetchOptions = {},
): Promise<Response> {
  const maxRedirects = opts.maxRedirects ?? 5;
  let current = input;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      throw new BlockedAddressError(`invalid URL ${current}`);
    }
    if (u.protocol !== "http:" && u.protocol !== "https:")
      throw new BlockedAddressError(`disallowed scheme ${u.protocol}`);
    await assertPublicHost(u.hostname);

    const res = await fetch(current, { ...init, redirect: "manual" });
    const status = res.status;
    if (status >= 300 && status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res; // 3xx without a target: hand back as-is
      if (hop === maxRedirects) throw new BlockedAddressError("too many redirects");
      current = new URL(loc, u).toString();
      continue;
    }
    return res;
  }
  throw new BlockedAddressError("too many redirects");
}
