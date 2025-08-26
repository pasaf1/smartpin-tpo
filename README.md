# SmartPin TPO – Project Guide (EN/HE)

A Next.js application for managing Pins/INCR, photos, statuses, severities, and scoped chat. This document is designed for both humans and AI agents to understand the stack, rules, pages, data model, and conventions.

אפליקציית Next.js לניהול Pins/INCR, תמונות, סטטוסים וחומרות, כולל צ׳אט בהיקפים שונים. מסמך זה נועד לאנשים ולסוכני AI כדי להבין את הסטאק, כללי הפיתוח, העמודים, מודל הנתונים והקונבנציות.

---

## What’s new (highlights)
- Parent/Child pins with status timeline (Open → ReadyForInspection → Closed) and parent aggregates. New UI: PinDetailsModalV2.
- Photos stored in a dedicated public bucket `pin-photos`; child closure requires a Closure photo.
- Project creation is RLS-gated: only roles Admin or QA_Manager can create projects. UI is gated accordingly with clear messages.
- Chat improvements: edit/delete actions, with a DELETE RLS policy migration included.
- SSR-safe Supabase client with diagnostics and `/api/env-check` + `/api/health` endpoints.
- Simplified ESLint (flat config) and hardened `next.config.js`. Legacy demo pages were removed.

---

## Stack and Technologies (English)
- Framework: Next.js 15 (App Router), React 18
- Language: TypeScript
- UI: Tailwind CSS + shadcn/ui (Card, Button, Select, Badge, Textarea, Input, ScrollArea, etc.)
- Dates: date-fns (format, getISOWeek)
- Realtime/DB: Supabase (no Prisma)
- State/Logic: Custom hooks (e.g., usePins, usePinStatusManager, usePhotoAnalytics, useChatSystem)
- Build: next build
- Package manager: PNPM preferred

## סטאק וטכנולוגיות (עברית)
- פריימוורק: Next.js 15 (App Router), React 18
- שפה: TypeScript
- UI: Tailwind CSS + shadcn/ui (Card, Button, Select, Badge, Textarea, Input, ScrollArea ועוד)
- תאריכים: date-fns (format, getISOWeek)
- Realtime/DB: Supabase (ללא Prisma)
- State/Logic: הוקים מותאמים אישית (למשל usePins, usePinStatusManager, usePhotoAnalytics, useChatSystem)
- בנייה: next build
- מנהל חבילות: PNPM מועדף

---

## Package Manager and Scripts (English)
- Preferred: PNPM
   - Install: pnpm install
   - Dev: pnpm dev
   - Build: pnpm build
   - Start: pnpm start
- npm equivalents also work if used consistently:
   - npm install | npm run dev | npm run build | npm run start
- Recommend setting in package.json: "packageManager": "pnpm@9.x"
- Node.js >= 18.17
- Monorepo note: if using pnpm-workspace.yaml, ensure apps/smartpin-tpo is included.
  - If you see a Next.js "inferred workspace root" warning (multiple lockfiles), either remove extra lockfiles or set `outputFileTracingRoot` in `next.config.js` to silence it.

## מנהל חבילות וסקריפטים (עברית)
- מועדף: PNPM
   - התקנה: pnpm install
   - פיתוח: pnpm dev
   - בנייה: pnpm build
   - הרצה: pnpm start
- ניתן להשתמש גם ב-npm אם שומרים על עקביות:
   - npm install | npm run dev | npm run build | npm run start
- מומלץ להוסיף ל-package.json: "packageManager": "pnpm@9.x"
- Node.js גרסה 18.17 ומעלה
- הערת מונורפו: אם קיים pnpm-workspace.yaml ודאו שהתיקייה apps/smartpin-tpo כלולה.
  - אם מתקבלת אזהרת Next.js לגבי root מזוהה ויותר מקובץ lock אחד, הסירו lock מיותר או הגדירו outputFileTracingRoot בקובץ next.config.js.

---

## ESLint (English)
- Use Flat Config at apps/smartpin-tpo/eslint.config.mjs with Next presets (next/core-web-vitals, next/typescript).
- Do not import eslint-plugin-react manually (Next presets load it).
- Remove old .eslintrc.* files to avoid conflicts.
- Note: Next may warn that its ESLint plugin wasn’t detected when using flat config; this is informational in our setup.

## ESLint (עברית)
- השתמשו ב-Flat Config בקובץ apps/smartpin-tpo/eslint.config.mjs עם ה-Presets של Next (next/core-web-vitals, next/typescript).
- אין לייבא eslint-plugin-react ידנית (ה-Presets של Next כבר טוענים אותו).
- הסירו קבצי .eslintrc.* ישנים כדי למנוע קונפליקטים.
- הערה: ייתכן שתופיע אזהרה ש-Next ESLint plugin לא זוהה עם flat config; אצלנו היא אינפורמטיבית.

---

## Conventions for AI Agents (English)
- Do not add Prisma or hardcoded demo data. Use Supabase and existing hooks.
- Do not call React hooks conditionally.
- Keep barrel exports (index.ts) consistent with actual module export types (default vs named).
- Use only supported UI variants (e.g., Button: 'default' | 'outline' | 'ghost').
- Respect chat scopes: 'global' | 'roof' | 'pin'.
- Keep types centralized; import from shared modules rather than duplicating.

## קונבנציות עבור סוכני AI (עברית)
- לא להוסיף Prisma ולא דאטה דמו קשיח. להשתמש ב-Supabase ובהוקים קיימים.
- לא לקרוא להוקים של React בתנאי.
- לשמור על barrel exports (index.ts) בהתאם לייצוא בפועל (default מול named).
- להשתמש רק ב-variants נתמכים ב-UI (למשל Button: 'default' | 'outline' | 'ghost').
- לכבד scopes של הצ׳אט: 'global' | 'roof' | 'pin'.
- לרכז טיפוסים ולייבא ממיקומים משותפים במקום לשכפל.

---

## Pages Map and Relationships (English)
1) /login
    - Purpose: User authentication.
    - On success: redirect to / (or to preserved callback URL).
    - Permissions: Guests only (if logged in → redirect to /).
    - Chat scope: none.

2) /
    - File: src/app/page.tsx
    - Purpose: Home dashboard/overview; lists real projects from Supabase.
    - Data: Projects via Supabase; create project modal (Admin/QA_Manager only).
    - Navigation: to /roofs/[id], /roofs/[id]/settings, /admin/users.
    - Chat scope: global.

3) /roofs
    - File: src/app/roofs/page.tsx (if present)
    - Purpose: List/index of roofs with filters.
    - Navigation: to /roofs/[id], settings at /roofs/[id]/settings.
    - Chat scope: global or roof when drilling down.

4) /roofs/[id]
    - File: src/app/roofs/[id]/page.tsx (if present)
    - Purpose: Roof details with pins.
    - Components: PinCanvas, PinDetailsModalV2, PhotoDashboard, ChatPanel.
    - Navigation: to settings /roofs/[id]/settings.
    - Chat scope: roof (scope_id = roofId).

5) /roofs/[id]/settings
    - File: src/app/roofs/[id]/settings/page.tsx
    - Purpose: Roof configuration (name, code, plan image, origin, activation, etc.).
    - Permissions: authorized roles only.
    - Navigation: back to /roofs/[id].
    - Chat scope: none.

6) /admin/users
    - File: src/app/admin/users/page.tsx
    - Purpose: Admin user management (search, role/status changes).
    - Permissions: Admin only.
    - Navigation: back to /.
    - Chat scope: none.

Navigation graph (text):
- /login → /
- / → /roofs, /roofs/[id], /roofs/[id]/settings, /admin/users
- /roofs → /roofs/[id]
- /roofs/[id] ↔ /roofs/[id]/settings
- /admin/users → /

## מפת עמודים וקשרים (עברית)
1) /login
    - מטרה: התחברות משתמשים.
    - בהצלחה: ניתוב ל-/ (או לכתובת חזרה שמורה).
    - הרשאות: אורחים בלבד (מחובר → ניתוב ל-/).
    - היקף צ׳אט: אין.

2) /
    - קובץ: src/app/page.tsx
    - מטרה: דשבורד ביתי/סקירה; מציג פרויקטים אמיתיים מסביבת Supabase.
    - דאטה: פרויקטים מסופבאייס; יצירת פרויקט אפשרית רק ל-Admin/QA_Manager.
    - ניווט: ל-/roofs/[id], הגדרות /roofs/[id]/settings, /admin/users.
    - היקף צ׳אט: global.

3) /roofs
    - קובץ: src/app/roofs/page.tsx (אם קיים)
    - מטרה: אינדקס גגות עם סינון.
    - ניווט: ל-/roofs/[id], להגדרות /roofs/[id]/settings.
    - היקף צ׳אט: global או roof בהעמקה.

4) /roofs/[id]
    - קובץ: src/app/roofs/[id]/page.tsx (אם קיים)
    - מטרה: פרטי גג עם פינים.
    - רכיבים: PinCanvas, PinDetailsModalV2, PhotoDashboard, ChatPanel.
    - ניווט: להגדרות /roofs/[id]/settings.
    - היקף צ׳אט: roof (scope_id = roofId).

5) /roofs/[id]/settings
    - קובץ: src/app/roofs/[id]/settings/page.tsx
    - מטרה: הגדרות גג (שם, קוד, תמונת תכנית, מקור, מצב פעילות וכו').
    - הרשאות: תפקידים מורשים בלבד.
    - ניווט: חזרה ל-/roofs/[id].
    - היקף צ׳אט: אין.

6) /admin/users
    - קובץ: src/app/admin/users/page.tsx
    - מטרה: ניהול משתמשים (חיפוש, שינוי תפקיד/סטטוס).
    - הרשאות: Admin בלבד.
    - ניווט: חזרה ל-/.
    - היקף צ׳אט: אין.

גרף ניווט (טקסט):
- /login → /
- / → /roofs, /roofs/[id], /roofs/[id]/settings, /admin/users
- /roofs → /roofs/[id]
- /roofs/[id] ↔ /roofs/[id]/settings
- /admin/users → /

---

## Domain Model (English)

Pin
- id: string
- seq_number?: number
- title?: string | null
- description?: string | null
- status: 'Open' | 'ReadyForInspection' | 'Closed'
- severity: 'Critical' | 'High' | 'Medium' | 'Low' | null
- x_position: number
- y_position: number
- created_at: string | Date
- completed_at?: string | Date | null
- parent_pin_id?: string | null
- parent?: Pin | null
- children?: Pin[]

PinChild
- id: string
- pin_id: string (parent)
- child_code: string (display like 1.1, 1.2 …)
- status: 'Open' | 'ReadyForInspection' | 'Closed'
- open_photo_id?: string | null
- closure_photo_id?: string | null
- created_at: string | Date

Roof
- id: string
- project_id?: string | null
- code?: string | null
- name: string
- building?: string | null
- plan_image_url?: string | null
- roof_plan_url?: string | null
- zones?: unknown[] | null
- stakeholders?: unknown[] | null
- origin_lat?: number | null
- origin_lng?: number | null
- is_active?: boolean | null
- created_at?: string | Date

Photo
- id: string
- pin_id?: string | null
- child_id?: string | null
- url: string
- thumb_url?: string | null
- width?: number | null
- height?: number | null
- exif?: Record<string, unknown> | null
- uploader_id?: string | null
- created_at: string | Date
- tags?: string[] | null

ChatMessage
- id: string
- scope: 'global' | 'roof' | 'pin'
- scope_id?: string | null
- user_id: string
- content: string
- mentions?: string[] | null
- created_at: string | Date

User
- id: string
- name?: string | null
- email?: string | null
- role?: 'Inspector' | 'Foreman' | 'Supervisor' | 'Contractor' | 'Admin' | 'QA_Manager' | string
- status?: 'active' | 'inactive'

## מודל דומיין (עברית)

Pin (פין)
- id: string
- seq_number?: number
- title?: string | null
- description?: string | null
- status: 'Open' | 'ReadyForInspection' | 'Closed'
- severity: 'Critical' | 'High' | 'Medium' | 'Low' | null
- x_position: number
- y_position: number
- created_at: string | Date
- completed_at?: string | Date | null
- parent_pin_id?: string | null
- parent?: Pin | null
- children?: Pin[]

PinChild (תת־פין)
- id: string
- pin_id: string (הורה)
- child_code: string (תצוגה כמו 1.1, 1.2 …)
- status: 'Open' | 'ReadyForInspection' | 'Closed'
- open_photo_id?: string | null
- closure_photo_id?: string | null
- created_at: string | Date

Roof (גג)
- id: string
- project_id?: string | null
- code?: string | null
- name: string
- building?: string | null
- plan_image_url?: string | null
- roof_plan_url?: string | null
- zones?: unknown[] | null
- stakeholders?: unknown[] | null
- origin_lat?: number | null
- origin_lng?: number | null
- is_active?: boolean | null
- created_at?: string | Date

Photo (תמונה)
- id: string
- pin_id?: string | null
- child_id?: string | null
- url: string
- thumb_url?: string | null
- width?: number | null
- height?: number | null
- exif?: Record<string, unknown> | null
- uploader_id?: string | null
- created_at: string | Date
- tags?: string[] | null

ChatMessage (הודעת צ׳אט)
- id: string
- scope: 'global' | 'roof' | 'pin'
- scope_id?: string | null
- user_id: string
- content: string
- mentions?: string[] | null
- created_at: string | Date

User (משתמש)
- id: string
- name?: string | null
- email?: string | null
- role?: 'Inspector' | 'Foreman' | 'Supervisor' | 'Contractor' | 'Admin' | 'QA_Manager' | string
- status?: 'active' | 'inactive'

---

## Key Components and Contracts (English)
- PinDetailsModalV2
   - Purpose: Parent/child pin UI, timeline (Open → Ready → Closed), per-child Open/Closure images, prevents closing a child without a closure photo. Aggregates Closed/Total on parent.
   - Hooks: usePinWithChildren, useCreatePinChild, useUpdatePinChildStatus, useAttachChildPhoto.
- PinCanvas
   - Displays pins on a plan using normalized x_position/y_position (0..1).
- PhotoDashboard
   - Props: { pinId: string }; upload, manage, and analyze photos per pin/child.
- ChatPanel
   - Scope-aware chat: 'global' | 'roof' | 'pin'. Use useChatSystem without conditional hook calls.
- usePinStatusManager
   - Child pin close flow, validation, parent status updates, and summary functions.

## רכיבים מרכזיים וחוזים (עברית)
- PinDetailsModalV2
   - מטרה: ממשק הורה/תתי־פינים, ציר סטטוס (Open → Ready → Closed), תמונות פתיחה/סגירה לכל תת־פין, ומניעת סגירה ללא תמונת Closure. מציג סיכום Closed/Total ברמת ההורה.
   - הוקים: usePinWithChildren, useCreatePinChild, useUpdatePinChildStatus, useAttachChildPhoto.
- PinCanvas
   - מציג פינים על גבי תכנית עם x_position/y_position מנורמלים (0..1).
- PhotoDashboard
   - Props: { pinId: string }; העלאה, ניהול ואנליזה של תמונות לפי פין/תת־פין.
- ChatPanel
   - צ׳אט לפי היקף: 'global' | 'roof' | 'pin'. להשתמש ב-useChatSystem ללא קריאה מותנית להוקים.
- usePinStatusManager
   - תהליך סגירת תתי־פינים, ולידציה, עדכון סטטוס הורה ופונקציות סיכום.

---

## Do / Don’t (English)
- Do: use PNPM and existing hooks/types; keep exports aligned (default vs named).
- Do: respect chat scopes per page; keep UI variants valid.
- Don’t: add Prisma or hardcoded demo data.
- Don’t: call hooks conditionally.

## כן / לא (עברית)
- כן: להשתמש ב-PNPM ובהוקים/טיפוסים קיימים; לשמור על ייצוא נכון (default מול named).
- כן: לשמור על scopes לפי דף; להשתמש ב-UI variants חוקיים.
- לא: להוסיף Prisma או דאטה דמו קשיח.
- לא: לקרוא להוקים בתנאי.

# SmartPin TPO v1.0.0

A professional roof inspection and project management application built with Next.js and Supabase.

## 🚀 Features

- **Pin-based Inspection System** - Parent/child pins, status timeline, and aggregates
- **Real-time Collaboration** - Live updates and scoped chat (global/roof/pin), edit/delete
- **Photo Management** - Upload to `pin-photos`, per-child Open/Closure pairs  
- **Project Analytics** - Quality trends and performance metrics
- **Mobile Responsive** - Works seamlessly on all devices
- **Offline Support** - Continue working without internet connection
- **Export Capabilities** - Generate reports in multiple formats

## 📋 Prerequisites

- Node.js 18+ 
- Supabase Account
- Vercel Account (for deployment)

## 🛠️ Production Setup

### 1. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env.local
```

Update `.env.local` with your production values:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # server-side only

# App
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 2. Supabase Database Setup

1. Create a new Supabase project at https://supabase.com
2. Apply the SQL migrations from `supabase/migrations/` in order:
   - 20240826_initial_schema.sql
   - 20240827_functions_views.sql
   - 20240828_rls_policies.sql
   - 20240829_chats_delete_policy.sql
3. Ensure RLS is enabled and policies are active. Project INSERT is allowed only for roles `Admin` or `QA_Manager`.
4. Create a public storage bucket named `pin-photos` and grant read access for public URLs.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Build & Test Locally

```bash
# Run production build
pnpm build

# Test production build locally
pnpm start
```

### 5. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`

3. Deploy automatically on push to main branch

## 🔧 Development

### Local Development

```bash
pnpm dev
```

Open http://localhost:3000 to view the application.

### Production Build Script

Use the enhanced build script for production deployments:

```bash
node scripts/build-production.js
```

This script includes:
- TypeScript type checking
- ESLint validation  
- Database migrations
- Optimized production build
- Bundle analysis

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                 # Utilities and configurations
│   ├── supabase/       # Database client setup
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Helper functions
├── styles/             # Global styles
└── types/              # TypeScript definitions
```

## 👩‍💻 Admin/Operations Scripts

Run from `apps/smartpin-tpo/`:

```bash
# Create an admin user (prints user id)
pnpm node scripts/create-admin-user.mjs

# Generate a one-time admin magic link
pnpm node scripts/generate-admin-link.mjs

# Set an admin password (requires service role key)
pnpm node scripts/set-admin-password.mjs
```

Notes:
- After first login, ensure the user row in `users` has `role = 'Admin'` or `QA_Manager` for project creation.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser; it is used server-side only.

## 🚀 Production Features

- **Real-time Updates** - Live collaboration enabled
- **Analytics** - User behavior and performance tracking
- **Error Monitoring** - Comprehensive error tracking
- **Performance Optimization** - Caching and bundle optimization
- **Security** - RLS policies and authentication

## 📊 Monitoring & Analytics

The application includes built-in monitoring for:
- User engagement metrics
- Performance monitoring
- Error tracking and reporting
- Quality trend analysis

## 🔐 Security

- Row Level Security (RLS) enabled on all database tables
- Secure file upload with validation
- Authentication via Supabase Auth
- Environment variable protection

Project creation permissions:
- Only `Admin` or `QA_Manager` can INSERT into `projects` per RLS. The UI disables the action for other roles and shows a clear message.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build validation
5. Submit a pull request

## 📝 License

Private - All rights reserved

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review the troubleshooting guide
- Contact the development team

---

**SmartPin TPO v1.0.0** - Professional roof inspection made simple.

---

## 🔎 Troubleshooting

- Failed to create project (permission denied / RLS):
  - Ensure your `users.role` is `Admin` or `QA_Manager`.
  - Verify `20240828_rls_policies.sql` was applied.
  - Sign out/in to refresh the JWT after role changes.

- Next.js "inferred workspace root" warning (multiple lockfiles):
  - Remove extra lockfiles or set `outputFileTracingRoot` in `next.config.js` to your monorepo root.

- ESLint warning about Next plugin not detected:
  - Expected with flat config; informational only in this project.

- Photo upload 401/403 or missing images:
  - Confirm `pin-photos` bucket exists and is public-read; check upload path and returned public URL.
