#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

start_session() {
  local name="$1"
  local dir="$2"
  local cmd="$3"
  if tmux has-session -t "$name" 2>/dev/null; then
    return 0
  fi
  tmux new-session -d -s "$name" -c "$dir" -- bash -lc "$cmd"
}

start_session posta "$ROOT/posta" "exec npm start"

for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "http://127.0.0.1:1430/"; then
    echo "posta http://127.0.0.1:1430"
    exit 0
  fi
  sleep 1
done

echo "dev servers did not become ready" >&2
tmux ls >&2 || true
exit 1
