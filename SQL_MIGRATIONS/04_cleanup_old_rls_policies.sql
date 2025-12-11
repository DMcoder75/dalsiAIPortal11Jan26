-- ============================================================================
-- Migration: Clean Up Old RLS Policies
-- Description: Removes old RLS policies that use auth.uid() which don't work
--              with custom JWT authentication
-- ============================================================================

-- Drop old policies that use auth.uid() from messages table
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;

-- Drop old policies from chats table if they exist
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
DROP POLICY IF EXISTS "Public access to shared chats" ON public.chats;

-- ============================================================================
-- Verification: List remaining policies
-- ============================================================================
SELECT policyname, permissive, roles
FROM pg_policies
WHERE tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;
