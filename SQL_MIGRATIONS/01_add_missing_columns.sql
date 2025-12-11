-- ============================================================================
-- Migration: Add Missing Columns to Chats Table
-- Description: Adds the 'archived' column to the chats table to support
--              chat archiving functionality in the application
-- ============================================================================

-- Add archived column to chats table
ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Add index for better query performance on archived column
CREATE INDEX IF NOT EXISTS idx_chats_archived 
ON public.chats(archived) 
WHERE archived = false;

-- Add index for user_id and archived combined for efficient filtering
CREATE INDEX IF NOT EXISTS idx_chats_user_archived 
ON public.chats(user_id, archived) 
WHERE archived = false;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'chats' AND column_name = 'archived';
