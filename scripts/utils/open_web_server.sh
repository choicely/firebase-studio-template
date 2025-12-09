#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 PATH PORT" >&2
  echo "Example: $0 ./public 8001" >&2
  exit 1
fi

SERVE_PATH="$1"
PORT="$2"

SERVER_PID=""

cleanup() {
  trap - INT TERM QUIT EXIT TSTP
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

npx -y http-server "$SERVE_PATH" -p "$PORT" -a 127.0.0.1 \
  --no-dotfiles -r --log-ip -U -c-1 --cors -d false -i false &
SERVER_PID=$!
wait "$SERVER_PID"
status=$?

trap cleanup INT TERM QUIT EXIT TSTP
exit "$status"
