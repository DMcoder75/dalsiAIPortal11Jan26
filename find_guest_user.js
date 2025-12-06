import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findGuestUser() {
  console.log('🔍 Searching for guest user in users table...\n');
  
  // Try different common guest user patterns
  const guestPatterns = [
    'guest@neodalsi.com',
    'guest@dalsi.com', 
    'guest@example.com',
    'guest%'
  ];
  
  for (const pattern of guestPatterns) {
    console.log(`Checking pattern: ${pattern}`);
    
    const query = pattern.includes('%') 
      ? supabase.from('users').select('id, email, subscription_tier, role, created_at').ilike('email', pattern)
      : supabase.from('users').select('id, email, subscription_tier, role, created_at').eq('email', pattern);
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`  ❌ Error:`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      console.log(`  ✅ Found ${data.length} user(s):\n`);
      data.forEach(user => {
        console.log(`  📧 Email: ${user.email}`);
        console.log(`  🆔 ID: ${user.id}`);
        console.log(`  👤 Role: ${user.role}`);
        console.log(`  💳 Tier: ${user.subscription_tier}`);
        console.log(`  📅 Created: ${user.created_at}`);
        console.log('  ---');
      });
    } else {
      console.log(`  ℹ️  No users found\n`);
    }
  }
  
  // Also check total user count
  console.log('\n📊 Checking total users in table...');
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
    
  if (!countError) {
    console.log(`Total users in table: ${count}`);
  }
}

findGuestUser();
