---
description: Run SSOT guard and build; write validate.report.md
---
# GOAL
Produce projects/smartpin-tpo/ops/validate.report.md with pass/fail + timings.

# RUN
- bash scripts/agentic-ssot-guard.sh
- npm run build || pnpm build || yarn build

# REPORT
- projects/smartpin-tpo/ops/validate.report.md
