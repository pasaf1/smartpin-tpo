-- Fix storage policies for roof plan uploads
-- Allow authenticated users (especially admins) to upload roof plans

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload roof plans" ON storage.objects;
DROP POLICY IF EXISTS "Users can view roof plans" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all roof plans" ON storage.objects;

-- Create comprehensive storage policies for the pin-photos bucket
-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pin-photos');

-- Policy 2: Allow authenticated users to view files  
CREATE POLICY "Authenticated users can view files" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'pin-photos');

-- Policy 3: Allow admins and QA managers to delete files
CREATE POLICY "Admins can manage all files" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pin-photos' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'QA_Manager')
    )
  );

-- Policy 4: Allow users to update their own files or admins to update any
CREATE POLICY "Users can update files" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pin-photos' AND
    (
      -- User owns the file (for regular uploads)
      owner = auth.uid() OR
      -- User is admin/QA manager (can manage any file)
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('Admin', 'QA_Manager', 'Supervisor')
      )
    )
  );

-- Ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pin-photos',
  'pin-photos', 
  true, 
  26214400, -- 25MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

-- Add specific policy for roof plans in the roof-plans folder
CREATE POLICY "Roof plans are accessible" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pin-photos' AND
    (name LIKE 'roof-plans/%' OR name LIKE 'defects/%' OR name LIKE 'completions/%' OR name LIKE 'general/%')
  );