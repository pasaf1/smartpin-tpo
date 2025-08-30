# SmartPin TPO – Project Guide (EN/HE)

## What's new (highlights)
- **🎯 BLUEBIN Integration Complete** - Full mobile-first interactive roof inspection platform integrated into existing SmartPin TPO
- **📱 Mobile-Optimized Canvas** - React-Konva system with native touch gestures (pinch-zoom, pan, tap) for mobile inspection workflows
- **🔄 Real-Time Collaboration** - Live multi-user presence tracking, collaborative cursors, instant pin updates with Supabase Realtime
- **🏗️ Enhanced Pin System** - Parent/child pin hierarchy with photo containers, status workflows, and backwards-compatible counting logic
- **🎨 Mobile-First UI Components** - Bottom sheet modals, floating action buttons (FAB), and responsive design for all screen sizes
- **🗄️ Database Migration** - Backwards-compatible schema enhancement with layers, spatial features, and PostGIS integration
- **🚀 Next.js 15 + @supabase/ssr Migration** - Complete upgrade to Next.js 15 App Router with modern @supabase/ssr for enhanced SSR compatibility and performance
- **🔐 Enhanced Authentication System** - Comprehensive Google OAuth integration with improved error handling, automatic profile creation, and auth_user_id synchronization
- **🛡️ Comprehensive RLS Policies** - Full Row Level Security implementation for users, pins, photos, and projects with proper role-based access control
- **🐛 Login UX Improvements** - Removed problematic UI elements, enhanced error messages, and streamlined authentication flow with timeout handling
- **📸 Roof Plan Upload Authentication** - Fixed authentication issues in roof plan upload component with proper user context integration
- **🔧 Debug & Monitoring Tools** - New API endpoints `/api/debug-oauth` and `/api/fix-user-auth` for OAuth troubleshooting and user management
- **Dark/Light Theme System** - Complete theme support with CSS custom properties, theme toggle, and system preference detection
- **Uniform Page Layout** - PageLayout template component for consistent design across all pages with navigation, breadcrumbs, and theme controls
- **Parent/Child pins** with status timeline (Open → ReadyForInspection → Closed) and parent aggregates. New UI: PinDetailsModalV2.
- **Photos** stored in a dedicated public bucket `pin-photos`; child closure requires a Closure photo.
- **Project creation** is RLS-gated: only roles Admin or QA_Manager can create projects. UI is gated accordingly with clear messages.
- **Chat improvements**: edit/delete actions, with a DELETE RLS policy migration included.
- **SSR-safe Supabase client** with diagnostics and `/api/env-check` + `/api/health` endpoints.
- **Simplified ESLint** (flat config) and hardened `next.config.js`. Legacy demo pages were removed.

A Next.js application for managing Pins/INCR, photos, statuses, severities, and scoped chat, now enhanced with the BLUEBIN mobile-first interactive roof inspection platform. This document is designed for both humans and AI agents to understand the stack, rules, pages, data model, and conventions.

אפליקציית Next.js לניהול Pins/INCR, תמונות, סטטוסים וחומרות, כולל צ׳אט בהיקפים שונים, כעת משופרת עם פלטפורמת הבדיקה האינטראקטיבית BLUEBIN המותאמת לנייד. מסמך זה נועד לאנשים ולסוכני AI כדי להבין את הסטאק, כללי הפיתוח, העמודים, מודל הנתונים והקונבנציות.

---

## Stack and Technologies (English)
- Framework: Next.js 15 (App Router), React 18
- Language: TypeScript
- UI: Tailwind CSS + shadcn/ui (Card, Button, Select, Badge, Textarea, Input, ScrollArea, etc.)
- Canvas: React-Konva for mobile-optimized interactive canvas with touch gesture support
- Theme: next-themes for dark/light mode switching with CSS custom properties
- Dates: date-fns (format, getISOWeek)
- Realtime/DB: Supabase with @supabase/ssr for Next.js 15 compatibility + PostGIS for spatial features (no Prisma)
- Authentication: Supabase Auth with Google OAuth support and enhanced error handling
- State/Logic: Custom hooks (e.g., usePins, usePinStatusManager, usePhotoAnalytics, useChatSystem, useBluebinRealtimeSync)
- Mobile UI: Bottom sheet modals, floating action buttons, responsive design patterns
- Security: Row Level Security (RLS) policies for all data access
- Build: next build
- Package manager: PNPM preferred

## סטאק וטכנולוגיות (עברית)
- פריימוורק: Next.js 15 (App Router), React 18
- שפה: TypeScript
- UI: Tailwind CSS + shadcn/ui (Card, Button, Select, Badge, Textarea, Input, ScrollArea ועוד)
- קנבס: React-Konva לקנבס אינטראקטיבי מותאם לנייד עם תמיכה בתנועות מגע
- עיצוב: next-themes למעבר בין מצב חשוך/בהיר עם CSS custom properties
- תאריכים: date-fns (format, getISOWeek)
- Realtime/DB: Supabase עם @supabase/ssr לתאימות Next.js 15 + PostGIS לתכונות מרחביות (ללא Prisma)
- התחברות: Supabase Auth עם תמיכה ב-Google OAuth וטיפול משופר בשגיאות
- State/Logic: הוקים מותאמים אישית (למשל usePins, usePinStatusManager, usePhotoAnalytics, useChatSystem, useBluebinRealtimeSync)
- ממשק נייד: מודלים של bottom sheet, כפתורי פעולה צפים, דפוסי עיצוב רספונסיביים
- אבטחה: מדיניות Row Level Security (RLS) לכל גישה לנתונים
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
    - Purpose: User authentication with email/password and Google OAuth.
    - Features: Proper Input components, Google sign-in button, theme support.
    - On success: redirect to / (or to preserved callback URL).
    - Permissions: Guests only (if logged in → redirect to /).
    - Chat scope: none.

2) /
    - File: src/app/page.tsx
    - Purpose: Home dashboard/overview; lists real projects from Supabase.
    - Features: Uses PageLayout template for consistent design.
    - Data: Projects via Supabase; create project modal (Admin/QA_Manager only).
    - Navigation: to /roofs/[id], /roofs/[id]/settings, /admin/users.
    - Chat scope: global.

3) /roofs
    - File: src/app/roofs/page.tsx (if present)
    - Purpose: List/index of roofs with filters.
    - Features: Can use PageLayout template for consistent design.
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
    - מטרה: התחברות משתמשים עם אימייל/סיסמה ו-Google OAuth.
    - תכונות: רכיבי Input תקינים, כפתור התחברות לגוגל, תמיכה בערכות נושא.
    - בהצלחה: ניתוב ל-/ (או לכתובת חזרה שמורה).
    - הרשאות: אורחים בלבד (מחובר → ניתוב ל-/).
    - היקף צ׳אט: אין.

2) /
    - קובץ: src/app/page.tsx
    - מטרה: דשבורד ביתי/סקירה; מציג פרויקטים אמיתיים מסביבת Supabase.
    - תכונות: משתמש בתבנית PageLayout לעיצוב אחיד.
    - דאטה: פרויקטים מסופבאייס; יצירת פרויקט אפשרית רק ל-Admin/QA_Manager.
    - ניווט: ל-/roofs/[id], הגדרות /roofs/[id]/settings, /admin/users.
    - היקף צ׳אט: global.

3) /roofs
    - קובץ: src/app/roofs/page.tsx (אם קיים)
    - מטרה: אינדקס גגות עם סינון.
    - תכונות: יכול להשתמש בתבנית PageLayout לעיצוב אחיד.
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

## 🎨 Recent Design System Improvements

### Dark/Light Theme System
The application now includes a complete theme system supporting light, dark, and system preference modes:

- **CSS Custom Properties**: Defined in `src/app/globals.css` for consistent theming
- **Theme Provider**: Integrated next-themes for seamless switching
- **Theme Toggle**: Available as `ThemeToggle` and `SimpleThemeToggle` components
- **System Detection**: Automatically detects user's system preference

**Usage Example:**
```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle'

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  )
}
```

### PageLayout Template
A uniform layout component for consistent page design across the application:

**Features:**
- Navigation header with logo and search
- Breadcrumbs for navigation context
- Theme toggle integration
- Responsive design
- Connection status indicator

**Usage Example:**
```tsx
import { PageLayout } from '@/components/layout/PageLayout'

export default function MyPage() {
  return (
    <PageLayout
      title="Page Title"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Current Page' }
      ]}
      actions={<CustomActions />}
    >
      <div>Your page content here</div>
    </PageLayout>
  )
}
```

### Enhanced Authentication
The login page has been completely redesigned with:

- **Proper Input Components**: Using shadcn/ui Input for better UX
- **Google OAuth**: Integrated Google sign-in option
- **Theme Support**: Works seamlessly with dark/light modes
- **Improved Validation**: Better error handling and user feedback

**Google OAuth Setup:**
1. Configure in Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Google Cloud Console credentials
4. Users can then sign in with the Google button on the login page

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
- **PageLayout**
   - Purpose: Uniform template for consistent page design across the application
   - Features: Navigation header with logo, search, theme toggle, breadcrumbs, content area
   - Usage: Import and wrap page content for consistent layout and navigation
   - Dependencies: ThemeToggle, ConnectionStatus, ChatDock components

- **ThemeToggle / SimpleThemeToggle**
   - Purpose: User interface for switching between light/dark/system themes
   - Features: Dropdown with Sun/Moon icons, respects system preferences
   - Integration: Uses next-themes provider for seamless theme switching
   - Dependencies: next-themes, Button, DropdownMenu from shadcn/ui

- **Enhanced Login Page**
   - Purpose: User authentication with improved UI and multiple sign-in options
   - Features: Proper Input components, Google OAuth button, theme support
   - Authentication: Email/password and Google OAuth via Supabase Auth
   - Dependencies: AuthContext, shadcn/ui Input and Button components

- **PinDetailsModalV2**
   - Purpose: Parent/child pin UI, timeline (Open → Ready → Closed), per-child Open/Closure images, prevents closing a child without a closure photo. Aggregates Closed/Total on parent.
   - Hooks: usePinWithChildren, useCreatePinChild, useUpdatePinChildStatus, useAttachChildPhoto.

- **PinCanvas**
   - Displays pins on a plan using normalized x_position/y_position (0..1).

- **PhotoDashboard**
   - Props: { pinId: string }; upload, manage, and analyze photos per pin/child.

- **ChatPanel**
   - Scope-aware chat: 'global' | 'roof' | 'pin'. Use useChatSystem without conditional hook calls.

- **usePinStatusManager**
   - Child pin close flow, validation, parent status updates, and summary functions.

## API Endpoints (English)

### Debug and Monitoring Endpoints
- **GET /api/debug-oauth**
  - Purpose: Comprehensive OAuth configuration and connectivity diagnostics
  - Features: Tests environment variables, Supabase connection, users table access, Google OAuth URL generation
  - Response: JSON with environment checks, auth test results, users table access status, and troubleshooting steps
  - Use case: Debugging OAuth setup issues, verifying Supabase configuration

- **POST /api/fix-user-auth** (Requires active session)
  - Purpose: Synchronize auth_user_id in users table with current authenticated session
  - Features: Finds user by email, updates auth_user_id to match current session user ID
  - Response: Success confirmation with old/new auth_user_id values and next steps
  - Use case: Fixing OAuth users where auth_user_id doesn't match current session

### Health and Diagnostics
- **GET /api/env-check**
  - Purpose: Environment variable validation and system health check
  - Features: Verifies required environment variables are configured
  - Use case: Deployment validation and configuration troubleshooting

- **GET /api/health** 
  - Purpose: Basic application health status
  - Features: Returns application status and basic connectivity checks
  - Use case: Load balancer health checks and monitoring

## רכיבים מרכזיים וחוזים (עברית)
- **PageLayout**
   - מטרה: תבנית אחידה לעיצוב עמודים עקבי ברחבי האפליקציה
   - תכונות: כותרת ניווט עם לוגו, חיפוש, החלפת ערכת נושא, breadcrumbs, אזור תוכן
   - שימוש: ייבוא ועיטוף תוכן העמוד לפריסה ונווטציה עקביים
   - תלויות: רכיבי ThemeToggle, ConnectionStatus, ChatDock

- **ThemeToggle / SimpleThemeToggle**
   - מטרה: ממשק משתמש למעבר בין ערכות נושא בהיר/חשוך/מערכת
   - תכונות: תפריט נפתח עם אייקוני שמש/ירח, מכבד העדפות מערכת
   - אינטגרציה: משתמש ב-next-themes provider למעבר חלק בין ערכות נושא
   - תלויות: next-themes, Button, DropdownMenu מ-shadcn/ui

- **עמוד התחברות משופר**
   - מטרה: אימות משתמשים עם ממשק משופר ואפשרויות התחברות מרובות
   - תכונות: רכיבי Input תקינים, כפתור Google OAuth, תמיכה בערכות נושא
   - אימות: אימייל/סיסמה ו-Google OAuth דרך Supabase Auth
   - תלויות: AuthContext, רכיבי Input ו-Button של shadcn/ui

- **PinDetailsModalV2**
   - מטרה: ממשק הורה/תתי־פינים, ציר סטטוס (Open → Ready → Closed), תמונות פתיחה/סגירה לכל תת־פין, ומניעת סגירה ללא תמונת Closure. מציג סיכום Closed/Total ברמת ההורה.
   - הוקים: usePinWithChildren, useCreatePinChild, useUpdatePinChildStatus, useAttachChildPhoto.

- **PinCanvas**
   - מציג פינים על גבי תכנית עם x_position/y_position מנורמלים (0..1).

- **PhotoDashboard**
   - Props: { pinId: string }; העלאה, ניהול ואנליזה של תמונות לפי פין/תת־פין.

- **ChatPanel**
   - צ׳אט לפי היקף: 'global' | 'roof' | 'pin'. להשתמש ב-useChatSystem ללא קריאה מותנית להוקים.

- **usePinStatusManager**
   - תהליך סגירת תתי־פינים, ולידציה, עדכון סטטוס הורה ופונקציות סיכום.

## נקודות קצה API (עברית)

### נקודות קצה לדיבוג ומעקב
- **GET /api/debug-oauth**
  - מטרה: אבחון מקיף של הגדרות OAuth וקישוריות
  - תכונות: בדיקת משתני סביבה, חיבור Supabase, גישה לטבלת משתמשים, יצירת URL של Google OAuth
  - תגובה: JSON עם בדיקות סביבה, תוצאות בדיקת אימות, סטטוס גישה לטבלת משתמשים, וצעדי פתרון בעיות
  - שימוש: דיבוג בעיות הגדרת OAuth, אימות הגדרת Supabase

- **POST /api/fix-user-auth** (דורש סשן פעיל)
  - מטרה: סינכרון auth_user_id בטבלת משתמשים עם הסשן המאומת הנוכחי
  - תכונות: מוצא משתמש לפי אימייל, מעדכן auth_user_id להתאמה עם מזהה המשתמש הנוכחי
  - תגובה: אישור הצלחה עם ערכי auth_user_id ישנים/חדשים וצעדים הבאים
  - שימוש: תיקון משתמשי OAuth שבהם auth_user_id לא תואם לסשן הנוכחי

### בריאות ואבחון
- **GET /api/env-check**
  - מטרה: אימות משתני סביבה ובדיקת בריאות מערכת
  - תכונות: מאמת שמשתני הסביבה הנדרשים מוגדרים
  - שימוש: אימות פריסה ופתרון בעיות הגדרה

- **GET /api/health**
  - מטרה: סטטוס בריאות יישום בסיסי
  - תכונות: מחזיר סטטוס יישום ובדיקות קישוריות בסיסיות
  - שימוש: בדיקות בריאות load balancer ומעקב

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

### 📱 BLUEBIN Mobile-First Inspection Platform
- **Interactive Canvas** - React-Konva system with native touch gestures (pinch-zoom, pan, tap)
- **Mobile-Optimized UI** - Bottom sheet modals, floating action buttons, responsive design for all screen sizes
- **Real-Time Collaboration** - Live multi-user presence tracking, collaborative cursors, instant updates
- **Layer Management** - Advanced layer system with visibility controls, opacity adjustment, and z-index ordering
- **Enhanced Pin System** - Parent/child pin hierarchy with photo containers and status workflows

### 🏗️ Core Application Features
- **Pin-based Inspection System** - Parent/child pins, status timeline, and aggregates with backwards-compatible counting
- **Dark/Light Theme Support** - Complete theme system with user preference detection and CSS custom properties
- **Uniform Page Layout** - Consistent design template across all pages with navigation and theme controls
- **Enhanced Authentication** - Email/password and Google OAuth integration with improved UI
- **Real-time Collaboration** - Live updates and scoped chat (global/roof/pin), edit/delete
- **Photo Management** - Upload to `pin-photos`, per-child Open/Closure pairs  
- **Project Analytics** - Quality trends and performance metrics
- **Mobile Responsive** - Works seamlessly on all devices with touch gesture support
- **Spatial Features** - PostGIS integration for geographic validation and spatial tool gating
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
   - **20250830_bluebin_integration.sql** (BLUEBIN platform migration)
3. Ensure RLS is enabled and policies are active. Project INSERT is allowed only for roles `Admin` or `QA_Manager`.
4. Create a public storage bucket named `pin-photos` and grant read access for public URLs.
5. Enable PostGIS extension for spatial features: `CREATE EXTENSION IF NOT EXISTS postgis;`
6. **Optional: Configure Google OAuth**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add your Google Cloud Console Client ID and Client Secret
   - Configure redirect URLs: `https://your-project-id.supabase.co/auth/v1/callback`

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
│   ├── globals.css     # Global styles with dark/light theme CSS variables
│   ├── layout.tsx      # Root layout with theme providers
│   └── login/          # Enhanced authentication page
├── components/          # Reusable UI components
│   ├── dashboard/      # BLUEBIN interactive canvas components
│   │   └── BluebinInteractiveRoofPlan.tsx  # Mobile-first React-Konva canvas
│   ├── pins/           # Pin management components
│   │   └── BluebinPinDetailsCard.tsx       # Enhanced pin details with child containers
│   ├── layout/         # PageLayout template for consistent design
│   ├── ui/             # shadcn/ui components with theme support
│   │   ├── theme-toggle.tsx      # Dark/light theme switcher
│   │   ├── MobileBottomSheet.tsx # Touch-responsive bottom sheet modal
│   │   └── MobileFAB.tsx         # Floating action button for mobile tools
│   └── ...             # Other feature components
├── lib/                 # Utilities and configurations
│   ├── supabase/       # Database client setup
│   ├── auth/           # Authentication context with Google OAuth
│   ├── hooks/          # Custom React hooks
│   │   ├── useBluebinRealtimeSync.ts  # Real-time collaboration hook
│   │   └── useSupabaseRealtimeSync.ts # Supabase realtime integration
│   ├── services/       # Business logic services
│   │   └── supabaseRealtimeManager.ts # Centralized realtime management
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

**SmartPin TPO v1.0.0** - Professional roof inspection made simple, now enhanced with BLUEBIN mobile-first interactive platform.

---

## 🔎 Troubleshooting

### Authentication Issues

#### Common OAuth Problems
- **Google OAuth not working**:
  - Configure Google OAuth in Supabase Dashboard → Authentication → Providers
  - Ensure Google Cloud Console credentials are properly set
  - Verify redirect URLs match your Supabase project settings
  - Use debug endpoint: `GET /api/debug-oauth` to diagnose configuration issues

- **User profile not loading after OAuth**:
  - Check if user exists in `users` table with matching `auth_user_id`
  - Use fix endpoint: `POST /api/fix-user-auth` to synchronize auth_user_id
  - Verify RLS policies allow the authenticated user to access their profile

#### Authentication Flow Issues
- **Login page shows invisible input fields**:
  - Ensure you're using the updated login page with proper shadcn/ui Input components
  - Check that theme CSS variables are properly loaded in globals.css

- **Auth timeout or infinite loading**:
  - AuthContext includes 10-second timeout protection
  - Profile fetch includes 8-second timeout with fallback profile creation
  - Check console for timeout warnings and auth state change events

- **Profile creation failing**:
  - Ensure RLS policies allow INSERT on users table for authenticated users
  - Check that required user metadata (full_name, role) is included in signup
  - Verify user table structure matches UserProfile interface

#### Debug Tools
- **OAuth Configuration Check**: `GET /api/debug-oauth`
  - Tests environment variables, Supabase connection, users table access
  - Checks specific user existence and Google OAuth URL generation
  - Provides troubleshooting steps and common issue identification

- **User Authentication Fix**: `POST /api/fix-user-auth` (requires active session)
  - Synchronizes auth_user_id in users table with current session
  - Useful when OAuth user exists but auth_user_id is mismatched
  - Updates user record with current authenticated user ID

### Theme Issues
- **Theme not switching properly**:
  - Ensure next-themes provider is wrapping the app in layout.tsx
  - Check that Tailwind CSS dark mode is configured with `darkMode: "class"`
  - Verify CSS custom properties are defined in globals.css

### Database Issues

#### Row Level Security (RLS) Problems
- **Failed to create project (permission denied / RLS)**:
  - Ensure your `users.role` is `Admin` or `QA_Manager`
  - Verify comprehensive RLS policies were applied (recent migration includes full RLS coverage)
  - Sign out/in to refresh the JWT after role changes

- **Cannot access user profile / pins / photos**:
  - Check that user exists in `users` table with correct `auth_user_id`
  - Verify RLS policies are enabled on all tables (users, pins, photos, projects)
  - Use `SELECT auth.uid()` in database to verify current authenticated user ID
  - Ensure user role matches required permissions for the operation

#### RLS Policy Coverage
The application now includes comprehensive RLS policies for:
- **Users Table**: Users can view/update their own profile, admins can manage all users
- **Projects Table**: Role-based access (Admin/QA_Manager can create, appropriate roles can view/edit)
- **Pins Table**: Users can access pins from projects they're associated with
- **Photos Table**: Access controlled based on pin ownership and user permissions
- **Chat Messages**: Scoped access based on pin/project association

#### Database Connection Issues
- **Supabase connection timeout**:
  - Check environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Verify network connectivity to Supabase instance
  - Use `/api/debug-oauth` endpoint to test database connection

- **Migration/Schema issues**:
  - Ensure all recent database migrations are applied
  - Check that user table includes required fields: `auth_user_id`, `role`, `email`, `full_name`
  - Verify foreign key constraints and RLS policies are properly configured

### Build Issues
- **Next.js "inferred workspace root" warning (multiple lockfiles)**:
  - Remove extra lockfiles or set `outputFileTracingRoot` in `next.config.js` to your monorepo root

- **ESLint warning about Next plugin not detected**:
  - Expected with flat config; informational only in this project

- **TypeScript errors about missing properties**:
  - Check for consistent property naming (e.g., `profile` vs `userProfile`)
  - Ensure all imports and exports are properly typed

### Photo Upload Issues
- **Photo upload 401/403 or missing images**:
  - Confirm `pin-photos` bucket exists and is public-read
  - Check upload path and returned public URL
