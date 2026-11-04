#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm ci --prefix posta

python3 -m pip install --user -r ostatni/requirements.txt
