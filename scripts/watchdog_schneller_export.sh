#!/usr/bin/env bash
# Watchdog: hourly logging + auto-restart export when stalled.
set -euo pipefail

WORKDIR="/workspace"
OUT="$WORKDIR/schneller-tagebuch-cs"
EXPORT_LOG="$WORKDIR/schneller-export.log"
HOURLY_LOG="$WORKDIR/schneller-hourly.log"
WATCHDOG_LOG="$WORKDIR/schneller-watchdog.log"
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

latest_md_mtime() {
  find "$OUT" -maxdepth 1 -name '*.md' -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | cut -d. -f1
}

last_ok_line() {
  rg '^\[ok\]' "$EXPORT_LOG" 2>/dev/null | tail -1 || true
}

export_running() {
  pgrep -f 'python3 scripts/extract_schneller_tagebuch.py' >/dev/null 2>&1
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

last_progress_epoch="$(latest_md_mtime)"
last_hourly_epoch="$(date +%s)"

log "watchdog started (check=${CHECK_INTERVAL_SEC}s stall=${STALL_THRESHOLD_SEC}s)"

while true; do
  now="$(date +%s)"

  if ! export_running; then
    log "export not running — starting"
    start_export
    last_progress_epoch="$(latest_md_mtime)"
  else
    current_mtime="$(latest_md_mtime)"
    if [[ "$current_mtime" -gt "$last_progress_epoch" ]]; then
      last_progress_epoch="$current_mtime"
    elif (( now - last_progress_epoch > STALL_THRESHOLD_SEC )); then
      log "stall detected (${STALL_THRESHOLD_SEC}s without new file) — restarting export"
      stop_export
      sleep 2
      start_export
      last_progress_epoch="$(latest_md_mtime)"
    fi
  fi

  if (( now - last_hourly_epoch >= HOURLY_INTERVAL_SEC )); then
    hourly_report
    last_hourly_epoch="$now"
  fi

  sleep "$CHECK_INTERVAL_SEC"
done
