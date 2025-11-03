# SmartPin TPO – פלטפורמת בדיקות מקצועית לאיטום גגות (Professional Roof Inspection Platform)

מובייל־פרסט (Mobile‑first) לניהול איכות (QA/QC) בפרויקטי בנייה תעשייתית. נבנה עם **Next.js 15**, **TypeScript**, **Supabase**, ו‑**React‑Konva**. כולל שיתופיות בזמן אמת, ניהול תקלות ע"י פינים היררכיים (Hierarchical Pins), שכבות בדיקה (Inspection Layers), יצוא (Export) ל‑PDF/CSV, ו‑PWA.
## 🤖 עבודה עם Claude Code

1. **תמיד קרא את ה-README הזה לפני שאתה מתחיל משימה חדשה**
2. **עקוב אחר חוקי-הברזל ללא פשרות** - במיוחד Nullability ו-TypeScript
3. **השתמש ב-Normalization API** מ-`src/lib/typing/normalize.ts` בכל מיפוי DB→UI
4. **לפני שינוי משמעותי** - STOP ותעד את ההחלטה

### סדר עדיפויות בפתרון בעיות:
1. חוקי-ברזל (Hard Rules) - אין פשרות
2. דוגמאות קוד בדוקומנטציה - עקוב אחריהם
3. ארכיטקטורה קיימת - אל תשבור דפוסים
4. אם משהו לא ברור - שאל לפני שאתה מבצע


---
## 🚀 תקציר (Overview)
- **מערכת פינים היררכית**: הורים (1,2,3) וילדים (1.1, 1.2, 1.3).
- **תהליך סטטוסים בן שלושה מצבים**: `Open → ReadyForInspection → Closed` עם הסתעפות `InDispute`.
- **תיעוד צילומים כפול**: פתיחה (Opening) וסגירה (Closing) לכל פין.
- **מעברים אוטומטיים**: העלאת צילום סגירה → עדכון ל‑`ReadyForInspection`.
- **MTTR**: חישוב **Mean Time To Repair** אוטומטי.
- **שכבות בסגנון Bluebeam**: נראות/אטימות/נעילה/סדר תצוגה (z‑index).
- **שיתופיות בזמן אמת**: Realtime + Activity Log + Chat + Mentions + Presence.
- **מובייל־פרסט**: PWA, מחוות מגע (Gestures), Bottom Sheet.

---
## 🧭 חוקי־ברזל (Hard Rules)
### Nullability ו‑TypeScript
1. ערכים שמקורם DB נשארים `T | null`. **לא** מסמנים `?` (optional) במקום `| null`.
2. **אין** להזרים `undefined` לשדה שלא מצהיר `undefined`.
3. **אסור** `any` ו‑**אסור** `!` (Non‑Null Assertion).
4. שכבת נרמול אחידה למיפוי DB→UI (ראו `normalize.ts`).

### React Hooks
1. אין `hooks` בתוך תנאים/לולאות.
2. תלותים (Dependencies) ב‑`useEffect/useCallback/useMemo` מדויקים.
3. אין `setState` בזמן render; תופעות לוואי רק בתוך `useEffect`.

### Next Image & A11y
1. מחליפים `<img>` ב‑`<Image />` מ‑`next/image`.
2. לכל תמונה `alt`. לתמונות דקורטיביות: `alt=""`.
3. למקורות חיצוניים: להגדיר `images.remotePatterns` ב‑`next.config.js`.

### מדיניות שינוי קוד
- שינוי מינימלי. לא שוברים API ציבורי, לא משנים `database.types.ts`.
- החלטות ארכיטקטורה/UX משמעותיות – לעצור ולתעד (STOP) לקבלת הנחיה.

---
## 🔐 משתני סביבה (Environment Variables)
```env
# Client (נגיש בדפדפן)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server‑only (לעולם לא נשלח לקליינט)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
> ה‑Service Role נשמר **רק** בצד שרת. הפצה לקליינט – אסורה.

---
## 🛠️ דרישות (Prerequisites)
- **Node.js 18.17+** או **20.x LTS**
- **pnpm 9+**
- חשבון **Supabase** + PostGIS ב‑PostgreSQL

---
## ⚙️ התקנה והרצה (Setup)
```bash
pnpm install
cp .env.example .env.local  # עריכת אישורים של Supabase
pnpm dev
```
בניית פרודקשן והפעלה:
```bash
pnpm build
pnpm start
```
בדיקות (אם קיימות):
```bash
pnpm test
```

---
## 🧩 נרמול טיפוסים (Normalization API)
`src/lib/typing/normalize.ts`
```ts
export const S = (v: string | null | undefined, f = ''): string => v ?? f
export const N = (v: number | null | undefined, f = 0): number => v ?? f
export const B = (v: boolean | null | undefined, f = false): boolean => v ?? f
export const A = <T>(v: T[] | null | undefined, f: T[] = []): T[] => v ?? f
export const D = (v: string | null | undefined): string | null => (v ?? null)
```
שימוש במיפוי DB→UI:
```ts
// דוגמה: DbUser → UiUser
import { S, D } from '@/lib/typing/normalize'

export type UiUser = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'QA_Manager' | 'Inspector' | 'Contractor' | 'PM' | 'CEO' | 'OM' | 'CM' | 'Site_Manager'
  created_at: string | null
  last_login_at: string | null
}

const toUiUser = (u: DbUser): UiUser => ({
  id: u.id,
  name: S(u.full_name).trim() || S(u.email, 'User'),
  email: S(u.email),
  role: u.role as UiUser['role'],
  created_at: D(u.created_at),
  last_login_at: D(u.last_login_at),
})
```

---
## 🎯 סטטוסים וחומרה (Status & Severity)
- **Status**: `Open | ReadyForInspection | Closed | InDispute`
- **Severity**: `Critical | High | Medium | Low`

מיפוי צבעים (UI):
```ts
export const statusColors = {
  Open: '#ef4444',
  ReadyForInspection: '#f59e0b',
  Closed: '#10b981',
  InDispute: '#fb923c',
} as const
```

### כללי אוטומציה (Automation Rules)
- העלאת צילום סגירה (Closing Photo) משנה סטטוס של **ילד** ל‑`ReadyForInspection`.
- סטטוס **הורה** נשאר צהוב (`ReadyForInspection`) עד שכל הילדים `Closed`.
- `MTTR` מחושב מעת `created_at` עד `closed_at` ברמת פין.

---
## 🧱 מבנה בסיס נתונים (Database Schema – excerpt)
> טיפוסי Enum מומלצים כ‑`CHECK`/`ENUM` לפי מדיניות הפרויקט.

```sql
-- projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE,
  actual_start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  contractor_id UUID,
  roof_plan_url TEXT NOT NULL,
  stakeholders UUID[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pins (Parent)
CREATE TABLE pins (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  seq_number INTEGER NOT NULL,
  x_position NUMERIC(6,4),  -- 0-1 normalized
  y_position NUMERIC(6,4),
  issue_type TEXT,          -- INC | COR | TradeDamage | QualityControl
  defect_type TEXT,
  defect_layer TEXT,        -- DENSDECK | INSULATION | SURFACE_PREP | TPO | VB
  status TEXT DEFAULT 'Open',       -- Open | ReadyForInspection | Closed | InDispute
  severity TEXT,                    -- Critical | High | Medium | Low
  opening_photo_url TEXT,
  closing_photo_url TEXT,
  created_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  mttr_hours INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (closed_at - created_at))/3600
  ) STORED
);

-- pin_children (Child)
CREATE TABLE pin_children (
  id UUID PRIMARY KEY,
  parent_pin_id UUID NOT NULL,
  child_seq TEXT NOT NULL,   -- "1.1", "1.2", ...
  x_position NUMERIC(6,4),
  y_position NUMERIC(6,4),
  status TEXT DEFAULT 'Open',
  opening_photo_url TEXT,
  closing_photo_url TEXT
);

-- activity_logs (Audit + Chat integration)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  pin_id UUID,
  action TEXT,         -- 'status_changed' | 'photo_uploaded' | 'child_added'
  details JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---
## 🖼️ Konva/Canvas – דוגמה מתוקנת (TSX)
```tsx
import { Group, Circle, Text } from 'react-konva'

const statusColors = {
  Open: '#ef4444',
  ReadyForInspection: '#f59e0b',
  Closed: '#10b981',
  InDispute: '#fb923c',
} as const

type PinMarkerProps = {
  pin: { x_position: number; y_position: number; seq_number: number; status: keyof typeof statusColors }
  stageWidth: number
  stageHeight: number
  scale: number
  onClick?: () => void
  onMouseEnter?: () => void
}

export function PinMarker({ pin, stageWidth, stageHeight, scale, onClick, onMouseEnter }: PinMarkerProps) {
  return (
    <Group
      x={pin.x_position * stageWidth}
      y={pin.y_position * stageHeight}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <Circle radius={15 / scale} fill={statusColors[pin.status]} stroke="#fff" strokeWidth={2} />
      <Text text={String(pin.seq_number)} fontSize={12 / scale} fill="white" />
    </Group>
  )
}
```

---
## 🧵 שיתופיות ו‑Activity Log
```ts
// לוג אוטומטי לכל פעולה בפין
async function logActivity(action: 'status_changed' | 'photo_uploaded' | 'child_added', details: Record<string, any>) {
  await supabase.from('activity_logs').insert({ pin_id: currentPin.id, action, details, user_id: currentUser.id })
  broadcastToChat({ type: 'activity', message: formatActivityMessage(action, details) })
}

// שימוש לדוגמה
async function onPhotoUpload(childId: string, url: string) {
  await logActivity('photo_uploaded', { photo_type: 'closing', child_id: childId, ts: new Date().toISOString() })
}
```

---
## 🔔 התראות (Notifications)
```ts
async function notifyStakeholders(projectId: string, event: { pin_seq: string; message: string; pin_id: string }) {
  const { data: project } = await supabase.from('projects').select('stakeholders').eq('id', projectId).single()
  for (const userId of project?.stakeholders ?? []) {
    await sendPushNotification(userId, { title: `Issue ${event.pin_seq} Updated`, body: event.message, data: { pinId: event.pin_id } })
  }
}
```

---
## 📱 מובייל וביצועים (Mobile & Performance)
- **PWA** עם Service Worker ו‑Offline.
- **Lazy Loading** לרכיבים/תמונות שאינם בפריים.
- **Thumbnail Generation** לפני העלאה/תצוגה לתיעוד.
- **Pagination** בטבלאות גדולות.

דוגמת יצירת תמונת תצוגה (thumbnail):
```ts
export async function generateThumbnail(imageUrl: string): Promise<string> {
  const img = new Image()
  img.crossOrigin = 'anonymous' // למקרה של CORS
  img.src = imageUrl
  await img.decode()

  const canvas = document.createElement('canvas')
  canvas.width = 150
  canvas.height = 150
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, 150, 150)
  return canvas.toDataURL('image/jpeg', 0.7)
}
```

---
## 🧾 יצוא (Export)
### PDF (jsPDF)
> מומלץ להמיר תמונות ל‑DataURL/Blob לפני `addImage` כדי להימנע מ‑CORS.
```ts
import jsPDF from 'jspdf'

export async function generatePinPDF(pin: { id: string; seq_number: number; children: any[] }, companyLogoDataURL: string, pinMapSnapshotDataURL: string) {
  const doc = new jsPDF()
  doc.addImage(companyLogoDataURL, 'PNG', 10, 10, 50, 20)
  doc.text(`Issue ID: ${pin.id}`, 10, 40)
  doc.addImage(pinMapSnapshotDataURL, 'PNG', 10, 50, 190, 100)

  pin.children.forEach((child, i) => {
    if (i > 0) doc.addPage()
    if (child.opening_photo_data_url) doc.addImage(child.opening_photo_data_url, 'JPEG', 10, 20, 85, 85)
    if (child.closing_photo_data_url) doc.addImage(child.closing_photo_data_url, 'JPEG', 105, 20, 85, 85)
    doc.text(`Pin ${child.seq}`, 10, 110)
  })

  doc.save(`Issue_${pin.seq_number}.pdf`)
}
```

### CSV
- יצוא נתונים טבלאיים ללא תמונות. זמין מ‑Projects Hub ו‑Roof Dashboard.

---
## 🧱 Next.js – הגדרות תמונות חיצוניות (next.config.js)
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'YOUR-PROJECT.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}
module.exports = nextConfig
```

---
## 🧪 איכות קוד (Quality Gates)
### ESLint + TypeScript
```bash
pnpm exec eslint . --max-warnings=0
pnpm exec tsc -p tsconfig.json --noEmit
```

### Husky + lint-staged (מומלץ)
`pre-commit` לדוגמה:
```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged || exit 1
```
`package.json` (קטע):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "pnpm exec eslint --max-warnings=0",
      "pnpm exec tsc -p tsconfig.json --noEmit"
    ]
  }
}
```

---
## 🧱 ארכיטקטורה – מבט על (Architecture Overview)
```
src/
├─ app/                   # Next.js App Router
├─ components/
│  ├─ dashboard/
│  ├─ pins/
│  ├─ roof/
│  └─ chat/
├─ lib/
│  ├─ typing/normalize.ts
│  ├─ mappers/            # DB→UI mapping
│  ├─ supabase/           # קליינטים/שירותים
│  └─ utils/
└─ public/
```

---
## תרומה (Contributing)
- שמור על חוקי‑הברזל לעיל.
- PRs עוברים `tsc --noEmit` ו‑`eslint . --max-warnings=0`.
- שינויי DB/Schema עוברים דרך הגירה (Migration) מסודרת וביקורת.

---
## רישיון (License)
Private – All rights reserved.

## ⚠️ For AI Assistants
1) Read MASTER_SPEC.md
2) Read docs/CLAUDE.md
3) Use STOP on violations

