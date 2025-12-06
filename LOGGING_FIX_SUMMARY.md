# API Usage Logging Fix - Complete Summary

## Issue Description

The application was not logging API calls to the `api_usage_logs` table in Supabase. Console errors showed:
- 404 error when trying to access non-existent `guest_users` table
- No entries appearing in `api_usage_logs` table
- Guest user initialization failures

## Root Causes Identified

1. **Non-existent `guest_users` table**: Code tried to query/insert into a table that doesn't exist
2. **Guest user identification**: Guest users were being logged with `user_id: null` instead of the actual guest user UUID
3. **RLS Policy**: Row Level Security policy needed to be properly configured for anonymous inserts

## Solutions Implemented

### 1. Created Guest User Utility (`src/lib/guestUser.js`)

Created a new utility module to fetch the guest user UUID from the `users` table:

```javascript
// Guest user is identified by:
// first_name = 'Guest'
// last_name = 'User'

export const getGuestUserId = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, subscription_tier')
    .eq('first_name', 'Guest')
    .eq('last_name', 'User')
    .maybeSingle();
    
  return data?.id || null;
};
```

**Guest User Details:**
- **ID**: `640c26ce-6541-42c3-b369-f4f75faeab7d`
- **Email**: dalsiainoreply@gmail.com
- **Name**: Guest User
- **Tier**: free

### 2. Updated API Logging Service (`src/services/apiLogging.js`)

**Changes:**
- Added import for `getGuestUserId`
- Modified `logGuestApiCall` to fetch and use the guest user UUID instead of null

**Before:**
```javascript
export const logGuestApiCall = async (guestData) => {
  return logChatApiCall({
    user_id: null, // ❌ This was causing issues
    // ...
  });
};
```

**After:**
```javascript
export const logGuestApiCall = async (guestData) => {
  const guestUserId = await getGuestUserId(); // ✅ Fetch guest user UUID
  
  if (!guestUserId) {
    console.error('❌ Cannot log guest API call: Guest user not found');
    return null;
  }
  
  return logChatApiCall({
    user_id: guestUserId, // ✅ Use actual guest user UUID
    // ...
  });
};
```

### 3. Fixed Chat Interface (`src/components/EnhancedChatInterface.jsx`)

**Changes:**
- Removed references to non-existent `guest_users` table
- Updated guest user initialization logic
- Removed `user_id` parameter from `logGuestApiCall` calls (handled internally now)

**Before:**
```javascript
// Check if guest user exists in DB, if not, create one
const { data, error } = await supabase
  .from('guest_users') // ❌ Table doesn't exist
  .select('id')
  .eq('session_id', sessionId)
  .maybeSingle();
```

**After:**
```javascript
// Guest users don't need a separate guest_users table entry
// They use the guest_conversations table for message storage
// and will be logged with user_id from the guest user in the users table
console.log('✅ Guest user session initialized:', sessionId);
```

**API Logging Calls Updated:**

**Before:**
```javascript
await logGuestApiCall({
  user_id: null, // ❌ Passed explicitly
  guest_session_id: guestUserId,
  // ...
});
```

**After:**
```javascript
await logGuestApiCall({
  guest_session_id: guestUserId, // ✅ user_id handled internally
  // ...
});
```

### 4. Verified RLS Policy

Confirmed the Supabase RLS policy is correctly configured:

```sql
CREATE POLICY "Allow anonymous insert for API usage logs"
ON api_usage_logs
FOR INSERT
TO anon
WITH CHECK (true);
```

**Policy Details:**
- **Name**: Allow anonymous insert for API usage logs
- **Command**: INSERT
- **Role**: anon
- **Permissive**: Yes
- **With Check**: true

## Testing Results

### Test 1: Guest User Retrieval
```
✅ Guest user found:
   ID: 640c26ce-6541-42c3-b369-f4f75faeab7d
   Email: dalsiainoreply@gmail.com
   Name: Guest User
   Tier: free
```

### Test 2: API Log Insertion
```
✅ Insert succeeded (no data returned)
✅ Insert with select succeeded!
```

### Test 3: Log Verification
```
✅ Log entry verified in database!
✅ Found recent log entries
```

## Files Modified

1. **Created**: `src/lib/guestUser.js` - Guest user utility
2. **Modified**: `src/services/apiLogging.js` - Updated logging logic
3. **Modified**: `src/components/EnhancedChatInterface.jsx` - Fixed guest user handling
4. **Created**: `test_logging.js` - Test script for verification

## Database Schema

### Guest User in `users` Table
```
id: 640c26ce-6541-42c3-b369-f4f75faeab7d
email: dalsiainoreply@gmail.com
first_name: Guest
last_name: User
subscription_tier: free
role: user
```

### API Usage Logs Schema (`api_usage_logs`)
```sql
CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  response_time_ms integer,
  request_size_bytes integer,
  response_size_bytes integer,
  ip_address inet,
  api_key_id uuid REFERENCES api_keys(id),
  tokens_used integer,
  cost_usd numeric,
  subscription_tier text,
  error_message text,
  request_metadata jsonb,
  user_agent text,
  rate_limit_remaining integer,
  rate_limit_reset timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

## How It Works Now

### For Authenticated Users
1. User sends a message
2. API call is made to NeoDalsi API
3. `logChatApiCall` is called with user's UUID
4. Log entry is inserted into `api_usage_logs` with user's ID

### For Guest Users
1. Guest user sends a message
2. API call is made to NeoDalsi API
3. `logGuestApiCall` is called
4. Guest user UUID is fetched from `users` table (640c26ce-6541-42c3-b369-f4f75faeab7d)
5. Log entry is inserted into `api_usage_logs` with guest user's UUID
6. Guest session ID is stored in `request_metadata.guest_session_id` for tracking

## Expected Log Entry Format

```json
{
  "id": "uuid",
  "user_id": "640c26ce-6541-42c3-b369-f4f75faeab7d",
  "endpoint": "/dalsiai/generate",
  "method": "POST",
  "status_code": 200,
  "response_time_ms": 1250,
  "tokens_used": 200,
  "cost_usd": 0.002,
  "subscription_tier": "free",
  "ip_address": "203.123.64.11",
  "user_agent": "Mozilla/5.0...",
  "request_metadata": {
    "model": "dalsiai",
    "messageLength": 50,
    "responseLength": 200,
    "isGuest": true,
    "guest_session_id": "guest_1763691499545_ezxywlfk9q"
  },
  "created_at": "2025-11-21T02:18:19.524Z"
}
```

## Verification Steps

To verify logging is working:

1. **Check console logs** in browser:
   ```
   ✅ Guest user ID retrieved: 640c26ce-6541-42c3-b369-f4f75faeab7d
   📝 Logging API call: { endpoint: '/dalsiai/generate', ... }
   ✅ API call logged successfully
   ```

2. **Query Supabase** to see logs:
   ```sql
   SELECT * FROM api_usage_logs 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Check for guest user logs**:
   ```sql
   SELECT * FROM api_usage_logs 
   WHERE user_id = '640c26ce-6541-42c3-b369-f4f75faeab7d'
   ORDER BY created_at DESC;
   ```

## Deployment

### Build
```bash
cd /home/ubuntu/dalsiAIPortal21Nov25v_1
pnpm run build
```

### Deploy to Firebase
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
firebase deploy --only hosting --project innate-temple-337717 --non-interactive
```

### Live URL
**https://innate-temple-337717.web.app**

## Troubleshooting

### If logs still don't appear:

1. **Check browser console** for errors
2. **Verify guest user exists**:
   ```sql
   SELECT * FROM users 
   WHERE first_name = 'Guest' AND last_name = 'User';
   ```

3. **Check RLS policy**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'api_usage_logs';
   ```

4. **Test manual insert**:
   ```javascript
   const { data, error } = await supabase
     .from('api_usage_logs')
     .insert([{
       user_id: '640c26ce-6541-42c3-b369-f4f75faeab7d',
       endpoint: '/test',
       method: 'POST'
     }]);
   ```

5. **Check diagnostics**:
   ```javascript
   // In browser console
   window.loggingDiagnostics.print();
   window.loggingDiagnostics.getStats();
   ```

## Benefits of This Fix

1. ✅ **Proper tracking**: All API calls (guest and authenticated) are now logged
2. ✅ **Guest user analytics**: Can analyze guest user behavior and conversion
3. ✅ **Cost tracking**: Monitor token usage and costs per user type
4. ✅ **Performance metrics**: Track response times and error rates
5. ✅ **Session tracking**: Guest sessions stored in metadata for analysis
6. ✅ **Compliance**: Proper audit trail for all API usage

## Summary

The logging system is now fully functional:
- ✅ Guest users are properly identified using the guest user UUID
- ✅ All API calls are logged to `api_usage_logs` table
- ✅ RLS policies allow anonymous inserts
- ✅ No more 404 errors for `guest_users` table
- ✅ Proper session tracking in metadata
- ✅ Application deployed to Firebase

**Status**: 🎉 **FIXED AND DEPLOYED**

**Live Application**: https://innate-temple-337717.web.app
