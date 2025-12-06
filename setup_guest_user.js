import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupGuestUser() {
  console.log('Checking for guest user in users table...');
  
  // Check if guest user exists
  const { data: existingGuest, error: checkError } = await supabase
    .from('users')
    .select('id, email, subscription_tier')
    .eq('email', 'guest@neodalsi.com')
    .maybeSingle();
  
  if (checkError) {
    console.error('Error checking for guest user:', checkError);
    return;
  }
  
  if (existingGuest) {
    console.log('✅ Guest user already exists:');
    console.log('   ID:', existingGuest.id);
    console.log('   Email:', existingGuest.email);
    console.log('   Tier:', existingGuest.subscription_tier);
  } else {
    console.log('❌ Guest user not found. This should be created manually in Supabase.');
    console.log('   Recommended guest user setup:');
    console.log('   - Email: guest@neodalsi.com');
    console.log('   - Subscription Tier: free');
    console.log('   - Role: user');
  }
  
  // Check api_usage_logs table structure
  console.log('\nChecking api_usage_logs table...');
  const { data: logs, error: logsError } = await supabase
    .from('api_usage_logs')
    .select('*')
    .limit(1);
    
  if (logsError) {
    console.error('Error accessing api_usage_logs:', logsError);
  } else {
    console.log('✅ api_usage_logs table is accessible');
  }
}

setupGuestUser();
