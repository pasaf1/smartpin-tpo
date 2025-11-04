# SmartPin TPO - Complete Pages & Routes Report

**Generated:** November 4, 2025
**Purpose:** Application structure audit for cleanup and optimization

---

## 📊 Executive Summary

- **Total Pages:** 10 user-facing pages
- **Total API Routes:** 19 backend endpoints
- **Authentication Status:** CURRENTLY DISABLED (temporary)
- **Main Application:** Roof quality management system

---

## 🏠 USER-FACING PAGES (10)

### 1. **ROOT PAGE** - `/`
- **File:** `src/app/page.tsx`
- **Purpose:** Main dashboard / Roof detail view
- **Authentication:** Disabled (was: withAuth)
- **Components:**
  - Interactive Konva roof plan (BluebinInteractiveRoofPlan)
  - Pin management system
  - KPI cards (Open, Ready, Closed, Total issues)
  - Real-time chat interface
  - Pin details modal
  - Issues table
- **Size:** 721 lines
- **Status:** ✅ ACTIVE - Main application page
- **Notes:** Currently serves as both landing and dashboard

---

### 2. **LOGIN PAGE** - `/login`
- **File:** `src/app/login/page.tsx`
- **Purpose:** User authentication (email/password + Google OAuth)
- **Authentication:** Public access
- **Components:**
  - Email/password form
  - Google OAuth button
  - Theme toggle
  - Error handling
- **Size:** 240 lines
- **Status:** ⚠️ CURRENTLY BYPASSED - Auth disabled
- **Notes:** User reported seeing this as "duplicate" - should be hidden or removed during no-auth period

---

### 3. **ROOFS LIST** - `/roofs`
- **File:** `src/app/roofs/page.tsx`
- **Purpose:** List all roof projects
- **Authentication:** None
- **Components:**
  - Roof cards with stats
  - Search/filter functionality
  - Create new roof button
- **Status:** ❓ UNKNOWN - Needs verification if used
- **Notes:** May be redundant if root page serves same purpose

---

### 4. **ROOF DETAIL** - `/roofs/[id]`
- **File:** `src/app/roofs/[id]/page.tsx`
- **Purpose:** Detailed view of specific roof project
- **Authentication:** Disabled (was: withAuth)
- **Components:**
  - Same as root page (Interactive roof plan, pins, KPI cards)
- **Size:** 791 lines
- **Status:** ✅ ACTIVE
- **Notes:** Nearly identical to root page - consider consolidation

---

### 5. **ROOF LAYERS** - `/roofs/[id]/layers`
- **File:** `src/app/roofs/[id]/layers/page.tsx`
- **Purpose:** Manage roof plan layers
- **Authentication:** None
- **Status:** ❓ UNKNOWN - Database lacks 'layers' table
- **Notes:** May be non-functional - layers table removed from DB

---

### 6. **ROOF SETTINGS** - `/roofs/[id]/settings`
- **File:** `src/app/roofs/[id]/settings/page.tsx`
- **Purpose:** Configure roof project settings
- **Authentication:** None
- **Components:**
  - Roof info editing
  - Image upload
  - Project metadata
- **Status:** ✅ ACTIVE

---

### 7. **USER SETTINGS** - `/settings`
- **File:** `src/app/settings/page.tsx`
- **Purpose:** User profile and preferences
- **Authentication:** None
- **Status:** ✅ ACTIVE

---

### 8. **ADMIN - USERS** - `/admin/users`
- **File:** `src/app/admin/users/page.tsx`
- **Purpose:** User management (Admin only)
- **Authentication:** Role-based (checks for Admin/QA_Manager)
- **Components:**
  - User list table
  - Search users
  - Create/edit users
  - Role management
- **Size:** 332 lines
- **Status:** ✅ ACTIVE - Requires Admin role

---

### 9. **OFFLINE PAGE** - `/offline`
- **File:** `src/app/offline/page.tsx`
- **Purpose:** Displayed when app is offline (PWA)
- **Authentication:** None
- **Status:** ✅ ACTIVE - PWA fallback

---

### 10. **AUTH ERROR** - `/auth/auth-code-error`
- **File:** `src/app/auth/auth-code-error/page.tsx`
- **Purpose:** OAuth error handling page
- **Authentication:** Public
- **Status:** ⚠️ CURRENTLY UNUSED - Auth disabled
- **Notes:** Only shown when Google OAuth fails

---

## 🔌 API ROUTES (19)

### Authentication & Users
1. **`/api/oauth-check`** - Check if Google OAuth is configured
2. **`/api/create-admin-user`** - Create admin user account
3. **`/api/fix-user-auth`** - Fix user authentication issues
4. **`/api/reset-admin-password`** - Reset admin password
5. **`/auth/callback`** - OAuth callback handler

### Database Management
6. **`/api/cleanup-database`** - Database maintenance
7. **`/api/exec-sql`** - Execute raw SQL queries
8. **`/api/apply-bluebin-migration`** - Run database migrations
9. **`/api/execute-bluebin-sql`** - Execute Bluebin-specific SQL
10. **`/api/generate-bluebin-sql`** - Generate migration SQL

### Debug & Diagnostics
11. **`/api/debug-oauth`** - Debug OAuth configuration
12. **`/api/debug-pins`** - Debug pin data
13. **`/api/debug-roofs`** - Debug roof data
14. **`/api/debug/check-storage`** - Check Supabase storage
15. **`/api/env-check`** - Check environment variables

### File Uploads
16. **`/api/photos/upload`** - Upload pin photos
17. **`/api/roofplans/upload`** - Upload roof plan images

### Utilities
18. **`/api/health`** - Health check endpoint
19. **`/api/placeholder/[w]/[h]`** - Generate placeholder images
20. **`/api/share`** - Generate share links

---

## 🔄 APPLICATION FLOW

### Current User Journey (Auth Disabled):

```
User visits URL
    ↓
/ (Root Page - Main Dashboard)
    ↓
Displays roof plan with pins
    ↓
User can:
    - View/edit pins
    - Chat with team
    - Export data
    - Navigate to settings
```

### Original Flow (With Auth - Currently Disabled):

```
User visits URL
    ↓
withAuth checks authentication
    ↓
No auth? → Redirect to /login
    ↓
Login successful → / (Dashboard)
```

---

## 🚨 ISSUES & RECOMMENDATIONS

### Critical Issues:

1. **DUPLICATE FUNCTIONALITY**
   - `src/app/page.tsx` (721 lines)
   - `src/app/roofs/[id]/page.tsx` (791 lines)
   - Both contain nearly identical code for roof dashboard
   - **Recommendation:** Consolidate into single component

2. **AUTHENTICATION CONFUSION**
   - `/login` page exists but auth is disabled
   - Users may still see login page and get confused
   - **Recommendation:** Hide login route or show "Auth disabled" message

3. **BROKEN FEATURES**
   - `/roofs/[id]/layers` references non-existent 'layers' table
   - **Recommendation:** Remove or implement layers feature properly

### Unused/Debug Routes (Candidates for Removal):

4. **Debug API Routes** (Should be removed in production)
   - `/api/debug-oauth`
   - `/api/debug-pins`
   - `/api/debug-roofs`
   - `/api/debug/check-storage`
   - **Recommendation:** Keep only in development, remove from production

5. **Database Admin Routes** (Security risk if exposed)
   - `/api/exec-sql` - ⚠️ DANGEROUS - Allows raw SQL execution
   - `/api/cleanup-database`
   - `/api/fix-user-auth`
   - **Recommendation:** Protect with admin auth or remove

6. **Migration Routes** (Should be CLI-only)
   - `/api/apply-bluebin-migration`
   - `/api/execute-bluebin-sql`
   - `/api/generate-bluebin-sql`
   - **Recommendation:** Use Supabase CLI instead

### Missing Pages:

7. **No Projects/Roofs List Landing**
   - Root `/` goes directly to dashboard
   - Missing overview of all projects
   - **Recommendation:** Create proper landing/projects page

8. **No 404 Page**
   - Default Next.js 404
   - **Recommendation:** Create custom 404 page

---

## 📋 CLEANUP CHECKLIST

### High Priority:
- [ ] Consolidate duplicate dashboard code (`page.tsx` and `roofs/[id]/page.tsx`)
- [ ] Hide or remove `/login` page during auth-disabled period
- [ ] Remove or fix `/roofs/[id]/layers` (layers table missing)
- [ ] Secure or remove dangerous API routes (`/api/exec-sql`)

### Medium Priority:
- [ ] Remove debug API routes in production
- [ ] Move migration routes to CLI workflow
- [ ] Create proper projects list page
- [ ] Add custom 404 page

### Low Priority:
- [ ] Review and optimize bundle size
- [ ] Add page metadata (SEO)
- [ ] Implement proper loading states

---

## 📁 FILE STRUCTURE

```
src/app/
├── page.tsx                          # Main dashboard (721 lines) ⚠️ DUPLICATE
├── login/
│   └── page.tsx                      # Login page (240 lines) ⚠️ CURRENTLY BYPASSED
├── roofs/
│   ├── page.tsx                      # Roofs list ❓ VERIFY IF USED
│   └── [id]/
│       ├── page.tsx                  # Roof detail (791 lines) ⚠️ DUPLICATE
│       ├── settings/page.tsx         # Roof settings ✅
│       └── layers/page.tsx           # Layers management ⚠️ BROKEN
├── settings/
│   └── page.tsx                      # User settings ✅
├── admin/
│   └── users/page.tsx                # User management ✅
├── offline/
│   └── page.tsx                      # Offline fallback ✅
├── auth/
│   ├── auth-code-error/page.tsx      # OAuth error ⚠️ UNUSED
│   └── callback/route.ts             # OAuth callback ⚠️ UNUSED
└── api/
    ├── [19 API routes]               # See API section above
```

---

## 🎯 RECOMMENDED ACTIONS

### Immediate (This Week):
1. **Decide on single dashboard location** - `/` or `/roofs/[id]`?
2. **Hide login page** - Add redirect or "Coming Soon" message
3. **Remove dangerous debug routes** - `/api/exec-sql`, etc.

### Short Term (This Month):
4. **Remove broken layers page** - Or implement properly
5. **Consolidate duplicate code** - Reduce from 1512 to ~800 lines
6. **Add projects list page** - Proper landing page

### Long Term:
7. **Re-enable authentication** - With proper flow
8. **Implement role-based access** - Admin, QA, Inspector, etc.
9. **Add comprehensive error pages** - 404, 500, etc.

---

## 📞 QUESTIONS TO ANSWER

1. **Should root `/` be the projects list or a specific project dashboard?**
2. **Do you need the layers feature? (Currently broken)**
3. **Which debug/admin API routes should be kept?**
4. **When will authentication be re-enabled?**
5. **Do you use the `/roofs` list page?**

---

**End of Report**
