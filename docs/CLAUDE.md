# SmartPin TPO — Claude Code Instructions

## 📌 Router Prompt
Read minimally. Pick ONE most relevant file from docs/* based on TAGS/READ_THIS_WHEN.
If ≥2 domains detected, read docs/quick-ref/CROSS_DOMAIN.md first, then the next single required file only.
Report exactly which files you read as: FILES_READ: ["…"]. If >2 files, STOP and ask.
Follow STRICT_RULES when present.

## Universal Rules
- TS: no `any`, no `!`; DB nullables: `T | null`.
- DB: FK=`roof_id`; `severity`=TEXT; Status=`ReadyForInspection`; DefectLayer=`SURFACE_PREP`.
- React: use `next/image` + `alt`; no hooks in conditionals/loops.

## Mapping
DB/SQL/RLS → `specs/DATABASE_SCHEMA.md`
Types/Normalization → `specs/TYPESCRIPT_RULES.md`
React/Hooks/Images → `specs/REACT_RULES.md`
Canvas/Konva → `specs/CANVAS_KONVA.md`
Realtime → `specs/REALTIME_SYNC.md`
Exports → `specs/EXPORTS_PDF.md`
Business Rules → `specs/API_SERVICES.md`
Quick refs → `quick-ref/ENUMS.md`, `COLORS.md`, `VIOLATIONS.md`
Cross-domain → `quick-ref/CROSS_DOMAIN.md`

## STOP format
STOP: Rule Violation: <rule_name>
File: <path>[:line]
Blocked Action: <desc>
Options: A) Conservative fix  B) Temporary workaround  C) Cancel

