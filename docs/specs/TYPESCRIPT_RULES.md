---
TAGS: #typescript #types #normalization #null
READ_THIS_WHEN: טיפוסים, מיפוי DB→UI, שימוש ב-S/D/N/A (Normalization API)
KEYWORDS_HINT: "type", "interface", "null", "undefined", "any", "!"
STRICT_RULES: אין any/!; DB nullable הוא T | null בלבד
SEE_ALSO: ../quick-ref/VIOLATIONS.md
ROUTER: Single-purpose. Report FILES_READ.
---
# TypeScript Rules & Normalization (S/D/N/A)
- אין `any`, אין `!`.
- Nullables מה-DB נשארים `T | null` (לא `?`, לא `| undefined`).
- שימוש מחייב ב-S(), D(), N(), A().


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
