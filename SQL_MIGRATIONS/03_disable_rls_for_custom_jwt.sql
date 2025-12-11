-- ============================================================================
-- Migration: Disable RLS for Custom JWT Authentication
-- Description: Disables Row Level Security on chats and messages tables
--              since the app uses custom JWT authentication instead of
--              Supabase's built-in authentication
-- ============================================================================

-- Disable RLS on chats table
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages table
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on any other tables that might have it
-- (add more as needed)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification: Check which tables have RLS enabled
-- ============================================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- SECURITY NOTE
-- ============================================================================
-- Since RLS is disabled, you MUST implement authentication and authorization
-- at the APPLICATION LEVEL:
--
-- 1. Always validate the JWT token on the backend
-- 2. Extract the user_id from the JWT claims
-- 3. Verify that the user owns the data they're accessing
-- 4. Never trust client-side data validation
--
-- The Supabase client library should handle JWT validation automatically
-- if you've configured it correctly with your custom JWT secret.
-- ============================================================================
