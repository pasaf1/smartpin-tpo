#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="$(pwd)"
STAGING="$APP_ROOT/projects/smartpin-tpo/ops/staging"
LOG="$APP_ROOT/projects/smartpin-tpo/ops/apply.log"

echo "== Applying staged changes ==" | tee -a "$LOG"

echo "• Validate build before apply…"
npm run build >/dev/null 2>&1 || { echo "Build failed. Abort." | tee -a "$LOG"; exit 1; }

[ -d "$STAGING" ] || { echo "No staging dir: $STAGING" | tee -a "$LOG"; exit 1; }

BK="$APP_ROOT/projects/smartpin-tpo/ops/backup_$(date +%Y%m%d-%H%M)"
mkdir -p "$BK"
echo "• Backup → $BK" | tee -a "$LOG"
cp -R src/components/dashboard "$BK/" 2>/dev/null || true
cp -R src/lib/pins "$BK/" 2>/dev/null || true

echo "• Applying staged files…"
cp -R "$STAGING/"* "$APP_ROOT/"

echo "✅ Applied at $(date)" | tee -a "$LOG"
