import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGuestUser() {
  console.log('Checking for guest user...');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'guest@neodalsi.com')
    .single();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Guest user found:', data);
  }
}

checkGuestUser();
