#!/usr/bin/env bash
set -euo pipefail

# ===== settings =====
ROOT="${PWD}"
DOCS_DIR="${ROOT}/docs"
SPECS_DIR="${DOCS_DIR}/specs"
QR_DIR="${DOCS_DIR}/quick-ref"
MASTER="${ROOT}/MASTER_SPEC.md"
README="${ROOT}/README.md"

# ===== helpers =====
ensure_dir() { mkdir -p "$1"; }

prepend_if_missing() {
  # $1=file, $2=regex to detect, $3=content to prepend
  local file="$1" rx="$2" content="$3"
  if [[ -f "$file" ]]; then
    if ! grep -Eq "$rx" "$file"; then
      tmp="$(mktemp)"; printf "%s\n\n" "$content" >"$tmp"; cat "$file" >>"$tmp"; mv "$tmp" "$file"
      echo "↑ prepended banner to $file"
    fi
  else
    printf "%s\n" "$content" >"$file"
    echo "✓ created $file"
  fi
}

write_if_absent() {
  # $1=file, $2=content (write only if file absent)
  local file="$1" content="$2"
  if [[ -f "$file" ]]; then
    echo "• exists $file"
  else
    printf "%s\n" "$content" >"$file"
    echo "✓ created $file"
  fi
}

append_once() {
  # $1=file, $2=marker regex, $3=text to append
  local file="$1" rx="$2" text="$3"
  touch "$file"
  if ! grep -Eq "$rx" "$file"; then
    printf "\n%s\n" "$text" >>"$file"
    echo "↑ appended section to $file"
  fi
}

# ===== directories =====
ensure_dir "$DOCS_DIR"
ensure_dir "$SPECS_DIR"
ensure_dir "$QR_DIR"

# ===== MASTER_SPEC reminder (אם לא קיים ייצור stub) =====
write_if_absent "$MASTER" "# MASTER_SPEC.md\n\n> מקור האמת (Single Source of Truth)."

# ===== banners =====
BANNER_DB="---
TAGS: #database #schema #sql #rls
READ_THIS_WHEN: שינוי סכמת DB, טריגרים, אינדקסים, RLS (Row-Level Security)
KEYWORDS_HINT: \"ALTER TABLE\", \"CREATE TABLE\", \"policy\", \"supabase\"
SEE_ALSO: ../quick-ref/ENUMS.md, ../quick-ref/CROSS_DOMAIN.md
STRICT_RULES: FK=roof_id, severity=TEXT, Status=ReadyForInspection, DefectLayer=SURFACE_PREP
ROUTER: This file is single-purpose. If your task doesn’t match READ_THIS_WHEN exactly, STOP and pick another file. Read minimally. Report FILES_READ.
---"

BANNER_TS="---
TAGS: #typescript #types #normalization #null
READ_THIS_WHEN: טיפוסים, מיפוי DB→UI, שימוש ב-S/D/N/A (Normalization API)
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
READ_THIS_WHEN: Konva Stage/Layer, סיכות (Pins), קואורדינטות נורמליזציה/פיקסלים, Zoom/Pan, מחוות מגע
KEYWORDS_HINT: \"Konva\", \"Stage\", \"Layer\", \"Circle\", \"Group\", \"x_position\", \"y_position\"
STRICT_RULES: קואורדינטות נשמרות 0..1 ומומרות לפיקסלים בתצוגה
SEE_ALSO: ../quick-ref/CROSS_DOMAIN.md
ROUTER: Single-purpose. Report FILES_READ.
---"

BANNER_REALTIME="---
TAGS: #realtime #websocket #supabase-channels #broadcast
READ_THIS_WHEN: הגדרת ערוצים, שידור שינויים, postgres_changes, presence, activity log
KEYWORDS_HINT: \"channel\", \"subscribe\", \"broadcast\", \"realtime\"
STRICT_RULES: שדר רק דלתא; אין payload עודף
ROUTER: Single-purpose. Report FILES_READ.
---"

BANNER_EXPORTS="---
TAGS: #export #pdf #csv #reports
READ_THIS_WHEN: יצוא PDF/CSV, הטמעת לוגו/תמונות, תבניות דוח
KEYWORDS_HINT: \"jsPDF\", \"CSV\", \"export\", \"download\"
ROUTER: Single-purpose. Report FILES_READ.
---"

BANNER_API="---
TAGS: #api #services #business-logic #validation
READ_THIS_WHEN: שירותים (Services), חוקים עסקיים, אוטומציית סטטוס, MTTR
KEYWORDS_HINT: \"service\", \"validate\", \"automation\", \"status\"
ROUTER: Single-purpose. Report FILES_READ.
---"

BANNER_ENUMS="---
TAGS: #enums #constants #values #quick-ref
READ_THIS_WHEN: בדיקת ערכים חוקיים (Status/Severity/IssueType/DefectLayer)
ROUTER: Quick lookup. Report FILES_READ.
---"

BANNER_COLORS="---
TAGS: #colors #styling #ui
READ_THIS_WHEN: מיפוי צבעים ל-Status/Severity
ROUTER: Quick lookup. Report FILES_READ.
---"

BANNER_VIOLATIONS="---
TAGS: #errors #mistakes #fixes
READ_THIS_WHEN: תיקון טעויות נפוצות, תבניות שגיאה
ROUTER: Quick lookup. Report FILES_READ.
---"

BANNER_CROSS="---
TAGS: #cross-domain #multi-file #integration #workflows
READ_THIS_WHEN: משימה מרובת תחומים או Feature מקצה לקצה
ROUTER: Read this first, then route to ONE more spec. Report FILES_READ.
---"

# ===== files content (minimal, production-ready) =====
CLAUDE_MD="# SmartPin TPO — Claude Code Instructions

## 📌 Router Prompt (להדבקה ב-CLAUDE.md ובכל בקשה חשובה)
Read minimally. Pick ONE most relevant file from docs/* based on TAGS/READ_THIS_WHEN.
If ≥2 domains detected, read docs/quick-ref/CROSS_DOMAIN.md first, then the next single required file only.
Report exactly which files you read as: FILES_READ: [\"…\"]. If >2 files, STOP and ask.
Follow STRICT_RULES when present.

## Universal Rules
- Read \`MASTER_SPEC.md\` first only אם הסקופ לא ברור.
- TypeScript: no \`any\`, no \`!\`. DB nullables: \`T | null\` בלבד.
- DB: FK=\`roof_id\`; \`severity\`=TEXT; Status=\`ReadyForInspection\`; DefectLayer=\`SURFACE_PREP\`.
- React: always \`next/image\` עם \`alt\`; אין Hooks בתוך תנאים/לולאות.

## Mapping (קובץ → שימוש)
- DB/SQL/RLS → \`specs/DATABASE_SCHEMA.md\`
- טיפוסים/נרמול → \`specs/TYPESCRIPT_RULES.md\`
- React/Hooks/Images → \`specs/REACT_RULES.md\`
- Canvas/Konva → \`specs/CANVAS_KONVA.md\`
- Realtime → \`specs/REALTIME_SYNC.md\`
- Exports → \`specs/EXPORTS_PDF.md\`
- Business Rules → \`specs/API_SERVICES.md\`
- Quick enums/colors/errors → \`quick-ref/ENUMS.md\`, \`COLORS.md\`, \`VIOLATIONS.md\`
- Multi-domain → \`quick-ref/CROSS_DOMAIN.md\`

## STOP format
STOP: Rule Violation: <rule_name>
File: <path>[:line]
Blocked Action: <desc>
Options:
A) Conservative fix: <desc>
B) Temporary workaround with comment: <desc>
C) Cancel change: <desc>
"

ENUMS_MD="$BANNER_ENUMS
# Quick Reference: Enums & Valid Values

- **PinStatus**: 'Open' | 'ReadyForInspection' | 'Closed' | 'InDispute'
- **Severity (TEXT)**: 'Critical' | 'High' | 'Medium' | 'Low'
- **IssueType**: 'INC' | 'COR' | 'TradeDamage' | 'QualityControl'
- **DefectLayer**: 'DENSDECK' | 'INSULATION' | 'SURFACE_PREP' | 'TPO' | 'VB'
- **UserRole**: 'Admin' | 'QA_Manager' | 'Inspector' | 'Contractor' | 'PM' | 'CEO' | 'OM' | 'CM' | 'Site_Manager'

**זכור (Remember):** ReadyForInspection, SURFACE_PREP, FK=roof_id.
"

COLORS_MD="$BANNER_COLORS
# Colors Mapping (UI)
- Status→Color: Open=#cccccc, ReadyForInspection=#ffd166, Closed=#06d6a0, InDispute=#ef476f
- Severity→Color: Critical=#d90429, High=#ef233c, Medium=#f6bd60, Low=#8d99ae
"

VIOLATIONS_MD="$BANNER_VIOLATIONS
# Common Violations & Fixes
- **FK**: שימוש ב-\`project_id\` ❌ → \`roof_id\` ✅
- **Nullables**: \`?\` או \`| undefined\` ❌ → \`T | null\` ✅
- **Images**: \`<img>\` ❌ → \`next/image\` + \`alt\` ✅
- **Normalization**: fallback ידני ❌ → \`S/D/N/A\` ✅
- **Status**: \"ReadyToInspect\" ❌ → \`ReadyForInspection\` ✅
"

CROSS_MD="$BANNER_CROSS
# Cross-Domain Scenarios

## Real-time updates on Canvas
Order: \`specs/CANVAS_KONVA.md\` → \`specs/REALTIME_SYNC.md\` → \`specs/REACT_RULES.md\` → \`quick-ref/COLORS.md\`.

## Add DB column + show in UI
Order: \`specs/DATABASE_SCHEMA.md\` → regen types → \`specs/TYPESCRIPT_RULES.md\` → \`specs/REACT_RULES.md\`.

## Status automation on photo upload
Order: \`specs/API_SERVICES.md\` → \`specs/DATABASE_SCHEMA.md\` → \`specs/REALTIME_SYNC.md\` → \`quick-ref/ENUMS.md\`.
"

SPEC_DB="$BANNER_DB
# Database Schema Specification
- RLS בכל הטבלאות (Row-Level Security).
- Primary FK: **roof_id**.
- \`severity\` מסוג **TEXT**.
- Status: **ReadyForInspection** בלבד.
"

SPEC_TS="$BANNER_TS
# TypeScript Rules & Normalization (S/D/N/A)
- אין \`any\`, אין \`!\`.
- Nullables מה-DB נשארים \`T | null\` (לא \`?\`, לא \`| undefined\`).
- שימוש מחייב ב-S(), D(), N(), A().
"

SPEC_REACT="$BANNER_REACT
# React & UI Rules
- \`next/image\` בלבד עם \`alt\`.
- Hooks עם תלויות מלאות, אין קריאות Hooks בתוך תנאים/לולאות.
"

SPEC_KONVA="$BANNER_KONVA
# Canvas & Konva Rules
- קואורדינטות נשמרות 0..1 ומומרות לפיקסלים בזמן רינדור.
- תמיכה ב-Zoom/Pan ובמחוות מגע.
"

SPEC_REALTIME="$BANNER_REALTIME
# Realtime Sync
- Supabase channels עם \`postgres_changes\`.
- שידור דלתא מינימלית.
"

SPEC_EXPORTS="$BANNER_EXPORTS
# Exports (PDF/CSV)
- jsPDF עבור PDF, הוצאת CSV ממודלת.
"

SPEC_API="$BANNER_API
# API & Business Logic
- אוטומציית סטטוס, חישובי MTTR, ולידציות.
"

# ===== write files =====
write_if_absent "${DOCS_DIR}/CLAUDE.md" "$CLAUDE_MD"

prepend_if_missing "${QR_DIR}/ENUMS.md"      "^TAGS:.*#enums"        "$ENUMS_MD"
prepend_if_missing "${QR_DIR}/COLORS.md"     "^TAGS:.*#colors"       "$COLORS_MD"
prepend_if_missing "${QR_DIR}/VIOLATIONS.md" "^TAGS:.*#errors"       "$VIOLATIONS_MD"
prepend_if_missing "${QR_DIR}/CROSS_DOMAIN.md" "^TAGS:.*#cross-domain" "$CROSS_MD"

prepend_if_missing "${SPECS_DIR}/DATABASE_SCHEMA.md"   "^TAGS:.*#database"   "$SPEC_DB"
prepend_if_missing "${SPECS_DIR}/TYPESCRIPT_RULES.md"  "^TAGS:.*#typescript" "$SPEC_TS"
prepend_if_missing "${SPECS_DIR}/REACT_RULES.md"       "^TAGS:.*#react"      "$SPEC_REACT"
prepend_if_missing "${SPECS_DIR}/CANVAS_KONVA.md"      "^TAGS:.*#canvas"     "$SPEC_KONVA"
prepend_if_missing "${SPECS_DIR}/REALTIME_SYNC.md"     "^TAGS:.*#realtime"   "$SPEC_REALTIME"
prepend_if_missing "${SPECS_DIR}/EXPORTS_PDF.md"       "^TAGS:.*#export"     "$SPEC_EXPORTS"
prepend_if_missing "${SPECS_DIR}/API_SERVICES.md"      "^TAGS:.*#api"        "$SPEC_API"

# ===== README prompt reminder =====
append_once "$README" "For AI Assistants" "## ⚠️ For AI Assistants (Claude Code / GPT)\n\n1. Read \`MASTER_SPEC.md\` (Single Source of Truth).\n2. Read \`docs/CLAUDE.md\` and use the Router Prompt.\n3. Use STOP format on violations.\n"

echo "✅ Done. Files are in ./docs and quick-ref/specs. Keep them short and strict."
