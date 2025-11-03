---
TAGS: #errors #mistakes #fixes
READ_THIS_WHEN: תיקון טעויות נפוצות, תבניות שגיאה
ROUTER: Quick lookup. Report FILES_READ.
---
# Common Violations & Fixes
- **FK**: שימוש ב-`project_id` ❌ → `roof_id` ✅
- **Nullables**: `?` או `| undefined` ❌ → `T | null` ✅
- **Images**: `<img>` ❌ → `next/image` + `alt` ✅
- **Normalization**: fallback ידני ❌ → `S/D/N/A` ✅
- **Status**: "ReadyToInspect" ❌ → `ReadyForInspection` ✅


# Common Violations & Fixes
- WRONG FK `project_id` → use `roof_id`
- Optional `?` for DB-nullables → use `T | null`
- `<img>` usage → replace with `<Image>` + `alt`
- Manual fallbacks → use normalization S/D/N/A
