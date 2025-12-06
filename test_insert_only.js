import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertOnly() {
  console.log('Testing INSERT without SELECT...\n');
  
  const testLog = {
    user_id: '640c26ce-6541-42c3-b369-f4f75faeab7d',
    endpoint: '/dalsiai/generate',
    method: 'POST',
    status_code: 200,
    response_time_ms: 1250,
    tokens_used: 200,
    cost_usd: 0.002,
    subscription_tier: 'free'
  };
  
  console.log('Test 1: Insert WITHOUT .select()');
  const { error: error1 } = await supabase
    .from('api_usage_logs')
    .insert([testLog]);
  
  if (error1) {
    console.error('❌ Insert failed:', error1.message);
  } else {
    console.log('✅ Insert succeeded (no data returned)');
  }
  
  console.log('\nTest 2: Insert WITH .select()');
  const { data, error: error2 } = await supabase
    .from('api_usage_logs')
    .insert([testLog])
    .select();
  
  if (error2) {
    console.error('❌ Insert with select failed:', error2.message);
  } else {
    console.log('✅ Insert with select succeeded!');
    console.log('   Returned data:', data);
  }
}

testInsertOnly();
