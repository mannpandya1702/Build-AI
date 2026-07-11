#!/bin/bash
# SessionStart hook: bring the Agency Autopilot stack up in remote (web) sessions.
# The worker lives in this ephemeral container; when the platform reclaims/restarts it, the
# dashboard shows "Worker · Offline" until something restarts the stack (RUNBOOK §3). This hook is
# that something: every session start revives postgres + the worker supervisor automatically.
# Idempotent: a running stack is left untouched (the supervisor checks the advisory lock; a second
# worker exits on it at boot).
set -uo pipefail

# Remote sessions only; local dev starts the stack by hand (RUNBOOK §1).
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# 1. Dependencies (fresh-clone case; cached container makes this a no-op).
if [ ! -d node_modules ]; then
  pnpm install --silent || echo "[hook] pnpm install failed; continuing" >&2
fi

# 2. Postgres.
if ! pg_isready -h localhost -q 2>/dev/null; then
  service postgresql start >/dev/null 2>&1 || echo "[hook] postgres failed to start" >&2
fi

# 3. Worker supervisor — only if secrets exist (a fresh clone has no .env.local; the worker
#    cannot and must not run real adapters without it).
if [ ! -f .env.local ]; then
  echo "[hook] .env.local missing: worker not started (secrets required, RUNBOOK §6)" >&2
  exit 0
fi
if ! pgrep -f "scripts/worker-supervisor.sh" >/dev/null 2>&1; then
  nohup "$CLAUDE_PROJECT_DIR/scripts/worker-supervisor.sh" >/dev/null 2>&1 &
  echo "[hook] worker supervisor started" >&2
fi
exit 0
