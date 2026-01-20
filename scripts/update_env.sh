#!/usr/bin/env bash
set -euo pipefail

HOST_TUNNEL_METRO="$(./scripts/utils/open_tunnel.sh "$RCT_METRO_PORT")"
HOST_TUNNEL_METRO="${HOST_TUNNEL_METRO#http://}"
export HOST_TUNNEL_METRO="${HOST_TUNNEL_METRO#https://}"
printf '%s="%s"\n' "HOST_TUNNEL_METRO" "$HOST_TUNNEL_METRO" >> .env

export HOST_TUNNEL_WEB="$(./scripts/utils/open_tunnel.sh "$WEB_PORT")"
printf '%s="%s"\n' "HOST_TUNNEL_WEB" "$HOST_TUNNEL_WEB" >> .env

( ./scripts/api/update_app.sh || true ) &
update_app_pid=$!

./scripts/update_app_key.sh

wait "$update_app_pid" || true
