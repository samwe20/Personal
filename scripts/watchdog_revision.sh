#!/usr/bin/env bash
# Watchdog: batch revision + auto-commit + hourly logging + agent fallback.
set -euo pipefail

WORKDIR="/workspace"
LOG="$WORKDIR/schneller-revision.log"
HOURLY="$WORKDIR/schneller-hourly-revision.log"
WATCH="$WORKDIR/schneller-revision-watchdog.log"
COMPLETE="$WORKDIR/schneller-revision-complete.txt"
STATUS_JSON="$WORKDIR/schneller-tagebuch-cs/.revision-status.json"

CHECK_INTERVAL_SEC=300
STALL_THRESHOLD_SEC=3600
HOURLY_INTERVAL_SEC=3600
BATCH_LIMIT="${REVISION_BATCH_LIMIT:-8}"
BATCH_DELAY="${REVISION_BATCH_DELAY:-1.5}"
COMMIT_EVERY="${REVISION_COMMIT_EVERY:-25}"
AGENT_COOLDOWN_SEC=7200
LAST_AGENT_SPAWN="$WORKDIR/.last-agent-spawn.epoch"

log() {
  echo "[$(date -u '+%Y-%m-%d %H:%M UTC')] $*" | tee -a "$WATCH"
}

revised_count() {
  cd "$WORKDIR"
  python3 - <<'PY'
import json
from pathlib import Path
p = Path("schneller-tagebuch-cs/.revision-status.json")
files = len(list(Path("schneller-tagebuch-cs").glob("*.md")))
if not p.exists():
    print(0, files)
else:
    d = json.loads(p.read_text())
    print(len(d.get("revised", {})), files)
PY
}

last_log_mtime() {
  [[ -f "$LOG" ]] && stat -c %Y "$LOG" 2>/dev/null || echo 0
}

batch_running() {
  pgrep -f 'batch_revise_translation.py' >/dev/null 2>&1
}

revision_complete() {
  [[ -f "$COMPLETE" ]] && return 0
  read -r done total < <(revised_count)
  [[ "$done" -ge "$total" && "$total" -gt 0 ]]
}

git_commit_if_dirty() {
  cd "$WORKDIR"
  if git diff --quiet && [[ -z "$(git status --short schneller-tagebuch-cs/)" ]]; then
    return 0
  fi
  read -r done _total < <(revised_count)
  git add schneller-tagebuch-cs/ schneller-tagebuch-cs/.revision-status.json 2>/dev/null || true
  git commit -m "Revise Czech translations (batch, ${done} entries revised)" || true
  git push -u origin "$(git branch --show-current)" || true
  log "git push: ${done} revidováno"
}

spawn_agent_task() {
  local now last pending
  now="$(date +%s)"
  last=0
  [[ -f "$LAST_AGENT_SPAWN" ]] && last="$(cat "$LAST_AGENT_SPAWN")"
  if (( now - last < AGENT_COOLDOWN_SEC )); then
    log "agent spawn skipped (cooldown)"
    return 0
  fi
  read -r done total < <(revised_count)
  pending=$((total - done))
  if (( pending <= 0 )); then
    return 0
  fi
  log "spawning gh agent-task (pending=$pending)"
  cd "$WORKDIR"
  gh agent-task create \
    --custom-agent schneller-prekladatel \
    --base "$(git branch --show-current)" \
    -F scripts/revision-agent-task.txt 2>&1 | tee -a "$WATCH" || log "agent-task spawn failed"
  echo "$now" > "$LAST_AGENT_SPAWN"
}

run_batch() {
  cd "$WORKDIR"
  log "batch start (limit=$BATCH_LIMIT)"
  set +e
  PYTHONUNBUFFERED=1 python3 scripts/batch_revise_translation.py \
    --limit "$BATCH_LIMIT" --delay "$BATCH_DELAY" 2>&1 | tee -a "$LOG"
  local rc=${PIPESTATUS[0]}
  set -e
  if [[ "$rc" -eq 2 ]]; then
    log "batch: chybí OPENAI_API_KEY — fallback na agent-task"
    spawn_agent_task
    return 1
  fi
  return 0
}

hourly_report() {
  read -r done total < <(revised_count)
  local pending=$((total - done))
  echo "[$(date -u '+%Y-%m-%d %H:%M UTC')] revised=$done/$total pending=$pending" >> "$HOURLY"
  log "hourly: $done/$total"
}

mark_complete() {
  read -r done total < <(revised_count)
  {
    echo "completed_at=$(date -u '+%Y-%m-%d %H:%M UTC')"
    echo "revised=$done"
    echo "total=$total"
  } > "$COMPLETE"
  log "REVISION COMPLETE ($done/$total)"
  git_commit_if_dirty
}

last_progress_epoch="$(date +%s)"
last_hourly_epoch="$(date +%s)"
files_since_commit=0

log "revision watchdog started (batch=$BATCH_LIMIT stall=${STALL_THRESHOLD_SEC}s)"

while true; do
  now="$(date +%s)"

  if revision_complete; then
    [[ ! -f "$COMPLETE" ]] && mark_complete
    hourly_report
    sleep "$HOURLY_INTERVAL_SEC"
    continue
  fi

  if ! batch_running; then
    if run_batch; then
      last_progress_epoch="$now"
      files_since_commit=$((files_since_commit + BATCH_LIMIT))
    fi
  else
    mtime="$(last_log_mtime)"
    if [[ "$mtime" -gt "$last_progress_epoch" ]]; then
      last_progress_epoch="$mtime"
    elif (( now - last_progress_epoch > STALL_THRESHOLD_SEC )); then
      log "stall detected — killing batch and restarting"
      pkill -f 'batch_revise_translation.py' 2>/dev/null || true
      sleep 2
      run_batch || true
      last_progress_epoch="$now"
    fi
  fi

  if (( files_since_commit >= COMMIT_EVERY )); then
    git_commit_if_dirty
    files_since_commit=0
  fi

  if (( now - last_hourly_epoch >= HOURLY_INTERVAL_SEC )); then
    hourly_report
    last_hourly_epoch="$now"
  fi

  sleep "$CHECK_INTERVAL_SEC"
done
