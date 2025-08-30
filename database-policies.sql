-- Database RLS Policies for SmartPin TPO
-- Execute these policies in Supabase SQL Editor to fix permission issues

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE projects ENABLE row_level_security;
ALTER TABLE roofs ENABLE row_level_security;
ALTER TABLE pins ENABLE row_level_security;
ALTER TABLE pin_children ENABLE row_level_security;
ALTER TABLE photos ENABLE row_level_security;
ALTER TABLE users ENABLE row_level_security;

-- PROJECTS TABLE POLICIES
-- Allow authenticated users with admin/supervisor roles to create projects
CREATE POLICY "Allow authorized users to create projects" ON projects
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman')
    )
  );

-- Allow authenticated users to view projects they have access to
CREATE POLICY "Allow authenticated users to view projects" ON projects
  FOR SELECT 
  TO authenticated 
  USING (true); -- All authenticated users can view projects

-- Allow authorized users to update projects
CREATE POLICY "Allow authorized users to update projects" ON projects
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor')
    )
  );

-- Allow admin to delete projects
CREATE POLICY "Allow admin to delete projects" ON projects
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'Admin'
    )
  );

-- ROOFS TABLE POLICIES
-- Allow authorized users to create roofs
CREATE POLICY "Allow authorized users to create roofs" ON roofs
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman')
    )
  );

-- Allow authenticated users to view roofs
CREATE POLICY "Allow authenticated users to view roofs" ON roofs
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authorized users to update roofs
CREATE POLICY "Allow authorized users to update roofs" ON roofs
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman')
    )
  );

-- USERS TABLE POLICIES
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  TO authenticated 
  USING (auth_user_id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  TO authenticated 
  USING (auth_user_id = auth.uid());

-- Allow users to insert their own profile (for new registrations)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth_user_id = auth.uid());

-- Allow admin to manage all users
CREATE POLICY "Admin can manage all users" ON users
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role = 'Admin'
    )
  );

-- PINS TABLE POLICIES
-- Allow authenticated users to create pins
CREATE POLICY "Allow authenticated users to create pins" ON pins
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Technician')
    )
  );

-- Allow authenticated users to view pins
CREATE POLICY "Allow authenticated users to view pins" ON pins
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to update pins
CREATE POLICY "Allow authenticated users to update pins" ON pins
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Technician')
    )
  );

-- PIN_CHILDREN TABLE POLICIES
-- Allow authenticated users to create pin children
CREATE POLICY "Allow authenticated users to create pin children" ON pin_children
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Technician')
    )
  );

-- Allow authenticated users to view pin children
CREATE POLICY "Allow authenticated users to view pin children" ON pin_children
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to update pin children
CREATE POLICY "Allow authenticated users to update pin children" ON pin_children
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Technician')
    )
  );

-- PHOTOS TABLE POLICIES
-- Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated users to upload photos" ON photos
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman', 'Technician')
    )
  );

-- Allow authenticated users to view photos
CREATE POLICY "Allow authenticated users to view photos" ON photos
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow users to update/delete their own photos, or supervisors to manage all
CREATE POLICY "Allow users to manage their own photos or supervisors to manage all" ON photos
  FOR UPDATE 
  TO authenticated 
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor')
    )
  );

CREATE POLICY "Allow users to delete their own photos or supervisors to delete all" ON photos
  FOR DELETE 
  TO authenticated 
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager', 'Supervisor')
    )
  );

-- STORAGE POLICIES (if not already set)
-- Note: These should be applied in Supabase Dashboard > Storage > Policies

-- For pin-photos bucket:
-- CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
--   FOR INSERT TO authenticated 
--   WITH CHECK (bucket_id = 'pin-photos');

-- CREATE POLICY "Allow authenticated users to view photos" ON storage.objects
--   FOR SELECT TO authenticated 
--   USING (bucket_id = 'pin-photos');

-- For roof-plans bucket:
-- CREATE POLICY "Allow authenticated users to upload roof plans" ON storage.objects
--   FOR INSERT TO authenticated 
--   WITH CHECK (bucket_id = 'roof-plans');

-- CREATE POLICY "Allow authenticated users to view roof plans" ON storage.objects
--   FOR SELECT TO authenticated 
--   USING (bucket_id = 'roof-plans');