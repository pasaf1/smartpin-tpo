#!/usr/bin/env bash
set -euo pipefail
echo "== SSOT Guard =="

if [ -d packages/core-types ] || [ -d packages/core-validators ] || [ -d packages/core-adapters ] || [ -d packages/config ]; then
  echo "• types:gen";  npm run types:gen || { echo "types:gen failed"; exit 1; }
  echo "• ssot:check"; npm run ssot:check || { echo "ssot:check failed"; exit 1; }
else
  echo "• SSOT packages not found; skipping."
fi
echo "== SSOT OK =="
