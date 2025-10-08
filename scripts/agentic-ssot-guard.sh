#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
APP="$ROOT/apps/smartpin-tpo"
cd "$APP"
pm="npm"; [ -f "$ROOT/pnpm-lock.yaml" ] && command -v pnpm >/dev/null && pm="pnpm"

echo "== SSOT guard =="
# optional type-gen & enum checks if exist
if jq -e '.scripts["types:gen"]' package.json >/dev/null 2>&1; then $pm run -s types:gen; fi
if [ -f "$ROOT/scripts/check-enums.mjs" ]; then node "$ROOT/scripts/check-enums.mjs"; fi
# build
$pm run -s build
echo "result: PASS"
