#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <PORT>" >&2
  exit 1
fi

PORT="$1"

adb devices | awk 'NR>1 && $2=="device"{print $1}' | while read -r serial; do
  echo "Setting reverse tcp:${PORT} -> tcp:${PORT} on $serial..."
  adb -s "$serial" reverse "tcp:${PORT}" "tcp:${PORT}"
done
