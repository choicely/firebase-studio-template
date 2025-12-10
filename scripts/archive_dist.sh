#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="dist"
OUT_DIR="out/bundles"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

make_bundle() {
  local platform="$1"
  local src_dir="$DIST_DIR/$platform"

  if [[ ! -d "$src_dir" ]]; then
    echo "Skip $platform: $src_dir not found" >&2
    return 0
  fi

  local archive_path
  local mode

  if tar --help 2>&1 | grep -qi 'zstd'; then
    archive_path="$OUT_DIR/${platform}.tar.zst"
    mode="tar-zstd"
  elif command -v zstd >/dev/null 2>&1; then
    archive_path="$OUT_DIR/${platform}.tar.zst"
    mode="pipe-zstd"
  else
    archive_path="$OUT_DIR/${platform}.tar.gz"
    mode="gzip"
  fi

  echo "Creating bundle: $archive_path (mode: $mode)"

  case "$mode" in
    tar-zstd)
      if ! tar --zstd -cf "$archive_path" -C "$DIST_DIR" "$platform"; then
        echo "Failed to create archive for $platform, cleaning up" >&2
        rm -f "$archive_path"
        return 1
      fi
      ;;
    pipe-zstd)
      if ! tar -cf - -C "$DIST_DIR" "$platform" | zstd -T0 -o "$archive_path"; then
        echo "Failed to create archive for $platform (zstd pipe), cleaning up" >&2
        rm -f "$archive_path"
        return 1
      fi
      ;;
    gzip)
      if ! tar -czf "$archive_path" -C "$DIST_DIR" "$platform"; then
        echo "Failed to create archive for $platform (gzip), cleaning up" >&2
        rm -f "$archive_path"
        return 1
      fi
      ;;
  esac
}

pids=()
platforms=()

run_platform() {
  local platform="$1"
  (
    set -e
    echo "[${platform}] npm run bundle:${platform}..."
    npm run "bundle:${platform}"

    echo "[${platform}] make_bundle ${platform}..."
    make_bundle "${platform}"
    echo "[${platform}] done."
  ) &
  pids+=($!)
  platforms+=("$platform")
}

run_platform android
run_platform ios
run_platform web

status=0
for i in "${!pids[@]}"; do
  pid="${pids[$i]}"
  platform="${platforms[$i]}"
  if ! wait "$pid"; then
    echo "[${platform}] pipeline failed" >&2
    status=1
  fi
done

exit "$status"
