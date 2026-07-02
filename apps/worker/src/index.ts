// Agency Autopilot worker: one process consumes every agent queue via pg-boss (spec §2.1).
// Phase 0: boot pg-boss, emit a heartbeat event every 60s (the monitor watches for its absence).
import PgBoss from "pg-boss";
import { emitEvent, getPool } from "@autopilot/core";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  getPool(); // fail fast on bad env before boss starts

  const boss = new PgBoss({ connectionString: url, schema: "pgboss" });
  boss.on("error", (err) => console.error("[pg-boss]", err.message));
  await boss.start();
  console.log("[worker] pg-boss started");

  await emitEvent({ agent: "worker", type: "worker.started", message: "worker online" });

  setInterval(() => {
    emitEvent({ agent: "worker", type: "worker.heartbeat", level: "debug" }).catch((e) =>
      console.error("[heartbeat]", e.message),
    );
  }, 60_000);

  // Agent queue registrations land here in Phase 1 (research, scrape, qualify, analyzer,
  // solution, uiux, builder, qa, sales, monitor).
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
