# SmartPin-TPO Policy

## Hard Rules
- DB Nullable => T|null. אין ? במקום null. אין undefined ב-UI.
- לא משנים טיפוס/שדה שמגיע מה-DB.
- אין any ואין ! (non-null assertion).
- Hooks: תלויות מדויקות, אין hooks בתנאי/לולאה, אין setState בזמן render.
- Next/Image: כל <img> מוחלף ב-<Image>, לכל תמונה alt. למקורות חיצוניים — images.remotePatterns.
- שינויים מזעריים. אין breaking changes API. אם נדרש — עצירה (STOP).

## Normalization API
- `S()` → string
- `N()` → number
- `B()` → boolean
- `A()` → array
- `D()` → string|null (תאריך/ISO)

## STOP Format
STOP: הפרת חוק: <rule> | קובץ: <path>[:line] | פעולה שנחסמה: <desc> | אפשרויות: 
A) פתרון שמרני, 
B) עקיפה זמנית עם הערה, 
C) ביטול שינוי.
