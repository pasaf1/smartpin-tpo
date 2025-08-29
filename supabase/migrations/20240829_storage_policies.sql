-- SmartPin TPO - Storage Bucket Policies
-- Date: 2025-08-29

-- Storage policies for pin-photos bucket
-- Allow authenticated users to view all photos
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('pin-photos', '.emptyFolderPlaceholder', null) ON CONFLICT DO NOTHING;

-- Photos bucket: Allow viewing all photos
DROP POLICY IF EXISTS "Give users access to view pin photos" ON storage.objects;
CREATE POLICY "Give users access to view pin photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'pin-photos');

-- Photos bucket: Allow Foremen and above to upload photos
DROP POLICY IF EXISTS "Allow Foremen and above to upload pin photos" ON storage.objects;
CREATE POLICY "Allow Foremen and above to upload pin photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pin-photos' 
        AND (
            (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) 
            IN ('Admin', 'QA_Manager', 'Supervisor', 'Foreman')
        )
    );

-- Photos bucket: Allow users to update own photos, Admins can update any
DROP POLICY IF EXISTS "Allow users to update own pin photos" ON storage.objects;
CREATE POLICY "Allow users to update own pin photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pin-photos' 
        AND (
            auth.uid() = owner 
            OR (
                (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'Admin'
            )
        )
    );

-- Photos bucket: Allow users to delete own photos, Admins can delete any
DROP POLICY IF EXISTS "Allow users to delete own pin photos" ON storage.objects;
CREATE POLICY "Allow users to delete own pin photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pin-photos' 
        AND (
            auth.uid() = owner 
            OR (
                (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'Admin'
            )
        )
    );

-- Chat attachments bucket policies
INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('chat-attachments', '.emptyFolderPlaceholder', null) ON CONFLICT DO NOTHING;

-- Chat attachments: Allow viewing all attachments
DROP POLICY IF EXISTS "Give users access to view chat attachments" ON storage.objects;
CREATE POLICY "Give users access to view chat attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-attachments');

-- Chat attachments: Allow all authenticated users to upload
DROP POLICY IF EXISTS "Allow users to upload chat attachments" ON storage.objects;
CREATE POLICY "Allow users to upload chat attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-attachments' 
        AND auth.uid() = owner
    );

-- Chat attachments: Allow users to update own attachments
DROP POLICY IF EXISTS "Allow users to update own chat attachments" ON storage.objects;
CREATE POLICY "Allow users to update own chat attachments" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'chat-attachments' 
        AND auth.uid() = owner
    );

-- Chat attachments: Allow users to delete own attachments, Admins can delete any
DROP POLICY IF EXISTS "Allow users to delete own chat attachments" ON storage.objects;
CREATE POLICY "Allow users to delete own chat attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'chat-attachments' 
        AND (
            auth.uid() = owner 
            OR (
                (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'Admin'
            )
        )
    );

-- Create buckets if they don't exist (run this in Supabase dashboard)
/*
-- Run these commands in Supabase SQL Editor:

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pin-photos', 'pin-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;
*/
