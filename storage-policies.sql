-- Storage policies for roof-plans bucket
-- This needs to be executed in Supabase SQL Editor

-- Enable RLS on the storage.objects table (if not already enabled)
-- ALTER TABLE storage.objects ENABLE row_level_security;

-- Policy to allow authenticated users to upload files to roof-plans bucket
CREATE POLICY "Allow authenticated users to upload roof plans" ON storage.objects
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'roof-plans');

-- Policy to allow authenticated users to view files in roof-plans bucket  
CREATE POLICY "Allow authenticated users to view roof plans" ON storage.objects
  FOR SELECT 
  TO authenticated 
  USING (bucket_id = 'roof-plans');

-- Policy to allow authenticated users to update their own uploads (optional)
CREATE POLICY "Allow users to update their own roof plans" ON storage.objects
  FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'roof-plans' AND auth.uid() = owner);

-- Policy to allow authenticated users to delete their own uploads (optional)
CREATE POLICY "Allow users to delete their own roof plans" ON storage.objects
  FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'roof-plans' AND auth.uid() = owner);

-- Make sure the bucket allows public access for viewing uploaded images
-- This should be done via Supabase dashboard: Storage > roof-plans > Settings > Public bucket = ON