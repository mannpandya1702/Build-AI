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
    return new neon.Pool({ connectionString: url, max }) as unknown as DbPool;
  }
  return new pg.Pool({ connectionString: url, max });
}

export function getPool(): DbPool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
    pool = createPoolForUrl(url);
  }
  return pool;
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = null;
}
