-- ============================================================================
-- Migration: Disable RLS on Chats and Messages Tables
-- Description: Disables RLS since custom JWT authentication cannot be
--              validated by Supabase's RLS policies
-- ============================================================================

-- Disable RLS on chats table
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages table
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('chats', 'messages');

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- Since RLS is disabled, authorization MUST be enforced at the application level:
--
-- 1. Always validate the JWT token in your backend/frontend
-- 2. Extract the user_id from the JWT claims
-- 3. When fetching chats: Only return chats where user_id matches the current user
-- 4. When fetching messages: Only return messages from chats owned by the current user
-- 5. When creating/updating/deleting: Verify ownership before allowing the operation
--
-- Example frontend logic:
-- const user = JSON.parse(localStorage.getItem('user_info'));
-- const chats = await supabase
--   .from('chats')
--   .select('*')
--   .eq('user_id', user.id);  // Filter by current user
--
-- This ensures data isolation even without RLS.
-- ============================================================================
