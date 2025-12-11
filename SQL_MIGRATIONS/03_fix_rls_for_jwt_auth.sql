-- ============================================================================
-- Migration: Fix RLS Policies for JWT Authentication
-- Description: Updates RLS policies to work with custom JWT authentication
--              instead of Supabase's built-in authentication
-- ============================================================================

-- ============================================================================
-- IMPORTANT: Disable RLS temporarily to allow inserts
-- ============================================================================
-- Since the app uses custom JWT authentication (not Supabase Auth),
-- we need to either:
-- 1. Disable RLS completely (less secure but simpler)
-- 2. Use a custom JWT claim verification (more complex but more secure)

-- Option 1: DISABLE RLS (Simpler - recommended for now)
-- This allows the app to work with custom JWT auth
ALTER TABLE public.chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Alternative Option 2: Use Custom JWT Claims (More Secure)
-- ============================================================================
-- If you want to keep RLS enabled, you need to:
-- 1. Configure Supabase to recognize your JWT tokens
-- 2. Extract user_id from the JWT claims
-- 3. Update policies to use these claims

-- Uncomment the policies below if you want to use custom JWT claims:

/*
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
DROP POLICY IF EXISTS "Public access to shared chats" ON public.chats;

-- Re-enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create policies that work with custom JWT claims
-- These assume your JWT has a 'user_id' claim

CREATE POLICY "Users can view their own chats"
ON public.chats
FOR SELECT
USING (
  user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
  OR is_shared = true
);

CREATE POLICY "Users can create their own chats"
ON public.chats
FOR INSERT
WITH CHECK (
  user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
);

CREATE POLICY "Users can update their own chats"
ON public.chats
FOR UPDATE
USING (
  user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
)
WITH CHECK (
  user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
);

CREATE POLICY "Users can delete their own chats"
ON public.chats
FOR DELETE
USING (
  user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
);

CREATE POLICY "Public access to shared chats"
ON public.chats
FOR SELECT
USING (
  is_shared = true AND share_token IS NOT NULL
);

-- Similar policies for messages table
DROP POLICY IF EXISTS "Users can view messages from their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their chats"
ON public.messages
FOR SELECT
USING (
  chat_id IN (
    SELECT id FROM public.chats 
    WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
  )
  OR chat_id IN (
    SELECT id FROM public.chats WHERE is_shared = true
  )
);

CREATE POLICY "Users can insert messages to their chats"
ON public.messages
FOR INSERT
WITH CHECK (
  chat_id IN (
    SELECT id FROM public.chats 
    WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (
  chat_id IN (
    SELECT id FROM public.chats 
    WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
  )
)
WITH CHECK (
  chat_id IN (
    SELECT id FROM public.chats 
    WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
  )
);

CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (
  chat_id IN (
    SELECT id FROM public.chats 
    WHERE user_id = (current_setting('request.jwt.claims', true)::jsonb->>'user_id')::uuid
  )
);
*/

-- ============================================================================
-- Verification
-- ============================================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('chats', 'messages');
