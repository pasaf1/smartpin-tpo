-- SmartPin TPO Row Level Security Policies
-- Define access control based on user roles and relationships

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has admin privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_user_role() = 'Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT
    USING (true); -- All authenticated users can see user profiles

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage users" ON public.users
    FOR ALL
    USING (public.is_admin());

-- Projects table policies
DROP POLICY IF EXISTS "Users can view projects" ON public.projects;
CREATE POLICY "Users can view projects" ON public.projects
    FOR SELECT
    USING (true); -- All authenticated users can view projects

DROP POLICY IF EXISTS "QA Managers and Admins can create projects" ON public.projects;
CREATE POLICY "QA Managers and Admins can create projects" ON public.projects
    FOR INSERT
    WITH CHECK (public.get_user_role() IN ('Admin', 'QA_Manager'));

DROP POLICY IF EXISTS "QA Managers and Admins can update projects" ON public.projects;
CREATE POLICY "QA Managers and Admins can update projects" ON public.projects
    FOR UPDATE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager'));

-- Roofs table policies
DROP POLICY IF EXISTS "Users can view roofs" ON public.roofs;
CREATE POLICY "Users can view roofs" ON public.roofs
    FOR SELECT
    USING (true); -- All authenticated users can view roofs

DROP POLICY IF EXISTS "QA Managers and Admins can manage roofs" ON public.roofs;
CREATE POLICY "QA Managers and Admins can manage roofs" ON public.roofs
    FOR ALL
    USING (public.get_user_role() IN ('Admin', 'QA_Manager'));

-- Pins table policies
DROP POLICY IF EXISTS "Users can view pins" ON public.pins;
CREATE POLICY "Users can view pins" ON public.pins
    FOR SELECT
    USING (true); -- All authenticated users can view pins

DROP POLICY IF EXISTS "Supervisors and above can create pins" ON public.pins;
CREATE POLICY "Supervisors and above can create pins" ON public.pins
    FOR INSERT
    WITH CHECK (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor'));

DROP POLICY IF EXISTS "Supervisors and above can update pins" ON public.pins;
CREATE POLICY "Supervisors and above can update pins" ON public.pins
    FOR UPDATE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor'));

-- Pin children table policies
DROP POLICY IF EXISTS "Users can view pin children" ON public.pin_children;
CREATE POLICY "Users can view pin children" ON public.pin_children
    FOR SELECT
    USING (true); -- All authenticated users can view pin children

DROP POLICY IF EXISTS "Foremen and above can create pin children" ON public.pin_children;
CREATE POLICY "Foremen and above can create pin children" ON public.pin_children
    FOR INSERT
    WITH CHECK (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

DROP POLICY IF EXISTS "Foremen and above can update pin children" ON public.pin_children;
CREATE POLICY "Foremen and above can update pin children" ON public.pin_children
    FOR UPDATE
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

-- Photos table policies
DROP POLICY IF EXISTS "Users can view photos" ON public.photos;
CREATE POLICY "Users can view photos" ON public.photos
    FOR SELECT
    USING (true); -- All authenticated users can view photos

DROP POLICY IF EXISTS "Foremen and above can upload photos" ON public.photos;
CREATE POLICY "Foremen and above can upload photos" ON public.photos
    FOR INSERT
    WITH CHECK (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;
CREATE POLICY "Users can update own photos" ON public.photos
    FOR UPDATE
    USING (uploaded_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Chats table policies
DROP POLICY IF EXISTS "Users can view chats" ON public.chats;
CREATE POLICY "Users can view chats" ON public.chats
    FOR SELECT
    USING (true); -- All authenticated users can view chats

DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats" ON public.chats
    FOR INSERT
    WITH CHECK (created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
CREATE POLICY "Users can update own chats" ON public.chats
    FOR UPDATE
    USING (created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Audit log policies (read-only for most, full access for admins)
DROP POLICY IF EXISTS "QA Managers and above can view audit log" ON public.audit_log;
CREATE POLICY "QA Managers and above can view audit log" ON public.audit_log
    FOR SELECT
    USING (public.get_user_role() IN ('Admin', 'QA_Manager'));

DROP POLICY IF EXISTS "System can create audit entries" ON public.audit_log;
CREATE POLICY "System can create audit entries" ON public.audit_log
    FOR INSERT
    WITH CHECK (true); -- System operations can create audit entries

-- User preferences policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_prefs;
CREATE POLICY "Users can manage own preferences" ON public.user_prefs
    FOR ALL
    USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Legacy table policies (for backward compatibility)
DROP POLICY IF EXISTS "Users can view pin items" ON public.pin_items;
CREATE POLICY "Users can view pin items" ON public.pin_items
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Foremen and above can manage pin items" ON public.pin_items;
CREATE POLICY "Foremen and above can manage pin items" ON public.pin_items
    FOR ALL
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

DROP POLICY IF EXISTS "Users can view pin images" ON public.pin_images;
CREATE POLICY "Users can view pin images" ON public.pin_images
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Foremen and above can manage pin images" ON public.pin_images;
CREATE POLICY "Foremen and above can manage pin images" ON public.pin_images
    FOR ALL
    USING (public.get_user_role() IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman'));

DROP POLICY IF EXISTS "Users can view pin chat" ON public.pin_chat;
CREATE POLICY "Users can view pin chat" ON public.pin_chat
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can create pin chat" ON public.pin_chat;
CREATE POLICY "Users can create pin chat" ON public.pin_chat
    FOR INSERT
    WITH CHECK (author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Create a service account user for system operations
INSERT INTO public.users (id, full_name, email, role, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'System Service Account',
    'system@smartpin-tpo.com',
    'Admin',
    now()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, full_name, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'Viewer', -- Default role for new users
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();