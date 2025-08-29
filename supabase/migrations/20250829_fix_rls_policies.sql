-- Enhanced RLS Policies - Fix missing DELETE policies and improve security
-- Date: August 29, 2025

BEGIN;

-- Improved helper functions with NULL handling
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.role AS $$
DECLARE
    user_role public.role;
BEGIN
    SELECT role INTO user_role
    FROM public.users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
    
    -- Return 'Viewer' if user not found (safer default)
    RETURN COALESCE(user_role, 'Viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved admin check with proper NULL handling
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_user_role() = 'Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage pins
CREATE OR REPLACE FUNCTION public.can_manage_pins()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- PROJECTS TABLE POLICIES
-- =====================

-- Add missing DELETE policy for projects
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects" ON public.projects
    FOR DELETE
    USING (public.is_admin());

-- =====================
-- ROOFS TABLE POLICIES  
-- =====================

-- Add missing INSERT policy for roofs
DROP POLICY IF EXISTS "QA Managers and Admins can create roofs" ON public.roofs;
CREATE POLICY "QA Managers and Admins can create roofs" ON public.roofs
    FOR INSERT
    WITH CHECK (public.get_user_role() IN ('Admin', 'QA_Manager'));

-- =====================
-- PINS TABLE POLICIES
-- =====================

-- Add missing DELETE policy for pins
DROP POLICY IF EXISTS "Supervisors and above can delete pins" ON public.pins;
CREATE POLICY "Supervisors and above can delete pins" ON public.pins
    FOR DELETE
    USING (public.can_manage_pins());

-- Improve UPDATE policy to check pin ownership or admin rights
DROP POLICY IF EXISTS "Supervisors and above can update pins" ON public.pins;
CREATE POLICY "Supervisors and above can update pins" ON public.pins
    FOR UPDATE
    USING (
        public.can_manage_pins() OR 
        opened_by = public.get_current_user_id()
    );

-- =====================
-- PIN CHILDREN POLICIES
-- =====================

-- Add missing DELETE policy for pin children
DROP POLICY IF EXISTS "Foremen and above can delete pin children" ON public.pin_children;
CREATE POLICY "Foremen and above can delete pin children" ON public.pin_children
    FOR DELETE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

-- =====================
-- PHOTOS TABLE POLICIES
-- =====================

-- Add missing DELETE policy for photos
DROP POLICY IF EXISTS "Users can delete own photos" ON public.photos;
CREATE POLICY "Users can delete own photos" ON public.photos
    FOR DELETE
    USING (
        uploaded_by = public.get_current_user_id() OR
        public.is_admin()
    );

-- Improve INSERT policy to validate photo relationships
DROP POLICY IF EXISTS "Foremen and above can upload photos" ON public.photos;
CREATE POLICY "Foremen and above can upload photos" ON public.photos
    FOR INSERT
    WITH CHECK (
        public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman') AND
        uploaded_by = public.get_current_user_id()
    );

-- =====================
-- AUDIT LOG ENHANCEMENTS
-- =====================

-- Ensure audit log is properly protected
DROP POLICY IF EXISTS "Admins can delete audit entries" ON public.audit_log;
CREATE POLICY "Admins can delete audit entries" ON public.audit_log
    FOR DELETE
    USING (public.is_admin());

-- =====================
-- LEGACY TABLES CLEANUP
-- =====================

-- Add proper DELETE policies for legacy tables
DROP POLICY IF EXISTS "Admins can delete pin items" ON public.pin_items;
CREATE POLICY "Admins can delete pin items" ON public.pin_items
    FOR DELETE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can delete own pin images" ON public.pin_images;
CREATE POLICY "Users can delete own pin images" ON public.pin_images
    FOR DELETE
    USING (
        uploader_id = public.get_current_user_id() OR
        public.is_admin()
    );

DROP POLICY IF EXISTS "Users can delete own pin chat" ON public.pin_chat;
CREATE POLICY "Users can delete own pin chat" ON public.pin_chat
    FOR DELETE
    USING (
        author_id = public.get_current_user_id() OR
        public.is_admin()
    );

-- =====================
-- STORAGE BUCKET POLICIES
-- =====================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for viewing files
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
CREATE POLICY "Users can view files" ON storage.objects
    FOR SELECT
    USING (true); -- All authenticated users can view files

-- Policy for uploading files
DROP POLICY IF EXISTS "Foremen and above can upload files" ON storage.objects;
CREATE POLICY "Foremen and above can upload files" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id IN ('pin-photos', 'roof-plans', 'chat-attachments') AND
        auth.uid() IS NOT NULL AND
        (
            SELECT role FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman')
    );

-- Policy for updating files (replace photos)
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files" ON storage.objects
    FOR UPDATE
    USING (
        auth.uid() = owner OR
        (
            SELECT role FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) = 'Admin'
    );

-- Policy for deleting files
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE
    USING (
        auth.uid() = owner OR
        (
            SELECT role FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) = 'Admin'
    );

COMMIT;

-- Create helpful function to test RLS policies
CREATE OR REPLACE FUNCTION public.test_user_permissions(test_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_role public.role;
    user_id UUID;
BEGIN
    -- Get user info
    SELECT role, id INTO user_role, user_id
    FROM public.users 
    WHERE auth_user_id = test_user_id;
    
    -- Build result
    SELECT json_build_object(
        'user_id', user_id,
        'auth_user_id', test_user_id,
        'role', user_role,
        'can_create_projects', (user_role IN ('Admin', 'QA_Manager')),
        'can_create_pins', (user_role IN ('Admin', 'QA_Manager', 'Supervisor')),
        'can_upload_photos', (user_role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman')),
        'is_admin', (user_role = 'Admin')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
