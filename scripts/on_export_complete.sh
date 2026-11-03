#!/usr/bin/env bash
# Auto-commit final export batch when the corpus run finishes.
set -euo pipefail

WORKDIR="/workspace"
cd "$WORKDIR"

count="$(ls schneller-tagebuch-cs/*.md 2>/dev/null | wc -l | tr -d ' ')"
summary="$(rg '^Done\.' schneller-export.log 2>/dev/null | tail -1 || true)"

if git diff --quiet && [[ -z "$(git status --short schneller-tagebuch-cs/)" ]]; then
  echo "[complete] nothing to commit ($count files)"
  exit 0
fi

git add schneller-tagebuch-cs/*.md
git commit -m "$(cat <<EOF
Complete Schneller diary export ($count entries)

$summary
EOF
)"
git push -u origin "$(git branch --show-current)"
echo "[complete] committed and pushed $count files"
