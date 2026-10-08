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

start_session folio "$ROOT/folio" "exec npm run web:dev"
# Vite's config sets host:false, so pass an explicit loopback host.
start_session fast-web "$ROOT/fast-manager/app" "exec npm run dev -- --host 127.0.0.1 --port 5173"
start_session fast-sync "$ROOT/fast-manager/sync-server" "exec npm run dev"

for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "http://127.0.0.1:1420/" \
    && curl -sf -o /dev/null "http://127.0.0.1:5173/" \
    && curl -sf -o /dev/null "http://127.0.0.1:3847/api/health"; then
    echo "folio http://127.0.0.1:1420"
    echo "fast-manager http://127.0.0.1:5173"
    echo "fast-sync http://127.0.0.1:3847/api/health"
    exit 0
  fi
  sleep 1
done

echo "dev servers did not become ready" >&2
tmux ls >&2 || true
exit 1
