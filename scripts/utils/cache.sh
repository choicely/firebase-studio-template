#!/usr/bin/env bash
set -euo pipefail

rm -rf node_modules package-lock.json
npm i
tar -czf node_modules-linux-x86_64-node20.tar.gz node_modules package-lock.json
