-- Chats DELETE policies
-- Allow users to delete their own messages; Admins can delete any

BEGIN;

-- Ensure previous conflicting policies are dropped
DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can delete chats" ON public.chats;

CREATE POLICY "Users can delete own chats" ON public.chats
  FOR DELETE
  USING (created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can delete chats" ON public.chats
  FOR DELETE
  USING (public.is_admin());

COMMIT;
