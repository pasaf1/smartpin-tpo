-- Storage Configuration for SmartPin TPO
-- Set up storage buckets with proper policies for file uploads

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'pin-photos', 
    'pin-photos', 
    true, 
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'roof-plans', 
    'roof-plans', 
    true, 
    104857600, -- 100MB limit for roof plans
    ARRAY['image/jpeg', 'image/png', 'image/pdf', 'application/pdf']
  ),
  (
    'project-documents', 
    'project-documents', 
    false, -- Private bucket
    104857600, -- 100MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==========================================
-- PIN PHOTOS BUCKET POLICIES
-- ==========================================

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload pin photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pin-photos' 
  AND (storage.foldername(name))[1] IN (
    SELECT r.id::text 
    FROM public.roofs r
    JOIN public.projects p ON p.project_id = r.project_id
    WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
  )
);

-- Allow users to view photos from accessible roofs
CREATE POLICY "Users can view pin photos from accessible roofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pin-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT r.id::text 
    FROM public.roofs r
    JOIN public.projects p ON p.project_id = r.project_id
    WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
  )
);

-- Allow users to update photos they uploaded or admins
CREATE POLICY "Users can update own pin photos or admins can update any"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pin-photos'
  AND (
    owner = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role = 'Admin')
  )
);

-- Allow users to delete photos they uploaded or admins
CREATE POLICY "Users can delete own pin photos or admins can delete any"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pin-photos'
  AND (
    owner = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role = 'Admin')
  )
);

-- ==========================================
-- ROOF PLANS BUCKET POLICIES
-- ==========================================

-- Allow authenticated users to upload roof plans
CREATE POLICY "Authenticated users can upload roof plans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'roof-plans' 
  AND (storage.foldername(name))[1] IN (
    SELECT p.project_id::text 
    FROM public.projects p
    WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
  )
);

-- Allow users to view roof plans from accessible projects
CREATE POLICY "Users can view roof plans from accessible projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'roof-plans'
  AND (storage.foldername(name))[1] IN (
    SELECT p.project_id::text 
    FROM public.projects p
    WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
  )
);

-- Allow project owners and admins to update roof plans
CREATE POLICY "Project owners and admins can update roof plans"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'roof-plans'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT p.project_id::text 
      FROM public.projects p
      WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role = 'Admin')
  )
);

-- Allow project owners and admins to delete roof plans
CREATE POLICY "Project owners and admins can delete roof plans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'roof-plans'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT p.project_id::text 
      FROM public.projects p
      WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role = 'Admin')
  )
);

-- ==========================================
-- PROJECT DOCUMENTS BUCKET POLICIES
-- ==========================================

-- Allow authenticated users to upload project documents
CREATE POLICY "Authenticated users can upload project documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT p.project_id::text 
    FROM public.projects p
    WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
  )
);

-- Allow users to view project documents from accessible projects
CREATE POLICY "Users can view project documents from accessible projects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT p.project_id::text 
    FROM public.projects p
    WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
       OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
  )
);

-- Allow project owners and admins to update project documents
CREATE POLICY "Project owners and admins can update project documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT p.project_id::text 
      FROM public.projects p
      WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role = 'Admin')
  )
);

-- Allow project owners and admins to delete project documents
CREATE POLICY "Project owners and admins can delete project documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT p.project_id::text 
      FROM public.projects p
      WHERE p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role = 'Admin')
  )
);

-- ==========================================
-- HELPER FUNCTIONS FOR STORAGE
-- ==========================================

-- Function to get signed URL for photo uploads
CREATE OR REPLACE FUNCTION get_photo_upload_url(
  roof_id UUID,
  filename TEXT,
  file_type TEXT DEFAULT 'image/jpeg'
)
RETURNS TEXT AS $$
DECLARE
  file_path TEXT;
  signed_url TEXT;
BEGIN
  -- Verify user has access to roof
  IF NOT EXISTS (
    SELECT 1 FROM public.roofs r
    JOIN public.projects p ON p.project_id = r.project_id
    WHERE r.id = roof_id 
    AND (
      p.created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.role IN ('Admin', 'QA_Manager'))
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to roof';
  END IF;
  
  -- Generate file path: roof_id/timestamp_filename
  file_path := roof_id::text || '/' || extract(epoch from now())::bigint || '_' || filename;
  
  -- Return the file path (client will use this with Supabase client to get signed URL)
  RETURN file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned storage objects
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_objects()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  obj RECORD;
BEGIN
  -- Clean up pin photos that no longer reference valid photos records
  FOR obj IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'pin-photos'
    AND name NOT IN (
      SELECT SUBSTRING(file_url_public FROM 'pin-photos/(.+)$') 
      FROM public.photos 
      WHERE file_url_public IS NOT NULL 
      AND file_url_public LIKE '%pin-photos/%'
    )
  LOOP
    DELETE FROM storage.objects 
    WHERE bucket_id = 'pin-photos' AND name = obj.name;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Clean up roof plans that no longer reference valid roofs
  FOR obj IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'roof-plans'
    AND (storage.foldername(name))[1]::uuid NOT IN (
      SELECT project_id FROM public.projects
    )
  LOOP
    DELETE FROM storage.objects 
    WHERE bucket_id = 'roof-plans' AND name = obj.name;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage-related indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_file_url ON public.photos(file_url_public) 
WHERE file_url_public IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_photo_upload_url(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_storage_objects() TO service_role;