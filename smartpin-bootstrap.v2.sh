#!/usr/bin/env bash
# SmartPin TPO — One-Shot Bootstrap (v2, safe for Git Bash)
set -Eeuo pipefail
shopt -s nullglob dotglob extglob 2>/dev/null || true

ROOT="${PWD}"
DOCS_DIR="${ROOT}/docs"
SPECS_DIR="${DOCS_DIR}/specs"
QR_DIR="${DOCS_DIR}/quick-ref"
GITHUB_DIR="${ROOT}/.github"
WORKFLOWS_DIR="${GITHUB_DIR}/workflows"
SCRIPTS_DIR="${ROOT}/scripts"
HUSKY_DIR="${ROOT}/.husky"
MASTER="${ROOT}/MASTER_SPEC.md"
README="${ROOT}/README.md"
PKG="${ROOT}/package.json"

say(){ printf "\033[1;32m%s\033[0m\n" "$*"; }
warn(){ printf "\033[1;33m%s\033[0m\n" "$*"; }

ensure_dir(){ mkdir -p "$1"; }

write_file(){ # $1=path $2=content
  mkdir -p "$(dirname "$1")"
  printf "%s\n" "$2" > "$1"
  say "✓ wrote $1"
}

append_once(){ # $1=path $2=marker-regex $3=block
  touch "$1"
  if ! grep -Eq "$2" "$1"; then printf "\n%s\n" "$3" >> "$1"; say "↑ appended to $1"; else say "• already present in $1"; fi
}

prepend_if_missing(){ # $1=file $2=regex $3=content
  local f="$1" rx="$2" content="$3"
  if [[ -f "$f" ]]; then
    if ! grep -Eq "$rx" "$f"; then
      local tmp; tmp="$(mktemp)"
      printf "%s\n\n" "$content" > "$tmp"; cat "$f" >> "$tmp"; mv "$tmp" "$f"
      say "↑ prepended header to $f"
    else
      say "• header exists in $f"
    fi
  else
    write_file "$f" "$content"
  fi
}

# --- dirs
ensure_dir "$DOCS_DIR" "$SPECS_DIR" "$QR_DIR" "$WORKFLOWS_DIR" "$SCRIPTS_DIR" "$HUSKY_DIR"

# --- MASTER_SPEC
[[ -f "$MASTER" ]] || write_file "$MASTER" "# MASTER_SPEC.md

> מקור האמת (Single Source of Truth) לפרויקט SmartPin TPO.
"

# --- banners
BANNER_DB="---
TAGS: #database #schema #sql #rls
READ_THIS_WHEN: שינוי סכמת DB, טריגרים, אינדקסים, RLS
KEYWORDS_HINT: \"ALTER TABLE\", \"CREATE TABLE\", \"policy\", \"supabase\"
SEE_ALSO: ../quick-ref/ENUMS.md, ../quick-ref/CROSS_DOMAIN.md
STRICT_RULES: FK=roof_id, severity=TEXT, Status=ReadyForInspection, DefectLayer=SURFACE_PREP
ROUTER: Single-purpose. Read minimally. Report FILES_READ.
---"
BANNER_TS="---
TAGS: #typescript #types #normalization #null
READ_THIS_WHEN: טיפוסים, מיפוי DB→UI, S/D/N/A
KEYWORDS_HINT: \"type\", \"interface\", \"null\", \"undefined\", \"any\", \"!\"
STRICT_RULES: אין any/!; DB nullable הוא T | null בלבד
SEE_ALSO: ../quick-ref/VIOLATIONS.md
ROUTER: Single-purpose. Report FILES_READ.
---"
BANNER_REACT="---
TAGS: #react #hooks #a11y #image
READ_THIS_WHEN: קומפוננטות, useEffect/useState/useCallback, טפסים, תמונות
KEYWORDS_HINT: \"useEffect\", \"useState\", \"<Image>\", \"onClick\", \"alt\"
STRICT_RULES: תמיד next/image; alt חובה; אין Hooks בתוך תנאים/לולאות
SEE_ALSO: ../quick-ref/CROSS_DOMAIN.md
ROUTER: Single-purpose. Report FILES_READ.
---"
BANNER_KONVA="---
TAGS: #canvas #konva #visualization #coordinates
READ_THIS_WHEN: Konva Stage/Layer, Pins, קואורדינטות 0..1, Zoom/Pan, מחוות מגע
KEYWORDS_HINT: \"Konva\", \"Stage\", \"Layer\", \"Circle\", \"Group\", \"x_position\", \"y_position\"
STRICT_RULES: קואורדינטות נשמרות 0..1; המרה לפיקסלים בתצוגה
ROUTER: Single-purpose. Report FILES_READ.
---"
BANNER_REALTIME="---
TAGS: #realtime #websocket #supabase-channels #broadcast
READ_THIS_WHEN: ערוצים, postgres_changes, presence, activity log
KEYWORDS_HINT: \"channel\", \"subscribe\", \"broadcast\", \"realtime\"
STRICT_RULES: שידור דלתא מינימלית
ROUTER: Single-purpose. Report FILES_READ.
---"
BANNER_EXPORTS="---
TAGS: #export #pdf #csv #reports
READ_THIS_WHEN: יצוא PDF/CSV, לוגו/תמונות, תבניות דוח
KEYWORDS_HINT: \"jsPDF\", \"CSV\", \"export\", \"download\"
ROUTER: Single-purpose. Report FILES_READ.
---"
BANNER_API="---
TAGS: #api #services #business-logic #validation
READ_THIS_WHEN: Services, חוקים עסקיים, אוטומציה, MTTR
KEYWORDS_HINT: \"service\", \"validate\", \"automation\", \"status\"
ROUTER: Single-purpose. Report FILES_READ.
---"
BANNER_ENUMS="---
TAGS: #enums #constants #values #quick-ref
READ_THIS_WHEN: בדיקת ערכים חוקיים
ROUTER: Quick lookup. Report FILES_READ.
---"
BANNER_COLORS="---
TAGS: #colors #styling #ui
READ_THIS_WHEN: מיפוי צבעים ל-Status/Severity
ROUTER: Quick lookup. Report FILES_READ.
---"
BANNER_VIOLATIONS="---
TAGS: #errors #mistakes #fixes
READ_THIS_WHEN: תיקון טעויות נפוצות
ROUTER: Quick lookup. Report FILES_READ.
---"
BANNER_CROSS="---
TAGS: #cross-domain #multi-file #integration #workflows
READ_THIS_WHEN: משימה מרובת תחומים או Feature מקצה לקצה
ROUTER: Read this first, then ONE more spec. Report FILES_READ.
---"

# --- docs/CLAUDE.md
CLAUDE_MD="# SmartPin TPO — Claude Code Instructions

## 📌 Router Prompt
Read minimally. Pick ONE most relevant file from docs/* based on TAGS/READ_THIS_WHEN.
If ≥2 domains detected, read docs/quick-ref/CROSS_DOMAIN.md first, then the next single required file only.
Report exactly which files you read as: FILES_READ: [\"…\"]. If >2 files, STOP and ask.
Follow STRICT_RULES when present.

## Universal Rules
- TS: no \`any\`, no \`!\`; DB nullables: \`T | null\`.
- DB: FK=\`roof_id\`; \`severity\`=TEXT; Status=\`ReadyForInspection\`; DefectLayer=\`SURFACE_PREP\`.
- React: use \`next/image\` + \`alt\`; no hooks in conditionals/loops.

## Mapping
DB/SQL/RLS → \`specs/DATABASE_SCHEMA.md\`
Types/Normalization → \`specs/TYPESCRIPT_RULES.md\`
React/Hooks/Images → \`specs/REACT_RULES.md\`
Canvas/Konva → \`specs/CANVAS_KONVA.md\`
Realtime → \`specs/REALTIME_SYNC.md\`
Exports → \`specs/EXPORTS_PDF.md\`
Business Rules → \`specs/API_SERVICES.md\`
Quick refs → \`quick-ref/ENUMS.md\`, \`COLORS.md\`, \`VIOLATIONS.md\`
Cross-domain → \`quick-ref/CROSS_DOMAIN.md\`

## STOP format
STOP: Rule Violation: <rule_name>
File: <path>[:line]
Blocked Action: <desc>
Options: A) Conservative fix  B) Temporary workaround  C) Cancel
"
write_file "${DOCS_DIR}/CLAUDE.md" "$CLAUDE_MD"

# --- quick-ref
prepend_if_missing "${QR_DIR}/ENUMS.md" "^TAGS:.*#enums" "$BANNER_ENUMS
# Quick Reference: Enums & Valid Values
- PinStatus: 'Open' | 'ReadyForInspection' | 'Closed' | 'InDispute'
- Severity(TEXT): 'Critical' | 'High' | 'Medium' | 'Low'
- IssueType: 'INC' | 'COR' | 'TradeDamage' | 'QualityControl'
- DefectLayer: 'DENSDECK' | 'INSULATION' | 'SURFACE_PREP' | 'TPO' | 'VB'
- UserRole: 'Admin' | 'QA_Manager' | 'Inspector' | 'Contractor' | 'PM' | 'CEO' | 'OM' | 'CM' | 'Site_Manager'
זכור: ReadyForInspection, SURFACE_PREP, FK=roof_id."
prepend_if_missing "${QR_DIR}/COLORS.md" "^TAGS:.*#colors" "$BANNER_COLORS
# Colors Mapping (UI)
Status→Color: Open=#cccccc, ReadyForInspection=#ffd166, Closed=#06d6a0, InDispute=#ef476f
Severity→Color: Critical=#d90429, High=#ef233c, Medium=#f6bd60, Low=#8d99ae"
prepend_if_missing "${QR_DIR}/VIOLATIONS.md" "^TAGS:.*#errors" "$BANNER_VIOLATIONS
# Common Violations & Fixes
- FK: project_id ❌ → roof_id ✅
- Nullables: ? / | undefined ❌ → T | null ✅
- <img> ❌ → next/image + alt ✅
- Manual fallbacks ❌ → S/D/N/A ✅
- ReadyToInspect ❌ → ReadyForInspection ✅"
prepend_if_missing "${QR_DIR}/CROSS_DOMAIN.md" "^TAGS:.*#cross-domain" "$BANNER_CROSS
# Cross-Domain Scenarios
- Real-time canvas: specs/CANVAS_KONVA.md → specs/REALTIME_SYNC.md → specs/REACT_RULES.md → quick-ref/COLORS.md
- Add DB column + UI: specs/DATABASE_SCHEMA.md → regen types → specs/TYPESCRIPT_RULES.md → specs/REACT_RULES.md
- Status automation: specs/API_SERVICES.md → specs/DATABASE_SCHEMA.md → specs/REALTIME_SYNC.md → quick-ref/ENUMS.md"

# --- specs
prepend_if_missing "${SPECS_DIR}/DATABASE_SCHEMA.md" "^TAGS:.*#database" "$BANNER_DB
# Database Schema
RLS בכל הטבלאות; FK=roof_id; severity=TEXT; Status=ReadyForInspection."
prepend_if_missing "${SPECS_DIR}/TYPESCRIPT_RULES.md" "^TAGS:.*#typescript" "$BANNER_TS
# TypeScript Rules & Normalization
אין any/!; Nullables הם T | null; חובה S/D/N/A במיפוי DB→UI."
prepend_if_missing "${SPECS_DIR}/REACT_RULES.md" "^TAGS:.*#react" "$BANNER_REACT
# React & UI Rules
next/image + alt; Hooks עם תלויות מלאות; אין Hooks בתוך תנאים/לולאות."
prepend_if_missing "${SPECS_DIR}/CANVAS_KONVA.md" "^TAGS:.*#canvas" "$BANNER_KONVA
# Canvas & Konva
קואורדינטות 0..1 → פיקסלים; Zoom/Pan; מחוות מגע."
prepend_if_missing "${SPECS_DIR}/REALTIME_SYNC.md" "^TAGS:.*#realtime" "$BANNER_REALTIME
# Realtime
Supabase channels + postgres_changes; שידור דלתא בלבד."
prepend_if_missing "${SPECS_DIR}/EXPORTS_PDF.md" "^TAGS:.*#export" "$BANNER_EXPORTS
# Exports
jsPDF ל-PDF; CSV יצוא אחיד."
prepend_if_missing "${SPECS_DIR}/API_SERVICES.md" "^TAGS:.*#api" "$BANNER_API
# API & Business Logic
אוטומציית סטטוס; MTTR; ולידציות."

# --- README hook
append_once "$README" "For AI Assistants" "## ⚠️ For AI Assistants (Claude Code / GPT)
Before any code:
1) Read \`docs/CLAUDE.md\` Router
2) Use @mentions (e.g., \`@docs/specs/DATABASE_SCHEMA.md\`)
3) Report FILES_READ: [\"…\"]
4) Use STOP on violations
"

# --- scripts/validate-docs.sh (robust to Git Bash)
VALIDATE_DOCS='#!/usr/bin/env bash
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
'
write_file "${SCRIPTS_DIR}/validate-docs.sh" "$VALIDATE_DOCS"
chmod +x "${SCRIPTS_DIR}/validate-docs.sh"

# --- GitHub Actions workflow
QUALITY_YML='name: quality
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm -s type-check
      - run: pnpm -s lint --max-warnings=0
      - name: Hard bans (<img>, any, non-null !)
        run: |
          ! git grep -nE "<img[ >]" -- ":!docs" || (echo "Found <img>"; exit 1)
          ! git grep -nE ":[[:space:]]*any(\\W|$)" -- ":(exclude)docs" || (echo "Found any"; exit 1)
          ! git grep -nE "![.]" -- ":(exclude)docs" || (echo "Found non-null (!)"; exit 1)
      - name: Enum spelling
        run: |
          ! git grep -nE "ReadyToInspect" || (echo "Use ReadyForInspection"; exit 1)
          ! git grep -nE "SURFACE[[:space:]]+PREP" || (echo "Use SURFACE_PREP"; exit 1)
      - run: bash scripts/validate-docs.sh
      - name: Prevent DB type drift without docs update
        run: |
          CHANGED="$(git diff --name-only origin/${{ github.base_ref }}... || true)"
          if echo "$CHANGED" | grep -q "^src/lib/database.types.ts$"; then
            echo "$CHANGED" | grep -Eq "^docs/specs/(DATABASE_SCHEMA|TYPESCRIPT_RULES)\\.md$" \
            || (echo "database.types.ts changed without docs/specs update"; exit 1)
          fi
'
write_file "${WORKFLOWS_DIR}/quality.yml" "$QUALITY_YML"

# --- PR template
write_file "${GITHUB_DIR}/pull_request_template.md" "## Scope
- [ ] Single-domain
- [ ] Cross-domain (explain)

## FILES_READ
- docs/...

## Spec Compliance
- [ ] FK=roof_id
- [ ] Status=ReadyForInspection
- [ ] SURFACE_PREP
- [ ] No <img> / any / !

## Tests/Notes
"

# --- package.json merge (safe without jq)
if [[ ! -f "$PKG" ]]; then
  write_file "$PKG" '{
  "name": "smartpin-tpo",
  "private": true,
  "type": "module",
  "scripts": {
    "type-check": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint .",
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src/lib/database.types.ts"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --max-warnings=0", "tsc -p tsconfig.json --noEmit"],
    "*": "prettier -c"
  }
}'
else
  # append scripts blocks if missing, without jq
  grep -q '"type-check"' "$PKG" || sed -i.bak 's/"scripts": {/"scripts": {\n    "type-check": "tsc -p tsconfig.json --noEmit",/;' "$PKG" 2>/dev/null || true
  grep -q '"lint"' "$PKG" || sed -i.bak 's/"scripts": {/"scripts": {\n    "lint": "eslint .",/;' "$PKG" 2>/dev/null || true
  grep -q '"db:types"' "$PKG" || sed -i.bak 's/"scripts": {/"scripts": {\n    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src\/lib\/database.types.ts",/;' "$PKG" 2>/dev/null || true
  grep -q '"lint-staged"' "$PKG" || append_once "$PKG" '"lint-staged"' '
  ,
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --max-warnings=0", "tsc -p tsconfig.json --noEmit"],
    "*": "prettier -c"
  }'
fi

# --- Husky + lint-staged
if command -v pnpm >/dev/null 2>&1; then PKG_MGR=pnpm; elif command -v npm >/dev/null 2>&1; then PKG_MGR=npm; else PKG_MGR=""; fi
if [[ -n "${PKG_MGR}" ]]; then
  $PKG_MGR add -D husky lint-staged >/dev/null 2>&1 || true
  npx husky init >/dev/null 2>&1 || true
  write_file "${HUSKY_DIR}/pre-commit" "pnpm lint-staged || npx lint-staged"
  chmod +x "${HUSKY_DIR}/pre-commit" || true
else
  warn "pnpm/npm לא נמצאו. התקן ידנית devDeps: husky, lint-staged."
fi

say "——————————————"
say "Bootstrap v2 complete."
say "Docs:        ./docs/**"
say "Workflow:    .github/workflows/quality.yml"
say "PR template: .github/pull_request_template.md"
say "Validate:    bash scripts/validate-docs.sh"
say "Husky:       .husky/pre-commit"
