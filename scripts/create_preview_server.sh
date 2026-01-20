#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-${PREVIEW_SERVER_PORT:-}}"
if [ -z "${PORT}" ]; then
  echo "Usage: $0 [PORT]"
  echo "  Either pass PORT as first argument or set PREVIEW_SERVER_PORT in the environment."
  exit 1
fi

./scripts/utils/kill_port.sh "$PORT"
SERVER_STATIC_PATH=./out/static
mkdir -p "$SERVER_STATIC_PATH"
./scripts/utils/open_web_server.sh "$SERVER_STATIC_PATH" "$PORT" &

HOST_TUNNEL_SERVER=$(./scripts/utils/open_tunnel.sh "$PORT")

if [ -z "${HOST_TUNNEL_SERVER:-}" ]; then
  echo "ERROR: HOST_TUNNEL_SERVER was not set by open_tunnel.sh" >&2
  exit 1
fi

echo "HOST_TUNNEL_SERVER: $HOST_TUNNEL_SERVER"
printf '%s="%s"\n' "HOST_TUNNEL_SERVER" "$HOST_TUNNEL_SERVER" >> .env

cleanup() {
  trap - INT TERM QUIT TSTP
  echo "Cleaning up..."
  local pidfile="./tmp/cloudflared-${PORT}.pid"
  if [ -f "$pidfile" ]; then
    echo "Found cloudflared pidfile $pidfile"
    local cf_pid
    cf_pid="$(cat "$pidfile" 2>/dev/null || true)"
    echo "cf_pid: $cf_pid"
    if [[ -n "${cf_pid:-}" ]] && kill -0 "$cf_pid" 2>/dev/null; then
      echo "Killing cloudflared process with pid $cf_pid"
      kill -9 "$cf_pid" 2>/dev/null || true
    fi
  fi
}
trap cleanup INT TERM QUIT TSTP
