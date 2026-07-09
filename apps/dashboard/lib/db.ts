// Dashboard reads Postgres directly. Single seam (spec §2.6): a local DATABASE_URL uses pg; a
// *.neon.tech URL transparently switches to @neondatabase/serverless (Postgres over HTTPS/WebSocket,
// Pool-compatible), which is what a Vercel deployment uses. Same SQL either way.
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export function db(): Pool {
  if (!global.__pgPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    if (/neon\.tech/i.test(url)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const neon = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
      if (typeof WebSocket === "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        neon.neonConfig.webSocketConstructor = require("ws");
      }
      neon.neonConfig.poolQueryViaFetch = true;
      // Next.js patches global fetch on Vercel and CACHES it, which made identical SQL return
      // stale (pre-delete) rows. Every driver fetch must bypass that cache.
      neon.neonConfig.fetchFunction = (input: RequestInfo, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" });
      global.__pgPool = new neon.Pool({ connectionString: url, max: 5 }) as unknown as Pool;
    } else {
      global.__pgPool = new Pool({ connectionString: url, max: 5 });
    }
  }
  return global.__pgPool;
}
