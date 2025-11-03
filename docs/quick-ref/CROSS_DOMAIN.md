---
TAGS: #cross-domain #multi-file #integration #workflows
READ_THIS_WHEN: משימה מרובת תחומים או Feature מקצה לקצה
ROUTER: Read this first, then route to ONE more spec. Report FILES_READ.
---
# Cross-Domain Scenarios

## Real-time updates on Canvas
Order: `specs/CANVAS_KONVA.md` → `specs/REALTIME_SYNC.md` → `specs/REACT_RULES.md` → `quick-ref/COLORS.md`.

## Add DB column + show in UI
Order: `specs/DATABASE_SCHEMA.md` → regen types → `specs/TYPESCRIPT_RULES.md` → `specs/REACT_RULES.md`.

## Status automation on photo upload
Order: `specs/API_SERVICES.md` → `specs/DATABASE_SCHEMA.md` → `specs/REALTIME_SYNC.md` → `quick-ref/ENUMS.md`.


# Cross-Domain Scenarios
Use this when keywords span domains.

## Real-time updates on Canvas
Read order:
1) CANVAS_KONVA.md
2) REALTIME_SYNC.md
3) REACT_RULES.md
4) COLORS.md

## Add DB column + show in UI
1) DATABASE_SCHEMA.md
2) Regenerate types (db:types)
3) TYPESCRIPT_RULES.md (mapper)
4) REACT_RULES.md (component)

## Status automation on photo upload
1) API_SERVICES.md
2) DATABASE_SCHEMA.md (triggers)
3) REALTIME_SYNC.md (broadcast)
4) ENUMS.md (valid transitions)
