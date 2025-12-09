#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
  echo "Error: could not determine repo root. Are you inside a Git repo?" >&2
  exit 1
fi
cd "$REPO_ROOT"

START_PORT=8930

for offset in {0..9}; do
  port=$((START_PORT + offset))
  ./scripts/android/adb_reverse.sh "$port" &
done

wait
