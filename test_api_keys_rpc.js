import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApiKeysRPC() {
  console.log('Testing admin_get_api_keys RPC...');
  
  const { data, error } = await supabase.rpc('admin_get_api_keys');
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Success! Received', data?.length || 0, 'records');
    if (data && data.length > 0) {
      console.log('First record:', data[0]);
    }
  }
}

testApiKeysRPC();
