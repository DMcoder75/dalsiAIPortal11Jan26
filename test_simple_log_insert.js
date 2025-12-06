import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleInsert() {
  console.log('Testing simple insert to api_usage_logs...\n');
  
  // Test 1: Minimal required fields only
  console.log('Test 1: Minimal fields (no api_key_id)');
  const test1 = {
    user_id: '640c26ce-6541-42c3-b369-f4f75faeab7d',
    endpoint: '/test',
    method: 'POST'
  };
  
  const { error: error1 } = await supabase
    .from('api_usage_logs')
    .insert([test1]);
  
  if (error1) {
    console.error('❌ Test 1 failed:', error1.message);
  } else {
    console.log('✅ Test 1 passed\n');
  }
  
  // Test 2: With api_key_id
  console.log('Test 2: With api_key_id');
  const test2 = {
    user_id: '640c26ce-6541-42c3-b369-f4f75faeab7d',
    api_key_id: 'a96b22f8-f925-42a7-a791-db2f9335cc8f',
    endpoint: '/test',
    method: 'POST'
  };
  
  const { error: error2 } = await supabase
    .from('api_usage_logs')
    .insert([test2]);
  
  if (error2) {
    console.error('❌ Test 2 failed:', error2.message);
    console.error('   Code:', error2.code);
    console.error('   Details:', error2.details);
  } else {
    console.log('✅ Test 2 passed\n');
  }
  
  // Test 3: Full data like in the test
  console.log('Test 3: Full data with all fields');
  const test3 = {
    user_id: '640c26ce-6541-42c3-b369-f4f75faeab7d',
    api_key_id: 'a96b22f8-f925-42a7-a791-db2f9335cc8f',
    endpoint: '/dalsiai/generate',
    method: 'POST',
    status_code: 200,
    response_time_ms: 1500,
    tokens_used: 200,
    cost_usd: 0.002,
    subscription_tier: 'free',
    ip_address: '203.123.64.11'
  };
  
  const { error: error3 } = await supabase
    .from('api_usage_logs')
    .insert([test3]);
  
  if (error3) {
    console.error('❌ Test 3 failed:', error3.message);
  } else {
    console.log('✅ Test 3 passed');
  }
}

testSimpleInsert();
