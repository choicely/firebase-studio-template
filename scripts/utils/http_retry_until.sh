#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 URL EXPECTED_STATUS_CODE"
  exit 1
fi

URL="$1"
EXPECTED_STATUS="$2"

echo "[http_retry_until] Waiting for $EXPECTED_STATUS from:"
echo "  $URL"

while :; do
  status_code="$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)"
  if [[ "$status_code" == "$EXPECTED_STATUS" ]]; then
    echo "[http_retry_until] Got $status_code, url ready."
    break
  fi
  echo "[http_retry_until] Got $status_code, retrying in 1s..."
  sleep 1
done
