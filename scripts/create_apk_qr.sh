#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-${APK_PORT:-}}"
if [ -z "${PORT}" ]; then
  echo "Usage: $0 [PORT]"
  echo "  Either pass PORT as first argument or set APK_PORT in the environment."
  exit 1
fi

./scripts/utils/kill_port.sh "$PORT"
APK_PATH=./out/apk
./scripts/utils/open_web_server.sh "$APK_PATH" "$PORT" &

HOST_TUNNEL_APK=$(./scripts/utils/open_tunnel.sh "$PORT")

if [ -z "${HOST_TUNNEL_APK:-}" ]; then
  echo "[create_apk_qr] ERROR: HOST_TUNNEL_APK was not set by open_tunnel.sh" >&2
  exit 1
fi

echo "HOST_TUNNEL_APK: $HOST_TUNNEL_APK"
printf '%s="%s"\n' "HOST_TUNNEL_APK" "$HOST_TUNNEL_APK" >> .env

raw_name=${CHOICELY_APP_NAME:-}
lower_name=$(printf '%s\n' "$raw_name" | tr '[:upper:]' '[:lower:]')
safe_app_name=${lower_name//[^a-z0-9_-]/-}
./scripts/utils/make_qr.sh "$HOST_TUNNEL_APK/$safe_app_name.apk" "$QR_CODE_PATH"
#./scripts/utils/make_qr.sh "http://127.0.0.1:$PORT/$safe_app_name.apk" "$QR_CODE_PATH"

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
