-- SmartPin TPO - Adding missing DELETE policies
-- Date: 2025-08-29

-- Projects DELETE policy - Only Admin can delete projects
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects" ON public.projects
    FOR DELETE
    USING (public.is_admin());

-- Roofs DELETE policy - Only Admin can delete roofs
DROP POLICY IF EXISTS "Admins can delete roofs" ON public.roofs;
CREATE POLICY "Admins can delete roofs" ON public.roofs
    FOR DELETE
    USING (public.is_admin());

-- Pins DELETE policy - Supervisors and above can delete pins
DROP POLICY IF EXISTS "Supervisors and above can delete pins" ON public.pins;
CREATE POLICY "Supervisors and above can delete pins" ON public.pins
    FOR DELETE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor'));

-- Pin children DELETE policy - Foremen and above can delete pin children
DROP POLICY IF EXISTS "Foremen and above can delete pin children" ON public.pin_children;
CREATE POLICY "Foremen and above can delete pin children" ON public.pin_children
    FOR DELETE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

-- Photos DELETE policy - Users can delete own photos, Admins can delete any
DROP POLICY IF EXISTS "Users can delete own photos or Admins can delete any" ON public.photos;
CREATE POLICY "Users can delete own photos or Admins can delete any" ON public.photos
    FOR DELETE
    USING (
        uploaded_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        OR public.is_admin()
    );

-- Chats DELETE policy - Users can delete own chats, Admins can delete any
DROP POLICY IF EXISTS "Users can delete own chats or Admins can delete any" ON public.chats;
CREATE POLICY "Users can delete own chats or Admins can delete any" ON public.chats
    FOR DELETE
    USING (
        created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        OR public.is_admin()
    );

-- Users DELETE policy - Only Admin can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE
    USING (public.is_admin());

-- User preferences DELETE policy - Users can delete own preferences
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_prefs;
CREATE POLICY "Users can delete own preferences" ON public.user_prefs
    FOR DELETE
    USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Legacy tables DELETE policies
DROP POLICY IF EXISTS "Foremen and above can delete pin items" ON public.pin_items;
CREATE POLICY "Foremen and above can delete pin items" ON public.pin_items
    FOR DELETE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

DROP POLICY IF EXISTS "Foremen and above can delete pin images" ON public.pin_images;
CREATE POLICY "Foremen and above can delete pin images" ON public.pin_images
    FOR DELETE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

DROP POLICY IF EXISTS "Users can delete own pin chat" ON public.pin_chat;
CREATE POLICY "Users can delete own pin chat" ON public.pin_chat
    FOR DELETE
    USING (
        author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        OR public.is_admin()
    );

-- Audit log DELETE policy - Only Admin can delete audit entries (for maintenance)
DROP POLICY IF EXISTS "Admins can delete audit entries" ON public.audit_log;
CREATE POLICY "Admins can delete audit entries" ON public.audit_log
    FOR DELETE
    USING (public.is_admin());
