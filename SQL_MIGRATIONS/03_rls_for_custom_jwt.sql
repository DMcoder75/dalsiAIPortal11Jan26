-- ============================================================================
-- Migration: RLS Policies for Custom Users Table and JWT Authentication
-- Description: Creates RLS policies that work with custom JWT tokens
--              and a custom users table instead of Supabase Auth
-- ============================================================================

-- ============================================================================
-- Step 1: Extract user_id from JWT claims
-- ============================================================================
-- Supabase allows accessing JWT claims via current_setting('request.jwt.claims')
-- Your JWT should contain a 'user_id' claim that matches the id in your users table

-- ============================================================================
-- Step 2: Enable RLS on tables
-- ============================================================================
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 3: Drop existing policies to avoid conflicts
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
DROP POLICY IF EXISTS "Public access to shared chats" ON public.chats;

DROP POLICY IF EXISTS "Users can view messages from their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- ============================================================================
-- Step 4: Create RLS Policies for CHATS table
-- ============================================================================

-- Helper function to get current user_id from JWT
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid;
$$ LANGUAGE SQL STABLE;

-- SELECT Policy: Users can view their own chats or shared chats
CREATE POLICY "Users can view their own chats"
ON public.chats
FOR SELECT
USING (
  user_id = get_current_user_id()
  OR is_shared = true
);

-- INSERT Policy: Users can only create chats for themselves
CREATE POLICY "Users can create their own chats"
ON public.chats
FOR INSERT
WITH CHECK (
  user_id = get_current_user_id()
);

-- UPDATE Policy: Users can only update their own chats
CREATE POLICY "Users can update their own chats"
ON public.chats
FOR UPDATE
USING (
  user_id = get_current_user_id()
)
WITH CHECK (
  user_id = get_current_user_id()
);

-- DELETE Policy: Users can only delete their own chats
CREATE POLICY "Users can delete their own chats"
ON public.chats
FOR DELETE
USING (
  user_id = get_current_user_id()
);

-- SELECT Policy: Public access to shared chats
CREATE POLICY "Public access to shared chats"
ON public.chats
FOR SELECT
USING (
  is_shared = true AND share_token IS NOT NULL
);

-- ============================================================================
-- Step 5: Create RLS Policies for MESSAGES table
-- ============================================================================

-- SELECT Policy: Users can view messages from their chats
CREATE POLICY "Users can view messages from their chats"
ON public.messages
FOR SELECT
USING (
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = get_current_user_id()
  )
  OR chat_id IN (
    SELECT id FROM public.chats WHERE is_shared = true
  )
);

-- INSERT Policy: Users can only add messages to their chats
CREATE POLICY "Users can insert messages to their chats"
ON public.messages
FOR INSERT
WITH CHECK (
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = get_current_user_id()
  )
);

-- UPDATE Policy: Users can only update messages in their chats
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = get_current_user_id()
  )
)
WITH CHECK (
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = get_current_user_id()
  )
);

-- DELETE Policy: Users can only delete messages from their chats
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = get_current_user_id()
  )
);

-- ============================================================================
-- Step 6: Verification Queries
-- ============================================================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('chats', 'messages');

-- List all policies on chats table
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'chats'
ORDER BY policyname;

-- List all policies on messages table
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- ============================================================================
-- IMPORTANT: JWT Configuration
-- ============================================================================
-- For these policies to work, your JWT token MUST:
--
-- 1. Include a 'user_id' claim that matches the id in your users table
-- 2. Be signed with the same secret that Supabase is configured with
-- 3. Be passed in the Authorization header as: "Bearer <token>"
--
-- Example JWT payload:
-- {
--   "user_id": "18ea9ead-5849-4a6c-a49d-42bee7fd20e4",
--   "email": "user@example.com",
--   "iat": 1234567890,
--   "exp": 1234571490
-- }
--
-- The Supabase client library will automatically extract and use this JWT
-- when making requests to the database.
-- ============================================================================
