#!/usr/bin/env bash
set -euo pipefail

npm run bundle:all
./scripts/utils/archive_dist.sh
./scripts/api/upload_bundles.sh
