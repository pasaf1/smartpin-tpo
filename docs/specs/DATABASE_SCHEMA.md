---
TAGS: #database #schema #sql #rls
READ_THIS_WHEN: שינוי סכמת DB, טריגרים, אינדקסים, RLS (Row-Level Security)
KEYWORDS_HINT: "ALTER TABLE", "CREATE TABLE", "policy", "supabase"
SEE_ALSO: ../quick-ref/ENUMS.md, ../quick-ref/CROSS_DOMAIN.md
STRICT_RULES: FK=roof_id, severity=TEXT, Status=ReadyForInspection, DefectLayer=SURFACE_PREP
ROUTER: This file is single-purpose. If your task doesn’t match READ_THIS_WHEN exactly, STOP and pick another file. Read minimally. Report FILES_READ.
---
# Database Schema Specification
- RLS בכל הטבלאות (Row-Level Security).
- Primary FK: **roof_id**.
- `severity` מסוג **TEXT**.
- Status: **ReadyForInspection** בלבד.


# <TITLE>
## Tags: #scoped #minimal-read
## Read This When: <bullets>
## Hard Rules: <bullets>
## Procedures: <short numbered steps>
## Examples: <2-3 minimal snippets>
## Related:
- ../quick-ref/ENUMS.md
- ../quick-ref/VIOLATIONS.md
- ../quick-ref/CROSS_DOMAIN.md
