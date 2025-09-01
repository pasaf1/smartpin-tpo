-- Enhanced Row Level Security (RLS) Policies for SmartPin TPO
-- Complete security model with proper user access controls

-- Drop existing policies to recreate with enhanced logic
DROP POLICY IF EXISTS "Users can view users in their organization" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view projects they have access to" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view roofs in accessible projects" ON public.roofs;
DROP POLICY IF EXISTS "Users can view pins in accessible roofs" ON public.pins;
DROP POLICY IF EXISTS "Users can create pins in accessible roofs" ON public.pins;
DROP POLICY IF EXISTS "Users can update pins in accessible roofs" ON public.pins;
DROP POLICY IF EXISTS "Users can delete pins in accessible roofs" ON public.pins;

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS public.role AS $$
BEGIN
  RETURN (
    SELECT u.role 
    FROM public.users u 
    WHERE u.auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user can access project
CREATE OR REPLACE FUNCTION can_access_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- User is the project owner
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.project_id = project_uuid 
      AND p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR
    -- User has Admin or QA_Manager role
    get_user_role() IN ('Admin', 'QA_Manager')
    OR
    -- User is explicitly granted access (for future team management)
    EXISTS (
      SELECT 1 FROM public.project_access pa
      WHERE pa.project_id = project_uuid 
      AND pa.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create project access table for team management
CREATE TABLE IF NOT EXISTS public.project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.role NOT NULL DEFAULT 'Viewer',
  granted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project access
ALTER TABLE public.project_access ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- USERS TABLE POLICIES
-- ==========================================

-- Users can view other users in their organization/projects
CREATE POLICY "Users can view users in accessible projects" ON public.users
  FOR SELECT USING (
    -- User can see their own profile
    auth_user_id = auth.uid()
    OR
    -- User can see users in projects they have access to
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.created_by = id OR p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR
    -- Admins can see all users
    get_user_role() IN ('Admin', 'QA_Manager')
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Only admins can insert new users (typically done via signup)
CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT WITH CHECK (get_user_role() = 'Admin');

-- Only admins can delete users
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (get_user_role() = 'Admin');

-- ==========================================
-- PROJECTS TABLE POLICIES
-- ==========================================

-- Users can view projects they have access to
CREATE POLICY "Users can view accessible projects" ON public.projects
  FOR SELECT USING (can_access_project(project_id));

-- Users can create new projects
CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Project owners and admins can update projects
CREATE POLICY "Authorized users can update projects" ON public.projects
  FOR UPDATE USING (can_access_project(project_id))
  WITH CHECK (can_access_project(project_id));

-- Only admins can delete projects
CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE USING (get_user_role() = 'Admin');

-- ==========================================
-- PROJECT ACCESS TABLE POLICIES
-- ==========================================

-- Users can view access records for projects they can access
CREATE POLICY "Users can view project access" ON public.project_access
  FOR SELECT USING (can_access_project(project_id));

-- Project owners and admins can grant access
CREATE POLICY "Authorized users can grant project access" ON public.project_access
  FOR INSERT WITH CHECK (
    can_access_project(project_id) 
    AND granted_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Project owners and admins can revoke access
CREATE POLICY "Authorized users can revoke project access" ON public.project_access
  FOR DELETE USING (can_access_project(project_id));

-- ==========================================
-- ROOFS TABLE POLICIES
-- ==========================================

-- Users can view roofs in accessible projects
CREATE POLICY "Users can view roofs in accessible projects" ON public.roofs
  FOR SELECT USING (can_access_project(project_id));

-- Users can create roofs in accessible projects
CREATE POLICY "Users can create roofs in accessible projects" ON public.roofs
  FOR INSERT WITH CHECK (can_access_project(project_id));

-- Users can update roofs in accessible projects
CREATE POLICY "Users can update roofs in accessible projects" ON public.roofs
  FOR UPDATE USING (can_access_project(project_id))
  WITH CHECK (can_access_project(project_id));

-- Users can delete roofs in accessible projects
CREATE POLICY "Users can delete roofs in accessible projects" ON public.roofs
  FOR DELETE USING (can_access_project(project_id));

-- ==========================================
-- PINS TABLE POLICIES
-- ==========================================

-- Users can view pins in accessible roofs
CREATE POLICY "Users can view pins in accessible roofs" ON public.pins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.roofs r
      WHERE r.id = roof_id AND can_access_project(r.project_id)
    )
  );

-- Users can create pins in accessible roofs
CREATE POLICY "Users can create pins in accessible roofs" ON public.pins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roofs r
      WHERE r.id = roof_id AND can_access_project(r.project_id)
    )
    AND opened_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Users can update pins in accessible roofs
CREATE POLICY "Users can update pins in accessible roofs" ON public.pins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.roofs r
      WHERE r.id = roof_id AND can_access_project(r.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roofs r
      WHERE r.id = roof_id AND can_access_project(r.project_id)
    )
  );

-- Users can delete pins in accessible roofs
CREATE POLICY "Users can delete pins in accessible roofs" ON public.pins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.roofs r
      WHERE r.id = roof_id AND can_access_project(r.project_id)
    )
  );

-- ==========================================
-- PIN CHILDREN TABLE POLICIES
-- ==========================================

-- Users can view pin children via parent pin access
CREATE POLICY "Users can view pin children via parent access" ON public.pin_children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  );

-- Users can create pin children with parent access
CREATE POLICY "Users can create pin children with parent access" ON public.pin_children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  );

-- Users can update pin children with parent access
CREATE POLICY "Users can update pin children with parent access" ON public.pin_children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  );

-- Users can delete pin children with parent access
CREATE POLICY "Users can delete pin children with parent access" ON public.pin_children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  );

-- ==========================================
-- PHOTOS TABLE POLICIES
-- ==========================================

-- Users can view photos for accessible pins
CREATE POLICY "Users can view photos for accessible content" ON public.photos
  FOR SELECT USING (
    -- Photos attached to accessible projects
    (project_id IS NOT NULL AND can_access_project(project_id))
    OR
    -- Photos attached to accessible roofs
    (roof_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.roofs r 
      WHERE r.id = roof_id AND can_access_project(r.project_id)
    ))
    OR
    -- Photos attached to accessible pins
    (pin_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    ))
    OR
    -- Photos attached to accessible pin children
    (child_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pin_children pc
      JOIN public.pins p ON p.id = pc.pin_id
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE pc.child_id = child_id AND can_access_project(r.project_id)
    ))
  );

-- Users can upload photos to accessible content
CREATE POLICY "Users can upload photos to accessible content" ON public.photos
  FOR INSERT WITH CHECK (
    uploaded_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    AND (
      (project_id IS NOT NULL AND can_access_project(project_id))
      OR
      (roof_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.roofs r 
        WHERE r.id = roof_id AND can_access_project(r.project_id)
      ))
      OR
      (pin_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.pins p
        JOIN public.roofs r ON r.id = p.roof_id
        WHERE p.id = pin_id AND can_access_project(r.project_id)
      ))
      OR
      (child_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.pin_children pc
        JOIN public.pins p ON p.id = pc.pin_id
        JOIN public.roofs r ON r.id = p.roof_id
        WHERE pc.child_id = child_id AND can_access_project(r.project_id)
      ))
    )
  );

-- Users can delete their own photos or admins can delete any
CREATE POLICY "Users can delete own photos or admins can delete any" ON public.photos
  FOR DELETE USING (
    uploaded_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR get_user_role() = 'Admin'
  );

-- ==========================================
-- CHATS TABLE POLICIES
-- ==========================================

-- Users can view chats in accessible scopes
CREATE POLICY "Users can view chats in accessible scopes" ON public.chats
  FOR SELECT USING (
    -- Global chats - all authenticated users can see
    (scope = 'global')
    OR
    -- Roof-specific chats - users with roof access
    (scope = 'roof' AND scope_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.roofs r 
      WHERE r.id = scope_id::uuid AND can_access_project(r.project_id)
    ))
    OR
    -- Pin-specific chats - users with pin access
    (scope = 'pin' AND scope_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = scope_id::uuid AND can_access_project(r.project_id)
    ))
  );

-- Users can send chats in accessible scopes
CREATE POLICY "Users can send chats in accessible scopes" ON public.chats
  FOR INSERT WITH CHECK (
    created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    AND (
      (scope = 'global')
      OR
      (scope = 'roof' AND scope_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.roofs r 
        WHERE r.id = scope_id::uuid AND can_access_project(r.project_id)
      ))
      OR
      (scope = 'pin' AND scope_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.pins p
        JOIN public.roofs r ON r.id = p.roof_id
        WHERE p.id = scope_id::uuid AND can_access_project(r.project_id)
      ))
    )
  );

-- Users can delete their own chats or admins can delete any
CREATE POLICY "Users can delete own chats or admins can delete any" ON public.chats
  FOR DELETE USING (
    created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR get_user_role() = 'Admin'
  );

-- ==========================================
-- AUDIT LOG TABLE POLICIES
-- ==========================================

-- Admins and QA managers can view audit logs
CREATE POLICY "Admins and QA managers can view audit logs" ON public.audit_log
  FOR SELECT USING (get_user_role() IN ('Admin', 'QA_Manager'));

-- System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs" ON public.audit_log
  FOR INSERT WITH CHECK (true); -- This will be restricted by service role

-- Only admins can delete audit logs
CREATE POLICY "Only admins can delete audit logs" ON public.audit_log
  FOR DELETE USING (get_user_role() = 'Admin');

-- ==========================================
-- USER PREFERENCES TABLE POLICIES
-- ==========================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_prefs
  FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences" ON public.user_prefs
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- ==========================================
-- LEGACY TABLE POLICIES (for backward compatibility)
-- ==========================================

-- Apply same access patterns to legacy tables
CREATE POLICY "Users can view pin items via pin access" ON public.pin_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  );

CREATE POLICY "Users can manage pin items via pin access" ON public.pin_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pins p
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE p.id = pin_id AND can_access_project(r.project_id)
    )
  );

-- Apply similar policies to pin_images and pin_chat
CREATE POLICY "Users can view pin images via pin item access" ON public.pin_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pin_items pi
      JOIN public.pins p ON p.id = pi.pin_id
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE pi.id = pin_item_id AND can_access_project(r.project_id)
    )
  );

CREATE POLICY "Users can manage pin images via pin item access" ON public.pin_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pin_items pi
      JOIN public.pins p ON p.id = pi.pin_id
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE pi.id = pin_item_id AND can_access_project(r.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pin_items pi
      JOIN public.pins p ON p.id = pi.pin_id
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE pi.id = pin_item_id AND can_access_project(r.project_id)
    )
  );

CREATE POLICY "Users can view pin chat via pin item access" ON public.pin_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pin_items pi
      JOIN public.pins p ON p.id = pi.pin_id
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE pi.id = pin_item_id AND can_access_project(r.project_id)
    )
  );

CREATE POLICY "Users can manage pin chat via pin item access" ON public.pin_chat
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pin_items pi
      JOIN public.pins p ON p.id = pi.pin_id
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE pi.id = pin_item_id AND can_access_project(r.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pin_items pi
      JOIN public.pins p ON p.id = pi.pin_id
      JOIN public.roofs r ON r.id = p.roof_id
      WHERE pi.id = pin_item_id AND can_access_project(r.project_id)
    )
    AND author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Grant necessary permissions to service role for system operations
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;