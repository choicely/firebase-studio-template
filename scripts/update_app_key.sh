#!/usr/bin/env bash
set -euo pipefail

NEW_APP_KEY="${CHOICELY_APP_KEY}"

raw_name=${CHOICELY_APP_NAME:-}
lower_name=$(printf '%s\n' "$raw_name" | tr '[:upper:]' '[:lower:]')
safe_app_name=${lower_name//[^a-z0-9_-]/-}
apk_path=./out/apk/"$safe_app_name".apk

if [ -f "$apk_path" ]; then
  echo "APK already exists at: $apk_path"
else
  ./scripts/android/patch_apk.sh \
    "https://github.com/choicely/choicely-sdk-demo-react-native/releases/download/v0.0.8-alpha/choicely-rn.apk" \
    "${NEW_APP_KEY}" \
    "$apk_path" &
fi

export QR_CODE_PATH=./res/preview/qr.png
./scripts/create_apk_qr.sh
wait

while :; do
  sleep 1
done
