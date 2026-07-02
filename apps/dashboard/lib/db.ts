// Dashboard reads Postgres directly in local dev; in production this becomes the Supabase client
// with realtime channels. Single seam to swap (spec §2.6 adapter thinking applies to the UI too).
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export function db(): Pool {
  if (!global.__pgPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    global.__pgPool = new Pool({ connectionString: url, max: 5 });
  }
  return global.__pgPool;
}
