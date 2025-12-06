import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getGuestUser() {
  console.log('🔍 Fetching guest user by first_name="Guest" and last_name="User"...\n');
  
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, subscription_tier, role, created_at')
    .eq('first_name', 'Guest')
    .eq('last_name', 'User')
    .maybeSingle();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (data) {
    console.log('✅ Guest user found!\n');
    console.log('📧 Email:', data.email);
    console.log('🆔 User ID:', data.id);
    console.log('👤 Name:', data.first_name, data.last_name);
    console.log('🎭 Role:', data.role);
    console.log('💳 Subscription Tier:', data.subscription_tier);
    console.log('📅 Created:', data.created_at);
    console.log('\n✅ This ID will be used for guest API logging');
  } else {
    console.log('❌ No guest user found with first_name="Guest" and last_name="User"');
  }
}

getGuestUser();
