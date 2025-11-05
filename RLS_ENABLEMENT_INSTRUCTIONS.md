# 🔐 RLS Enablement Instructions

## Critical Security Fix - Row Level Security

**Status**: ⚠️ **PENDING MANUAL ACTION**
**Priority**: 🚨 **CRITICAL**
**Date**: 2025-11-05

---

## Problem

Your Supabase database currently has **RLS (Row Level Security) DISABLED** on all tables. This means:

- ❌ **Anyone can read ALL data without authentication**
- ❌ User personal information (email, name, address) is publicly exposed
- ❌ Business data (roofs, pins, projects) is public
- ❌ GDPR compliance violation risk

---

## Solution

You need to **manually enable RLS** via the Supabase Dashboard. Migration files have been prepared but need to be applied manually due to migration history conflicts.

---

## 📝 Step-by-Step Instructions

### Option 1: Using Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/vhtbinssqbzcjmbgkseo

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste this SQL**:

```sql
-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

4. **Click "Run"** or press `Ctrl+Enter`

5. **Verify the results**:
   - Look for the verification query results at the bottom
   - All tables should show `rls_enabled = true`

---

### Option 2: Using Supabase CLI

If you have proper access tokens configured:

```bash
# Navigate to project directory
cd C:\Users\asaf6\Desktop\APP\apps\smartpin-tpo

# Apply the migration
npx supabase db push --linked

# If there are migration conflicts, repair them first:
npx supabase migration repair --status applied 20250830
npx supabase migration repair --status applied 20250831
```

---

## ✅ Verification

After applying, verify RLS is enabled:

### Via Dashboard:
1. Go to SQL Editor
2. Run:
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
3. All tables should show `rowsecurity = t` (true)

### Via CLI:
```bash
npx supabase db remote list
```

---

## 🔍 What This Does

**RLS (Row Level Security)** ensures that:

✅ **Only authenticated users** can access data
✅ **Users see only what they're authorized to see**
✅ **Policies control access based on user roles**
✅ **Database level security** (not just application level)

**Current policies** (already defined, just need RLS enabled):

- **Users**: Can view all profiles, update own profile, admins can manage all
- **Projects**: All can view, QA Managers+ can create/edit
- **Roofs**: All can view, QA Managers+ can manage
- **Pins**: All can view, Supervisors+ can create/edit
- **Pin Children**: All can view, Foremen+ can create/edit
- **Photos**: All can view, Foremen+ can upload
- **Chats**: All can view, users can create own messages
- **Audit Log**: QA Managers+ can view
- **User Prefs**: Users can manage only their own

---

## 🚨 Important Notes

1. **Application will still work** - Your app uses authenticated requests
2. **No data loss** - This only adds security, doesn't delete anything
3. **Test after enabling** - Make sure you can still log in and view data
4. **If something breaks** - You can disable RLS temporarily:
   ```sql
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   -- (repeat for other tables as needed)
   ```

---

## 📞 Next Steps After Enabling RLS

1. ✅ Enable RLS (this document)
2. 🧪 Test application - log in and verify data loads
3. 🔧 Fix duplicate user issue (asaf6peer@gmail.com)
4. 📊 Set up audit logging
5. 💾 Configure automated backups

---

## 📁 Files Created

- `supabase/migrations/20251105_enable_rls_only.sql` - Simple RLS enablement migration
- `supabase/migrations/20240828_rls_policies.sql` - Original RLS policies (already applied)
- `supabase/migrations/20250831_enhanced_rls_policies.sql` - Enhanced policies

---

**Created by**: Claude Code
**Date**: 2025-11-05
**Audit Report**: See `SUPABASE_AUDIT_REPORT.md`
