---
description: Run prime → plan → implement in background, staging-only
---
# RUN
/background "/prime smartpin" report="projects/smartpin-tpo/ops/prime.report.md"
/background "/plan smartpin" report="projects/smartpin-tpo/ops/plan.report.md"
/background "/implement smartpin" report="projects/smartpin-tpo/ops/implement.report.md"

# REPORT
- projects/smartpin-tpo/ops/pipeline.summary.md
