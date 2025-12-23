#!/usr/bin/env bash
set -euo pipefail

npm run build:all
./scripts/utils/archive_dist.sh
./scripts/api/upload_bundles.sh
