#!/bin/bash
# Agency Autopilot worker supervisor (RUNBOOK §3). Keeps ONE worker alive against crashes.
# Liveness = the postgres advisory lock (ground truth), NOT process-name matching: any shell whose
# command line merely quotes "tsx src/index.ts" fooled pgrep-based checks (observed 2026-07-11:
# supervisor idled while the worker was dead). A lock held with a stale heartbeat (>5 min) is a
# dead worker's zombie session: terminate it, then restart.
#
# Started by .claude/hooks/session-start.sh on every remote session start; safe to run repeatedly
# (a second supervisor just sees the lock held; a second worker exits on the lock at boot).
LOG=${WORKER_LOG:-/tmp/autopilot-worker.log}
REPO="$(cd "$(dirname "$0")/.." && pwd)"
Q() { PGPASSWORD=autopilot_local_dev psql -h localhost -U autopilot -d agency_autopilot -tAc "$1" 2>/dev/null; }
while true; do
  if ! pg_isready -h localhost -q 2>/dev/null; then
    service postgresql start > /dev/null 2>&1; sleep 5
  fi
  LOCKPID=$(Q "select pid from pg_locks where locktype='advisory' limit 1" | tr -d ' ')
  if [ -n "$LOCKPID" ]; then
    FRESH=$(Q "select count(*) from agent_events where type in ('worker.heartbeat','worker.started') and created_at > now() - interval '5 minutes'" | tr -d ' ')
    if [ "$FRESH" = "0" ]; then
      echo "[supervisor] $(date -u +%FT%TZ) lock held (pg pid $LOCKPID) but heartbeat stale, terminating zombie session" >> "$LOG"
      Q "select pg_terminate_backend($LOCKPID)" > /dev/null
      sleep 3
      LOCKPID=""
    fi
  fi
  if [ -z "$LOCKPID" ]; then
    echo "[supervisor] $(date -u +%FT%TZ) no worker lock, starting worker" >> "$LOG"
    cd "$REPO/apps/worker" && MOCK_MODE=false nohup pnpm dev >> "$LOG" 2>&1 &
    sleep 25
  fi
  sleep 30
done
