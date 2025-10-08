---
description: Validate SSOT + build and emit a PASS/FAIL marker
---
# GOAL
Run SSOT guard + build. Write validate.report.md with a clear marker:
- `result: PASS` or `result: FAIL`

# RUN
- bash scripts/agentic-ssot-guard.sh

# WRITE
- apps/smartpin-tpo/projects/smartpin-tpo/ops/validate.report.md
