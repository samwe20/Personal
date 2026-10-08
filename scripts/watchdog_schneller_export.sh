#!/usr/bin/env bash
# Watchdog: hourly logging + auto-restart export when stalled.
set -euo pipefail

WORKDIR="/workspace"
OUT="$WORKDIR/schneller-tagebuch-cs"
EXPORT_LOG="$WORKDIR/schneller-export.log"
HOURLY_LOG="$WORKDIR/schneller-hourly.log"
WATCHDOG_LOG="$WORKDIR/schneller-watchdog.log"
COMPLETE_FILE="$WORKDIR/schneller-export-complete.txt"
PID_FILE="$WORKDIR/schneller-export.pid"

CHECK_INTERVAL_SEC=300      # kontrola každých 5 minut
STALL_THRESHOLD_SEC=1800    # restart po 30 minutách bez pokroku
HOURLY_INTERVAL_SEC=3600

log() {
  echo "[$(date -u '+%Y-%m-%d %H:%M UTC')] $*" | tee -a "$WATCHDOG_LOG"
}

file_count() {
  ls "$OUT"/*.md 2>/dev/null | wc -l | tr -d ' '
}

last_ok_line() {
  rg '^\[ok\]' "$EXPORT_LOG" 2>/dev/null | tail -1 || true
}

export_running() {
  pgrep -f 'python3 scripts/extract_schneller_tagebuch.py' >/dev/null 2>&1
}

export_complete() {
  [[ -f "$COMPLETE_FILE" ]] && return 0
  rg -q '^Done\.' "$EXPORT_LOG" 2>/dev/null
}

mark_complete() {
  local summary count
  summary="$(rg '^Done\.' "$EXPORT_LOG" 2>/dev/null | tail -1 || true)"
  count="$(file_count)"
  {
    echo "completed_at=$(date -u '+%Y-%m-%d %H:%M UTC')"
    echo "files=$count"
    echo "summary=$summary"
    echo "last_ok=$(last_ok_line)"
  } > "$COMPLETE_FILE"
  log "EXPORT COMPLETE — $summary (files=$count)"
  if [[ -x "$WORKDIR/scripts/on_export_complete.sh" ]]; then
    "$WORKDIR/scripts/on_export_complete.sh" >> "$WATCHDOG_LOG" 2>&1 || true
  fi
}

start_export() {
  cd "$WORKDIR"
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t "schneller-full-export:0.0" C-c 2>/dev/null || true
  sleep 1
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t "schneller-full-export:0.0" \
    "PYTHONUNBUFFERED=1 python3 scripts/extract_schneller_tagebuch.py --output-dir schneller-tagebuch-cs --skip-existing --delay 0.35 2>&1 | tee -a $EXPORT_LOG" C-m
  log "export started"
}

stop_export() {
  pkill -f 'python3 scripts/extract_schneller_tagebuch.py' 2>/dev/null || true
  log "export stopped"
}

hourly_report() {
  local ts count status last
  ts="$(date -u '+%Y-%m-%d %H:%M UTC')"
  count="$(file_count)"
  last="$(last_ok_line)"
  if export_running; then
    status="running"
  else
    status="stopped"
  fi
  echo "[$ts] files=$count status=$status last=$last" >> "$HOURLY_LOG"
  log "hourly: files=$count status=$status"
}

last_file_count="$(file_count)"
last_ok="$(last_ok_line)"
last_progress_epoch="$(date +%s)"
last_hourly_epoch="$(date +%s)"

log "watchdog started (check=${CHECK_INTERVAL_SEC}s stall=${STALL_THRESHOLD_SEC}s files=${last_file_count})"

while true; do
  now="$(date +%s)"

  if export_complete; then
    if export_running; then
      stop_export
    fi
    if [[ ! -f "$COMPLETE_FILE" ]]; then
      mark_complete
    fi
    hourly_report
    sleep "$HOURLY_INTERVAL_SEC"
    continue
  fi

  if ! export_running; then
    log "export not running — starting"
    start_export
    last_progress_epoch="$now"
  else
    current_count="$(file_count)"
    current_ok="$(last_ok_line)"
    if [[ "$current_count" -gt "$last_file_count" ]] || [[ "$current_ok" != "$last_ok" && -n "$current_ok" ]]; then
      last_file_count="$current_count"
      last_ok="$current_ok"
      last_progress_epoch="$now"
    elif (( now - last_progress_epoch > STALL_THRESHOLD_SEC )); then
      log "stall detected (${STALL_THRESHOLD_SEC}s without progress, files=${current_count}) — restarting export"
      stop_export
      sleep 2
      start_export
      last_progress_epoch="$now"
    fi
  fi

  if (( now - last_hourly_epoch >= HOURLY_INTERVAL_SEC )); then
    hourly_report
    last_hourly_epoch="$now"
  fi

  sleep "$CHECK_INTERVAL_SEC"
done
