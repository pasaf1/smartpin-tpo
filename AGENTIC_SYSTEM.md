# 🤖 SmartPin TPO - Agentic Automation System

**Status:** ✅ PRODUCTION READY
**Version:** 1.0.0
**Created:** October 5, 2025

---

## 🎯 Purpose

Autonomous engineering pipeline that analyzes, plans, and implements code changes safely — without touching live code until approved.

Think of it as **CI/CD powered by AI** with full human control.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  /pipeline-smartpin                         │
│                    (Orchestrator)                           │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬────────────┬─────────────┐
    │                 │            │             │
    ▼                 ▼            ▼             ▼
┌────────┐      ┌─────────┐  ┌───────────┐ ┌──────────┐
│ /prime │ ───> │ /plan   │─>│/implement │>│/validate │
│        │      │         │  │           │ │          │
└────────┘      └─────────┘  └───────────┘ └──────────┘
    │                │             │             │
    │                │             │             │
    ▼                ▼             ▼             ▼
┌────────────────────────────────────────────────────┐
│        projects/smartpin-tpo/ops/                  │
├────────────────────────────────────────────────────┤
│  • prime.report.md       (codebase analysis)       │
│  • plan.report.md        (task roadmap)            │
│  • implement.report.md   (changes log)             │
│  • validate.report.md    (build status)            │
│  • staging/              (safe code changes)       │
│  • changeset.manifest.json                         │
└────────────────────────────────────────────────────┘
                       │
                       │ Manual Review
                       ▼
            ┌─────────────────────┐
            │ bash apply_changeset│
            └─────────────────────┘
                       │
                       ▼
                  Live Codebase
```

---

## 📋 Commands Reference

### `/pipeline-smartpin`
**Master orchestrator** - Runs full automation cycle.

```bash
# Executes:
1. /prime smartpin
2. /plan smartpin
3. /implement smartpin
4. Generates pipeline.summary.md
```

**Output:** `projects/smartpin-tpo/ops/pipeline.summary.md`

---

### `/prime smartpin`
**Codebase health analysis**

**What it does:**
- Scans project structure
- Checks build status
- Analyzes database schema
- Identifies issues (P0 → P3)
- Calculates health score

**Output:** `projects/smartpin-tpo/ops/prime.report.md`

**Example report:**
```md
Health Score: 7.5/10
- 2 Critical issues (P0)
- 3 High priority (P1)
- Build: PASSING with 33 warnings
```

---

### `/plan smartpin`
**Implementation roadmap creation**

**Input:** prime.report.md
**What it does:**
- Prioritizes tasks (P0 → P3)
- Breaks down complex work
- Estimates effort
- Identifies dependencies
- Creates risk mitigation

**Output:**
- `projects/smartpin-tpo/ops/plan.report.md`
- `apps/smartpin-tpo/specs/plan.md` (persistent)

**Example:**
```md
Phase 1 (P0): Critical Fixes
├── Task 1.1: Fix React Hook violation (4-6h)
├── Task 1.2: Setup testing infrastructure (8-12h)
└── Task 1.3: Clean empty migrations (2-3h)
```

---

### `/implement smartpin`
**Safe implementation in staging**

**Input:**
- prime.report.md
- plan.report.md

**What it does:**
- Implements P0 (Critical) tasks
- Fixes TypeScript errors
- Resolves React Hook violations
- Validates with build/lint/typecheck
- **Writes ONLY to staging/**

**Output:**
- `projects/smartpin-tpo/ops/staging/` (modified files)
- `projects/smartpin-tpo/ops/implement.report.md`
- `projects/smartpin-tpo/ops/changeset.manifest.json`

**⚠️ CRITICAL:**
- **NEVER modifies live code**
- All changes go to `ops/staging/`
- Zero breaking changes allowed

---

### `/validate smartpin`
**Build & SSOT validation**

**What it does:**
- Runs `scripts/agentic-ssot-guard.sh`
- Executes `npm run build`
- Collects ESLint warnings
- Generates fix recommendations

**Output:** `projects/smartpin-tpo/ops/validate.report.md`

**Example:**
```md
✅ Build: PASSING (3.9s)
⚠️ ESLint: 36 warnings
├── react-hooks/exhaustive-deps: 17
├── @next/next/no-img-element: 15
└── jsx-a11y/alt-text: 4
```

---

## 🔧 Scripts Reference

### `bash apply_changeset.sh`
**Deploy staged changes to live code**

**Safety features:**
1. Validates build passes first
2. Creates automatic backup
3. Aborts if build fails
4. Logs everything

**Process:**
```bash
1. Pre-check: npm run build ✅
2. Backup: ops/backup_YYYYMMDD-HHMM/
3. Apply: cp staging/* → src/
4. Log: ops/apply.log
```

**⚠️ Only run after:**
- Reviewing all reports
- Verifying build passes
- Understanding all changes

---

### `scripts/agentic-ssot-guard.sh`
**SSOT consistency validation**

**What it checks:**
- TypeScript type generation
- Enum consistency
- Database schema alignment

**Runs:**
```bash
npm run types:gen
npm run ssot:check
```

---

## 🎮 Usage Workflows

### Full Automation (Recommended)

```bash
# 1. Run complete pipeline
/pipeline-smartpin

# 2. Review generated reports
cat projects/smartpin-tpo/ops/pipeline.summary.md
cat projects/smartpin-tpo/ops/implement.report.md

# 3. Check staging changes
ls -R projects/smartpin-tpo/ops/staging/

# 4. Verify build
npm run build

# 5. Apply changes (if satisfied)
bash apply_changeset.sh
```

---

### Step-by-Step (Manual Control)

```bash
# Step 1: Analyze
/prime smartpin
# Review: ops/prime.report.md

# Step 2: Plan
/plan smartpin
# Review: ops/plan.report.md

# Step 3: Implement (to staging)
/implement smartpin
# Review: ops/implement.report.md
# Check: ops/staging/

# Step 4: Validate
/validate smartpin
# Review: ops/validate.report.md

# Step 5: Apply (manual decision)
bash apply_changeset.sh
```

---

### Quick Validation Only

```bash
# Just check build + SSOT
/validate smartpin

# Review warnings
cat projects/smartpin-tpo/ops/validate.report.md
```

---

## 🛡️ Safety Guardrails

### ✅ What the System WILL Do:
- Read any file for analysis
- Write to `ops/staging/` and `ops/*.md`
- Run builds and tests
- Generate comprehensive reports
- Create backups before apply

### ❌ What the System WILL NOT Do:
- Modify live source code (without apply)
- Make database changes
- Commit to git automatically
- Delete files (except in staging)
- Push to remote

### 🔒 Emergency Stop:
```bash
# If pipeline goes wrong:
1. Interrupt command (Ctrl+C)
2. Check: git status
3. Restore: git restore .
4. Clean: rm -rf projects/smartpin-tpo/ops/staging/
```

---

## 📊 Reports Guide

### prime.report.md
**What to look for:**
- Health score (target: >8.0)
- Critical issues (P0) - fix immediately
- Build status
- Dependencies status

### plan.report.md
**What to look for:**
- Task priorities
- Effort estimates
- Dependencies (blockers)
- Risk assessment

### implement.report.md
**What to look for:**
- Tasks completed
- Build validation (must be ✅)
- Breaking changes (should be 0)
- Files modified (review list)

### validate.report.md
**What to look for:**
- Build status (must pass)
- ESLint warnings (trends)
- SSOT status
- Action items

---

## 🎯 Best Practices

### DO:
✅ Always review reports before apply
✅ Run `/validate` after any manual changes
✅ Keep ops/ directory in git
✅ Read implement.report.md thoroughly
✅ Test locally after apply

### DON'T:
❌ Skip validation step
❌ Apply without reviewing staging
❌ Edit staging files manually
❌ Run multiple pipelines concurrently
❌ Ignore build warnings

---

## 🔄 Typical Scenarios

### Scenario 1: Fix TypeScript Errors
```bash
/pipeline-smartpin
# Reviews ops/implement.report.md
# Sees: "Fixed 5 TypeScript errors"
# Checks: npm run build → ✅ PASSING
bash apply_changeset.sh
```

### Scenario 2: Performance Optimization
```bash
/prime smartpin
# Reviews: ops/prime.report.md
# Sees: "16 image optimization warnings"

/plan smartpin
# Reviews: ops/plan.report.md
# Sees: "Task 2.2: Replace <img> with next/image (2-3h)"

/implement smartpin
# Reviews: ops/implement.report.md
# Checks: ops/staging/src/components/
# Verifies: All images now use next/image

bash apply_changeset.sh
```

### Scenario 3: Pre-Deployment Check
```bash
/validate smartpin
# Reviews: ops/validate.report.md
# Sees: ✅ Build PASSING, 36 warnings
# Decision: Safe to deploy
```

---

## 📈 Metrics & KPIs

### Pipeline Success Metrics:
- ✅ Build must pass
- ✅ Zero P0 issues after implement
- ✅ <5s compilation time
- ✅ Zero breaking changes

### Health Score Targets:
- **Excellent:** 9.0-10.0
- **Good:** 8.0-8.9
- **Fair:** 7.0-7.9 (current)
- **Poor:** <7.0

### Warning Budget:
- ESLint warnings: <40 (current: 36 ✅)
- TypeScript errors: 0 (strict)
- Build failures: 0 (strict)

---

## 🐛 Troubleshooting

### Pipeline Fails at /prime
```bash
# Check:
ls projects/smartpin-tpo/ops/
# If empty, create:
mkdir -p projects/smartpin-tpo/ops/staging
```

### /implement Modifies Live Code
```bash
# Revert:
git restore src/
# Check command definition:
cat .claude/commands/implement-smartpin.md
# Should have: WRITE - projects/smartpin-tpo/ops/staging/**
```

### apply_changeset.sh Fails
```bash
# Check build first:
npm run build
# If fails, fix errors manually or re-run /implement

# Check staging:
ls projects/smartpin-tpo/ops/staging/
# If empty, re-run /implement
```

### SSOT Guard Fails
```bash
# Run manually:
bash scripts/agentic-ssot-guard.sh
# Fix: npm run types:gen
# Fix: npm run ssot:check
```

---

## 🎓 Learning Path

### Beginner:
1. Run `/prime smartpin` and read the report
2. Run `/validate smartpin` to understand current state
3. Browse `ops/` directory

### Intermediate:
1. Run full `/pipeline-smartpin`
2. Review all 4 reports
3. Inspect `ops/staging/` changes
4. Apply with `bash apply_changeset.sh`

### Advanced:
1. Customize commands in `.claude/commands/`
2. Enhance SSOT guard script
3. Add custom validation rules
4. Integrate with CI/CD

---

## 📚 File Structure Reference

```
apps/smartpin-tpo/
├── .claude/
│   └── commands/               # Agent command definitions
│       ├── pipeline-smartpin.md
│       ├── prime-smartpin.md
│       ├── plan-smartpin.md
│       ├── implement-smartpin.md
│       └── validate-smartpin.md
│
├── projects/
│   └── smartpin-tpo/
│       └── ops/                # Agentic operations directory
│           ├── staging/        # Safe code changes (not live)
│           ├── backup_*/       # Auto-backups from apply
│           ├── prime.report.md
│           ├── plan.report.md
│           ├── implement.report.md
│           ├── validate.report.md
│           ├── pipeline.summary.md
│           ├── changeset.manifest.json
│           ├── NOTES.txt
│           └── apply.log
│
├── scripts/
│   └── agentic-ssot-guard.sh  # SSOT validation
│
└── apply_changeset.sh         # Staging → Live deployment
```

---

## 🚀 Quick Start

**First Time Setup:**
```bash
# System is already set up ✅
# Just run:
/pipeline-smartpin
```

**Daily Usage:**
```bash
# Morning: Check codebase health
/prime smartpin

# Before commit: Validate
/validate smartpin

# Weekly: Full pipeline
/pipeline-smartpin
```

---

## 🆘 Support

### Common Issues:
- Pipeline stuck? → Check `projects/smartpin-tpo/ops/*.report.md`
- Build fails? → Run `npm run build` manually
- Staging empty? → Re-run `/implement smartpin`

### Debug Mode:
```bash
# Verbose output:
DEBUG=true /pipeline-smartpin

# Check logs:
cat projects/smartpin-tpo/ops/apply.log
```

---

## 📝 Changelog

### v1.0.0 (2025-10-05)
- ✅ Initial agentic system release
- ✅ All 5 commands operational
- ✅ SSOT guard integration
- ✅ Safe staging workflow
- ✅ Automatic backups

---

## 🎯 Roadmap

### v1.1.0 (Planned)
- [ ] Parallel agent execution
- [ ] Real-time progress streaming
- [ ] Rollback capability
- [ ] CI/CD integration
- [ ] Slack notifications

### v1.2.0 (Planned)
- [ ] Custom agent creation
- [ ] Multi-project support
- [ ] Performance profiling
- [ ] A/B testing support

---

**Status:** 🟢 OPERATIONAL
**Last Updated:** October 5, 2025
**Maintained By:** Claude Code + Human Oversight

---

*🤖 This system is designed to augment, not replace, human engineering judgment.*
