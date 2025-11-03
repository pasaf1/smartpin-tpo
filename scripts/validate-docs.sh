#!/usr/bin/env bash
set -Eeuo pipefail
shopt -s nullglob dotglob 2>/dev/null || true
miss=0
files=(docs/specs/*.md docs/quick-ref/*.md)
for f in "${files[@]}"; do
  [[ -f "$f" ]] || continue
  if ! grep -q "^TAGS:" "$f" || ! grep -q "^READ_THIS_WHEN:" "$f"; then
    echo "Missing TOP-banner in $f"; miss=1
  fi
done
exit $miss

