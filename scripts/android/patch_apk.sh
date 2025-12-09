#!/usr/bin/env bash
set -euo pipefail

: "${APK_KEYSTORE:?Set APK_KEYSTORE to your keystore path}"
: "${APK_KEY_ALIAS:?Set APK_KEY_ALIAS to your key alias}"
: "${APK_STORE_PASS:?Set APK_STORE_PASS to your keystore password}"
: "${APK_KEY_PASS:?Set APK_KEY_PASS to your key password}"

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 BASE_APK NEW_CHOICELY_APP_KEY [OUT_APK]" >&2
  echo "Example: $0 base.apk new_app_key patched.apk" >&2
  exit 1
fi

BASE_APK="$1"
NEW_CHOICELY_APP_KEY="$2"
APK_KEYSTORE_FULL="$(realpath "$APK_KEYSTORE")"

WORKDIR="$(mktemp -d)"
cleanup() {
  trap - INT TERM QUIT EXIT TSTP
  rm -rf "$WORKDIR"
}
trap cleanup INT TERM QUIT EXIT TSTP

TEMP_APK_NAME="base.apk"
if [[ "$BASE_APK" =~ ^https?:// ]]; then
  echo "[patch] Downloading base APK from URL: $BASE_APK" >&2
  curl -fL "$BASE_APK" -o "$WORKDIR/$TEMP_APK_NAME"
else
  echo "[patch] Using local base APK: $BASE_APK" >&2
  cp "$BASE_APK" "$WORKDIR/$TEMP_APK_NAME"
fi

zipalign -c -p 4 "$WORKDIR/$TEMP_APK_NAME" > /dev/null
apksigner verify --print-certs "$WORKDIR/$TEMP_APK_NAME" > /dev/null
# Fails in Firebase Studio???
# aapt dump badging "$WORKDIR/$TEMP_APK_NAME" | head -n 10 > /dev/null

if [[ "$BASE_APK" =~ ^https?:// ]]; then
  apk_dir="$(pwd)"
else
  apk_dir="$(dirname -- "$BASE_APK")"
fi
out_apk="${3:-$apk_dir/patched.apk}"
out_dir="$(dirname -- "$out_apk")"
out_file="$(basename -- "$out_apk")"
mkdir -p "$out_dir"
OUT_APK_FULL="$(realpath "$out_dir")/$out_file"

echo "[patch] Working directory: $WORKDIR"
cd "$WORKDIR"

echo "[patch] Unzipping base APK..."
mkdir extracted
unzip -q $TEMP_APK_NAME -d extracted

cd extracted

CONFIG_PATH="assets/choicely_config.json"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "[patch] ERROR: $CONFIG_PATH not found in APK" >&2
  exit 1
fi

echo "[patch] Patching APK..."

tmp_cfg="$(mktemp)"
jq \
  --arg key "$NEW_CHOICELY_APP_KEY" \
  --arg host "$HOST_TUNNEL_METRO" \
  '.choicely_app_key = $key | .rn_host_dev = $host' \
  "$CONFIG_PATH" > "$tmp_cfg"
mv "$tmp_cfg" "$CONFIG_PATH"

UNSIGNED_APK_NAME="$WORKDIR/unsigned.apk"
rm -f "$UNSIGNED_APK_NAME"

if [ -f resources.arsc ]; then
  zip -0 "$UNSIGNED_APK_NAME" resources.arsc > /dev/null
fi
if [ -d lib ]; then
  zip -r -0 "$UNSIGNED_APK_NAME" lib > /dev/null
fi
zip -r "$UNSIGNED_APK_NAME" . -x "lib/*" "resources.arsc" > /dev/null

echo "[patch] Running zipalign..."
ALIGNED_APK_NAME="$WORKDIR/aligned.apk"
zipalign -p 4 "$UNSIGNED_APK_NAME" "$ALIGNED_APK_NAME"

echo "[patch] Signing APK..."
apksigner sign \
  --ks "$APK_KEYSTORE_FULL" \
  --ks-key-alias "$APK_KEY_ALIAS" \
  --ks-pass "pass:${APK_STORE_PASS}" \
  --key-pass "pass:${APK_KEY_PASS}" \
  --out "$OUT_APK_FULL" \
  --min-sdk-version 24 \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --lib-page-alignment 16384 \
  "$ALIGNED_APK_NAME"

echo "[patch] Done. Output APK: $OUT_APK_FULL"

zipalign -c -p 4 "$OUT_APK_FULL" > /dev/null
apksigner verify --print-certs "$OUT_APK_FULL" > /dev/null
aapt dump badging "$OUT_APK_FULL" | head -n 10 > /dev/null
