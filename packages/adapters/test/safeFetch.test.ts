import { describe, expect, it } from "vitest";
import { BlockedAddressError, assertPublicHost, isBlockedIp, safeFetch } from "../src/safeFetch.js";

// SSRF guard corpus (MASTER_SPEC §11 priority target). The classifier must reject every private,
// loopback, link-local, and cloud-metadata address — including IPv4-mapped IPv6 forms — and accept
// ordinary public addresses.
describe("isBlockedIp", () => {
  const blocked = [
    "127.0.0.1", // loopback
    "127.1.2.3",
    "0.0.0.0",
    "10.0.0.1", // RFC1918
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // AWS/GCP metadata
    "169.254.0.1",
    "100.64.0.1", // CGNAT
    "192.0.2.5", // TEST-NET-1
    "198.18.0.1", // benchmark
    "224.0.0.1", // multicast
    "240.0.0.1", // reserved
    "255.255.255.255",
    "::1", // v6 loopback
    "::", // unspecified
    "fc00::1", // ULA
    "fd12:3456::1",
    "fe80::1", // link-local
    "::ffff:127.0.0.1", // v4-mapped loopback
    "::ffff:169.254.169.254", // v4-mapped metadata
    "not-an-ip", // unparseable -> unsafe
    "10.0.0", // malformed
    "999.1.1.1", // out of range
  ];
  for (const ip of blocked) {
    it(`blocks ${ip}`, () => expect(isBlockedIp(ip)).toBe(true));
  }

  const allowed = [
    "8.8.8.8",
    "1.1.1.1",
    "93.184.216.34",
    "203.0.114.1",
    "2606:2800:220:1:248:1893:25c8:1946",
  ];
  for (const ip of allowed) {
    it(`allows public ${ip}`, () => expect(isBlockedIp(ip)).toBe(false));
  }
});

describe("assertPublicHost", () => {
  it("rejects loopback and metadata hostnames without DNS", async () => {
    await expect(assertPublicHost("localhost")).rejects.toBeInstanceOf(BlockedAddressError);
    await expect(assertPublicHost("metadata.google.internal")).rejects.toBeInstanceOf(BlockedAddressError);
    await expect(assertPublicHost("foo.internal")).rejects.toBeInstanceOf(BlockedAddressError);
  });
  it("rejects private IP literals", async () => {
    await expect(assertPublicHost("127.0.0.1")).rejects.toBeInstanceOf(BlockedAddressError);
    await expect(assertPublicHost("169.254.169.254")).rejects.toBeInstanceOf(BlockedAddressError);
  });
  it("accepts a public IP literal (no DNS needed)", async () => {
    await expect(assertPublicHost("8.8.8.8")).resolves.toBeUndefined();
  });
});

describe("safeFetch", () => {
  it("refuses non-http(s) schemes before any network call", async () => {
    await expect(safeFetch("file:///etc/passwd")).rejects.toBeInstanceOf(BlockedAddressError);
    await expect(safeFetch("ftp://example.com/x")).rejects.toBeInstanceOf(BlockedAddressError);
  });
  it("refuses private targets before any network call", async () => {
    await expect(safeFetch("http://127.0.0.1/")).rejects.toBeInstanceOf(BlockedAddressError);
    await expect(safeFetch("http://169.254.169.254/latest/meta-data/")).rejects.toBeInstanceOf(
      BlockedAddressError,
    );
    await expect(safeFetch("http://[::1]:8080/")).rejects.toBeInstanceOf(BlockedAddressError);
  });
});
