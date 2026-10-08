#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm ci --prefix folio
npm ci --prefix fast-manager
npm ci --prefix fast-manager/app
npm ci --prefix fast-manager/sync-server

# Folio's browser suite (npm run test:e2e) needs Chromium and its OS libraries.
npm --prefix folio exec -- playwright install --with-deps chromium

python3 -m pip install --user -r requirements.txt
