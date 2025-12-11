-- ============================================================================
-- Migration: Update RLS (Row Level Security) Policies for Chats Table
-- Description: Creates/updates RLS policies to ensure users can only access
--              their own chats and that archived chats are properly secured
-- ============================================================================

-- Enable RLS on chats table (if not already enabled)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
DROP POLICY IF EXISTS "Public access to shared chats" ON public.chats;

-- ============================================================================
-- SELECT Policy: Users can view their own chats
-- ============================================================================
CREATE POLICY "Users can view their own chats"
ON public.chats
FOR SELECT
USING (
  -- User can view their own chats
  auth.uid() = user_id
  -- OR if the chat is shared publicly
  OR is_shared = true
);

-- ============================================================================
-- INSERT Policy: Users can create their own chats
-- ============================================================================
CREATE POLICY "Users can create their own chats"
ON public.chats
FOR INSERT
WITH CHECK (
  -- User can only create chats for themselves
  auth.uid() = user_id
);

-- ============================================================================
-- UPDATE Policy: Users can update their own chats
-- ============================================================================
CREATE POLICY "Users can update their own chats"
ON public.chats
FOR UPDATE
USING (
  -- User can only update their own chats
  auth.uid() = user_id
)
WITH CHECK (
  -- User can only update chats that belong to them
  auth.uid() = user_id
);

-- ============================================================================
-- DELETE Policy: Users can delete their own chats
-- ============================================================================
CREATE POLICY "Users can delete their own chats"
ON public.chats
FOR DELETE
USING (
  -- User can only delete their own chats
  auth.uid() = user_id
);

-- ============================================================================
-- SELECT Policy: Public access to shared chats
-- ============================================================================
CREATE POLICY "Public access to shared chats"
ON public.chats
FOR SELECT
USING (
  -- Anyone can view chats that are explicitly shared
  is_shared = true AND share_token IS NOT NULL
);

-- ============================================================================
-- Enable RLS on messages table
-- ============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing message policies if they exist
DROP POLICY IF EXISTS "Users can view messages from their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- ============================================================================
-- SELECT Policy: Users can view messages from their chats
-- ============================================================================
CREATE POLICY "Users can view messages from their chats"
ON public.messages
FOR SELECT
USING (
  -- User can view messages from chats they own
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = auth.uid()
  )
  -- OR messages from shared chats
  OR chat_id IN (
    SELECT id FROM public.chats WHERE is_shared = true
  )
);

-- ============================================================================
-- INSERT Policy: Users can insert messages to their chats
-- ============================================================================
CREATE POLICY "Users can insert messages to their chats"
ON public.messages
FOR INSERT
WITH CHECK (
  -- User can only insert messages to their own chats
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- UPDATE Policy: Users can update their own messages
-- ============================================================================
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (
  -- User can only update messages in their own chats
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- User can only update messages in their own chats
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- DELETE Policy: Users can delete their own messages
-- ============================================================================
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (
  -- User can only delete messages from their own chats
  chat_id IN (
    SELECT id FROM public.chats WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify RLS is enabled on both tables
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
