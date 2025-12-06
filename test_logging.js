/**
 * Test script to verify API logging functionality
 * Tests both guest user retrieval and API log insertion
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogging() {
  console.log('🧪 Testing API Logging Functionality\n');
  console.log('=' .repeat(60));
  
  // Step 1: Get guest user ID
  console.log('\n📋 Step 1: Fetching Guest User');
  console.log('-'.repeat(60));
  
  const { data: guestUser, error: guestError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, subscription_tier')
    .eq('first_name', 'Guest')
    .eq('last_name', 'User')
    .maybeSingle();
  
  if (guestError) {
    console.error('❌ Error fetching guest user:', guestError);
    return;
  }
  
  if (!guestUser) {
    console.error('❌ Guest user not found!');
    console.log('\n⚠️  Please create a guest user in the users table with:');
    console.log('   - first_name: "Guest"');
    console.log('   - last_name: "User"');
    console.log('   - subscription_tier: "free"');
    return;
  }
  
  console.log('✅ Guest user found:');
  console.log(`   ID: ${guestUser.id}`);
  console.log(`   Email: ${guestUser.email}`);
  console.log(`   Name: ${guestUser.first_name} ${guestUser.last_name}`);
  console.log(`   Tier: ${guestUser.subscription_tier}`);
  
  // Step 2: Test inserting a log entry
  console.log('\n📋 Step 2: Testing API Log Insertion');
  console.log('-'.repeat(60));
  
  const testLog = {
    user_id: guestUser.id,
    endpoint: '/dalsiai/generate',
    method: 'POST',
    status_code: 200,
    response_time_ms: 1250,
    request_size_bytes: 150,
    response_size_bytes: 850,
    ip_address: '203.123.64.11',
    tokens_used: 200,
    cost_usd: 0.002,
    subscription_tier: 'free',
    user_agent: 'Mozilla/5.0 (Test)',
    request_metadata: {
      model: 'dalsiai',
      messageLength: 50,
      responseLength: 200,
      isGuest: true,
      test: true
    }
  };
  
  console.log('📝 Inserting test log entry...');
  
  const { data: logData, error: logError } = await supabase
    .from('api_usage_logs')
    .insert([testLog])
    .select();
  
  if (logError) {
    console.error('❌ Error inserting log:', logError);
    console.error('   Code:', logError.code);
    console.error('   Details:', logError.details);
    console.error('   Hint:', logError.hint);
    return;
  }
  
  console.log('✅ Test log inserted successfully!');
  console.log(`   Log ID: ${logData[0].id}`);
  console.log(`   User ID: ${logData[0].user_id}`);
  console.log(`   Endpoint: ${logData[0].endpoint}`);
  console.log(`   Tokens: ${logData[0].tokens_used}`);
  console.log(`   Cost: $${logData[0].cost_usd}`);
  
  // Step 3: Verify the log was inserted
  console.log('\n📋 Step 3: Verifying Log Entry');
  console.log('-'.repeat(60));
  
  const { data: verifyData, error: verifyError } = await supabase
    .from('api_usage_logs')
    .select('*')
    .eq('id', logData[0].id)
    .single();
  
  if (verifyError) {
    console.error('❌ Error verifying log:', verifyError);
    return;
  }
  
  console.log('✅ Log entry verified in database!');
  console.log('   Full record:', JSON.stringify(verifyData, null, 2));
  
  // Step 4: Check recent logs
  console.log('\n📋 Step 4: Checking Recent API Logs');
  console.log('-'.repeat(60));
  
  const { data: recentLogs, error: recentError } = await supabase
    .from('api_usage_logs')
    .select('id, user_id, endpoint, tokens_used, cost_usd, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentError) {
    console.error('❌ Error fetching recent logs:', recentError);
    return;
  }
  
  console.log(`✅ Found ${recentLogs.length} recent log entries:`);
  recentLogs.forEach((log, index) => {
    console.log(`\n   ${index + 1}. Log ID: ${log.id}`);
    console.log(`      User ID: ${log.user_id}`);
    console.log(`      Endpoint: ${log.endpoint}`);
    console.log(`      Tokens: ${log.tokens_used}`);
    console.log(`      Cost: $${log.cost_usd}`);
    console.log(`      Created: ${log.created_at}`);
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log('\n✨ API logging is working correctly!');
  console.log('   - Guest user found and accessible');
  console.log('   - Log insertion successful');
  console.log('   - Log verification successful');
  console.log('   - Recent logs retrievable');
  console.log('\n🚀 The application should now log all API calls properly.');
}

testLogging().catch(error => {
  console.error('\n❌ Test failed with error:', error);
});
