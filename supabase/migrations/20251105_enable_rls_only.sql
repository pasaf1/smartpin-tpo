-- Enable RLS ONLY Migration
-- This migration ONLY enables RLS on tables without modifying policies
-- Policies already exist from previous migrations
-- Date: 2025-11-05

-- Enable RLS on all public tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pin_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pin_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.child_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plan_regions ENABLE ROW LEVEL SECURITY;

-- Legacy tables (may not exist)
ALTER TABLE IF EXISTS public.pin_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pin_chat ENABLE ROW LEVEL SECURITY;

-- Verification query - show which tables have RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'projects', 'roofs', 'pins', 'pin_children', 'pin_items',
    'photos', 'chats', 'audit_log', 'user_prefs', 'layers',
    'child_pins', 'annotations', 'plan_regions', 'pin_images', 'pin_chat'
)
ORDER BY tablename;
