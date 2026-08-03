// Shared Postgres pool. DATABASE_URL points at local Postgres in dev; in production it points at a
// HOSTED Postgres. ENV ADAPTATION (spec §15, logged in PROGRESS.md): this container's network
// policy blocks raw TCP :5432 egress, so classic hosted Postgres (Supabase's pooler included) is
// unreachable from the local worker. Neon speaks the Postgres protocol over HTTPS/WebSocket (:443,
// which IS open), so a *.neon.tech DATABASE_URL transparently switches the pool to
// @neondatabase/serverless (Pool-compatible: query, connect, transactions). Same SQL, same seams;
// Vercel-deployed apps use the identical URL. Secrets come from env only (spec §4.7).
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(repoRoot, ".env.local") });
config({ path: resolve(repoRoot, ".env") });

const require = createRequire(import.meta.url);

// Minimal surface every consumer uses; both pg.Pool and neon's Pool satisfy it.
export type DbPool = pg.Pool;

let pool: DbPool | null = null;

function isNeon(url: string): boolean {
  return /neon\.tech/i.test(url);
}

/** Build a pool for ANY Postgres URL, picking the right transport (pg over TCP, neon over HTTPS).
 *  Used by getPool for DATABASE_URL and by migration/copy tooling for explicit targets. */
export function createPoolForUrl(url: string, max = 10): DbPool {
  if (isNeon(url)) {
    // Lazy require keeps local-postgres runs untouched by the neon path.
    const neon = require("@neondatabase/serverless") as typeof import("@neondatabase/serverless");
    if (typeof WebSocket === "undefined") {
      // Node < 22 fallback; Node 22+ has a global WebSocket.
      neon.neonConfig.webSocketConstructor = require("ws");
    }
    neon.neonConfig.poolQueryViaFetch = true; // one-shot queries ride plain HTTPS
    const neonPool = new neon.Pool({ connectionString: url, max });
    neonPool.on("error", (err: Error) => console.error("[neon pool] client error:", err.message));
    return neonPool as unknown as DbPool;
  }
  // Managed Postgres (Supabase pooler, RDS, …) requires TLS; local Postgres does not. Enable SSL for
  // any non-local host so a hosted DATABASE_URL connects. rejectUnauthorized:false keeps encryption on
  // without bundling the provider's CA (standard for managed Postgres; tighten to a CA + verify-full
  // if the deployment demands strict chain validation).
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\]|\[?::1\]?)[:/]/i.test(url);
  const pgPool = new pg.Pool({
    connectionString: url,
    max,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
  // A dropped idle connection (managed Postgres reaping idle clients, an IPv6 blip on the direct
  // connection) makes node-postgres emit 'error' on the pool. With no listener that becomes an
  // unhandled exception that CRASHES the process (observed on Fly: worker connected, ran ~40s, died).
  // Log it and let the pool discard the bad client and reconnect on the next query.
  pgPool.on("error", (err: Error) => console.error("[pg pool] idle client error:", err.message));
  return pgPool;
}

export function getPool(): DbPool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
    // DB_POOL_MAX keeps the deployed worker's connection footprint small: the worker also runs a
    // pg-boss pool and holds one advisory-lock client, and a managed Postgres (Supabase free-tier
    // pooler) has a modest connection budget. Default 10 for local dev; the Fly worker sets it to 4
    // so worker(4) + pg-boss(5) + lock(1) stays well under the pooler ceiling.
    pool = createPoolForUrl(url, Number(process.env.DB_POOL_MAX) || 10);
  }
  return pool;
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = null;
}
