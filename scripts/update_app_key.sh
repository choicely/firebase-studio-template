#!/usr/bin/env bash
set -euo pipefail

NEW_APP_KEY="${CHOICELY_APP_KEY}"

./scripts/update_tasks.sh "${NEW_APP_KEY}" &
raw_name=${CHOICELY_APP_NAME:-}
lower_name=$(printf '%s\n' "$raw_name" | tr '[:upper:]' '[:lower:]')
safe_app_name=${lower_name//[^a-z0-9_-]/-}
./scripts/android/patch_apk.sh "https://github.com/choicely/choicely-sdk-demo-react-native/releases/download/debug/choicely-rn.apk" \
"${NEW_APP_KEY}" \
./out/apk/"$safe_app_name".apk &
export QR_CODE_PATH=./out/qr-download-apk.png
./scripts/create_apk_qr.sh
wait
code -r -g "$QR_CODE_PATH" >/dev/null 2>&1 || true

while :; do
  sleep 1
done
