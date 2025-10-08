---
description: Implement plan changes to STAGING ONLY with a full changeset manifest (fail if no edits)
---
# GOAL
Write ALL code edits to:
- apps/smartpin-tpo/projects/smartpin-tpo/ops/staging/**/*
Also write:
- apps/smartpin-tpo/projects/smartpin-tpo/ops/changeset.manifest.json
- apps/smartpin-tpo/projects/smartpin-tpo/ops/implement.report.md
- apps/smartpin-tpo/projects/smartpin-tpo/ops/NOTES.txt

# RULES
- NEVER modify live files outside /ops/staging/*
- If **no code files** were written to /ops/staging after implementation, explicitly write implement.report.md with:
  - `status: NO_CHANGES_WRITTEN`
  - a short reason, and **treat this as a failure requiring human review**.

# FOCUS
- Fix child pin typing/mapping (id,status,severity,x,y)
- Single 'use client' at top (line 1) where needed
- Use next/image only where valuable; otherwise justify disable
- Clean critical hook dep warnings (add/remove deps or memoize)

# READ
- apps/smartpin-tpo/specs/plan.md
- apps/smartpin-tpo/src/**/*
- apps/smartpin-tpo/next.config.*

# WRITE
- apps/smartpin-tpo/projects/smartpin-tpo/ops/staging/**/*
- apps/smartpin-tpo/projects/smartpin-tpo/ops/changeset.manifest.json
- apps/smartpin-tpo/projects/smartpin-tpo/ops/implement.report.md
- apps/smartpin-tpo/projects/smartpin-tpo/ops/NOTES.txt
