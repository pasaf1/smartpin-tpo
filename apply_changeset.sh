#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(pwd -P)"
STAGING="${STAGING:-apps/smartpin-tpo/projects/smartpin-tpo/ops/staging}"
LOG_DIR="apps/smartpin-tpo/projects/smartpin-tpo/ops"
LOG_FILE="$LOG_DIR/apply.log"
AUTO_STASH=false; NO_BUILD=false; NO_BACKUP=false; MANIFEST_ONLY=false; COMMIT_MSG=""; PUSH_DEST=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto-stash) AUTO_STASH=true;;
    --no-build) NO_BUILD=true;;
    --no-backup) NO_BACKUP=true;;
    --manifest-only) MANIFEST_ONLY=true;;
    --commit) COMMIT_MSG="${2:-}"; shift;;
    --push) PUSH_DEST="${2:-}"; shift;;
    --staging) STAGING="${2:-}"; shift;;
    -h|--help) echo "usage: $0 [--auto-stash] [--no-build] [--no-backup] [--manifest-only] [--commit \"msg\"] [--push \"origin master\"] [--staging PATH]"; exit 0;;
    *) echo "Unknown option: $1"; exit 2;;
  esac; shift
done
mkdir -p "$LOG_DIR"
log(){ echo -e "$*" | tee -a "$LOG_FILE"; }
die(){ echo -e "❌ $*" | tee -a "$LOG_FILE" >&2; exit 1; }
git_dirty(){ [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; }
choose_pm(){ if [[ -f "pnpm-lock.yaml" ]] && command -v pnpm >/dev/null; then echo pnpm; else echo npm; fi; }
pm(){ (cd apps/smartpin-tpo && $(choose_pm) "$@"); }

[[ -d "$STAGING" ]] || die "Staging dir not found: $STAGING"
if ! find "$STAGING" -type f | grep -q .; then die "Staging is empty. Did implement write files?"; fi

log "== 🧩 Apply staged changes =="
log "Staging: $STAGING"

# stash if dirty
if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git_dirty; then
  $AUTO_STASH || die "Working tree not clean (use --auto-stash)"
  log "• Auto-stashing…"; git add -A; git stash push -u -m "apply autostash $(date +%F-%H%M%S)" >/dev/null 2>&1 || true
fi

# pre-build
if ! $NO_BUILD; then log "• Pre-build…"; pm run -s build >/dev/null; log "  ✅ pre-build passed"; fi

# compute file list
if $MANIFEST_ONLY && command -v jq >/dev/null 2>&1 && [[ -f "$STAGING/changeset.manifest.json" ]]; then
  mapfile -t FILES < <(jq -r '.files[]? // empty' "$STAGING/changeset.manifest.json" | sed 's|^\./||')
else
  mapfile -t FILES < <(cd "$STAGING" && find . -type f ! -name "*.md" ! -name "*.log" -print | sed 's|^\./||')
fi
[[ ${#FILES[@]} -gt 0 ]] || die "No files resolved from staging"

# backup
BK=""
if ! $NO_BACKUP; then BK="$LOG_DIR/backup_$(date +%Y%m%d-%H%M%S)"; mkdir -p "$BK"; for f in "${FILES[@]}"; do [ -f "$f" ] && { mkdir -p "$BK/$(dirname "$f")"; cp -f "$f" "$BK/$f"; }; done; log "• Backup → $BK"; fi

# apply
APPLIED=0
for rel in "${FILES[@]}"; do
  mkdir -p "$(dirname "$rel")"; cp -f "$STAGING/$rel" "$rel"; ((APPLIED++)) || true
done
log "• Applied $APPLIED file(s)"

# post-build + rollback
if ! $NO_BUILD; then
  log "• Post-build…"
  if ! pm run -s build >/dev/null; then
    log "❌ post-build failed"
    if [[ -n "$BK" ]]; then
      log "• Rolling back…"
      for rel in "${FILES[@]}"; do
        if [[ -f "$BK/$rel" ]]; then mkdir -p "$(dirname "$rel")"; cp -f "$BK/$rel" "$rel"; else [ -f "$rel" ] && rm -f "$rel"; fi
      done
      pm run -s build >/dev/null || true
    fi
    die "Apply aborted and rolled back"
  fi
  log "  ✅ post-build passed"
fi

# optional commit & push
if [[ -n "$COMMIT_MSG" ]]; then
  git add -A
  git commit -m "$COMMIT_MSG" || true
  log "• committed"
  if [[ -n "$PUSH_DEST" ]]; then
    set -- $PUSH_DEST
    git push "$1" "${2:-}"
    log "• pushed to $PUSH_DEST"
  fi
fi

echo "✅ Apply complete $(date)" | tee -a "$LOG_FILE"
