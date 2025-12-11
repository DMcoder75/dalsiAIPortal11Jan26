# Database Migrations for Dalsiai Portal

This directory contains SQL migration scripts to update your Supabase database schema and security policies.

## Migrations

### 1. Add Missing Columns (`01_add_missing_columns.sql`)

**Purpose**: Adds the `archived` column to the `chats` table to support chat archiving functionality.

**Changes**:
- Adds `archived` boolean column to `chats` table with default value `false`
- Creates indexes for better query performance on archived chats
- Creates combined index on `user_id` and `archived` for efficient filtering

**Why**: The application code tries to set and filter on the `archived` column, but it didn't exist in the database schema.

**How to run**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `01_add_missing_columns.sql`
6. Click **Run**

---

### 2. Update RLS Policies (`02_update_rls_policies.sql`)

**Purpose**: Creates/updates Row Level Security (RLS) policies to ensure:
- Users can only access their own chats and messages
- Shared chats are accessible to the public
- Archived chats are properly secured
- Data integrity and privacy are maintained

**Changes**:

#### Chats Table Policies:
- **SELECT**: Users can view their own chats or publicly shared chats
- **INSERT**: Users can only create chats for themselves
- **UPDATE**: Users can only update their own chats
- **DELETE**: Users can only delete their own chats
- **Public Share**: Anyone can view chats with a valid share token

#### Messages Table Policies:
- **SELECT**: Users can view messages from their own chats or shared chats
- **INSERT**: Users can only add messages to their own chats
- **UPDATE**: Users can only update messages in their own chats
- **DELETE**: Users can only delete messages from their own chats

**Why**: RLS policies are critical for:
- Data security: Preventing users from accessing other users' data
- Privacy: Ensuring conversations are private unless explicitly shared
- Compliance: Meeting data protection requirements

**How to run**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `02_update_rls_policies.sql`
6. Click **Run**

---

## Execution Order

**Always run migrations in order**:
1. First: `01_add_missing_columns.sql` (Add schema changes)
2. Second: `02_update_rls_policies.sql` (Update security policies)

---

## Verification

After running each migration, you can verify the changes:

### Check if archived column was added:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'chats' AND column_name = 'archived';
```

### Check RLS policies:
```sql
SELECT policyname, permissive, roles
FROM pg_policies
WHERE tablename = 'chats'
ORDER BY policyname;
```

---

## Rollback Instructions

If you need to rollback changes:

### Rollback: Remove archived column
```sql
ALTER TABLE public.chats DROP COLUMN IF EXISTS archived;
DROP INDEX IF EXISTS idx_chats_archived;
DROP INDEX IF EXISTS idx_chats_user_archived;
```

### Rollback: Remove RLS policies
```sql
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
DROP POLICY IF EXISTS "Public access to shared chats" ON public.chats;
-- ... (repeat for messages table policies)
```

---

## Troubleshooting

### Error: "column already exists"
This means the column was already added. You can safely ignore this error or use `IF NOT EXISTS` in the migration.

### Error: "policy already exists"
The migration script uses `DROP POLICY IF EXISTS` to handle this. If you still get an error, check if the policy names match exactly.

### Error: "permission denied"
Make sure you're logged in as a user with sufficient permissions (typically the project owner or a role with schema modification rights).

---

## Support

If you encounter any issues:
1. Check the error message carefully
2. Verify you're in the correct project and database
3. Ensure you're running migrations in the correct order
4. Contact support if problems persist

---

## Notes

- These migrations are idempotent (safe to run multiple times)
- RLS policies are essential for security - do not skip them
- Always test migrations in a development environment first
- Keep backups of your database before running migrations
