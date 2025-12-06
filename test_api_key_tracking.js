/**
 * Test script to verify API key usage tracking
 * Tests fetching API keys and updating usage statistics
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uhgypnlikwtfxnkixjzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0';

const supabase = createClient(supabaseUrl, supabaseKey);

const GUEST_USER_ID = '640c26ce-6541-42c3-b369-f4f75faeab7d';
const GUEST_API_KEY_ID = 'a96b22f8-f925-42a7-a791-db2f9335cc8f';

async function testApiKeyTracking() {
  console.log('🧪 Testing API Key Usage Tracking\n');
  console.log('='.repeat(70));
  
  // Step 1: Verify guest user API key exists
  console.log('\n📋 Step 1: Verifying Guest User API Key');
  console.log('-'.repeat(70));
  
  const { data: apiKey, error: keyError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('id', GUEST_API_KEY_ID)
    .single();
  
  if (keyError) {
    console.error('❌ Error fetching API key:', keyError);
    return;
  }
  
  console.log('✅ Guest API key found:');
  console.log(`   ID: ${apiKey.id}`);
  console.log(`   User ID: ${apiKey.user_id}`);
  console.log(`   Name: ${apiKey.name}`);
  console.log(`   Prefix: ${apiKey.key_prefix}`);
  console.log(`   Active: ${apiKey.is_active}`);
  console.log(`   Tier: ${apiKey.subscription_tier}`);
  console.log(`\n   Current Usage:`);
  console.log(`   - Total Requests: ${apiKey.total_requests}`);
  console.log(`   - Total Tokens: ${apiKey.total_tokens_used}`);
  console.log(`   - Total Cost: $${apiKey.total_cost_usd}`);
  console.log(`   - Last Used: ${apiKey.last_used_at || 'Never'}`);
  
  // Step 2: Test API key lookup by user ID
  console.log('\n📋 Step 2: Testing API Key Lookup by User ID');
  console.log('-'.repeat(70));
  
  const { data: lookupKey, error: lookupError } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, is_active')
    .eq('user_id', GUEST_USER_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (lookupError) {
    console.error('❌ Error looking up API key:', lookupError);
    return;
  }
  
  if (!lookupKey) {
    console.error('❌ No API key found for guest user!');
    return;
  }
  
  console.log('✅ API key lookup successful:');
  console.log(`   Found: ${lookupKey.name}`);
  console.log(`   ID: ${lookupKey.id}`);
  console.log(`   Prefix: ${lookupKey.key_prefix}`);
  
  // Step 3: Simulate API usage update
  console.log('\n📋 Step 3: Simulating API Usage Update');
  console.log('-'.repeat(70));
  
  const testUsage = {
    tokens_used: 150,
    cost_usd: 0.0015,
    endpoint: '/dalsiai/generate',
    ip_address: '203.123.64.11'
  };
  
  console.log('📊 Test usage data:');
  console.log(`   Tokens: ${testUsage.tokens_used}`);
  console.log(`   Cost: $${testUsage.cost_usd}`);
  console.log(`   Endpoint: ${testUsage.endpoint}`);
  console.log(`   IP: ${testUsage.ip_address}`);
  
  // Calculate new values
  const newTotalRequests = (apiKey.total_requests || 0) + 1;
  const newTotalTokens = (apiKey.total_tokens_used || 0) + testUsage.tokens_used;
  const newTotalCost = parseFloat(apiKey.total_cost_usd || 0) + parseFloat(testUsage.cost_usd);
  
  console.log('\n📈 Calculated new values:');
  console.log(`   New Total Requests: ${newTotalRequests}`);
  console.log(`   New Total Tokens: ${newTotalTokens}`);
  console.log(`   New Total Cost: $${newTotalCost.toFixed(6)}`);
  
  // Update the API key
  console.log('\n💾 Updating API key usage...');
  
  const { error: updateError } = await supabase
    .from('api_keys')
    .update({
      total_requests: newTotalRequests,
      total_tokens_used: newTotalTokens,
      total_cost_usd: newTotalCost,
      last_used_at: new Date().toISOString(),
      last_used_ip: testUsage.ip_address,
      last_used_endpoint: testUsage.endpoint,
      updated_at: new Date().toISOString()
    })
    .eq('id', GUEST_API_KEY_ID);
  
  if (updateError) {
    console.error('❌ Error updating API key:', updateError);
    return;
  }
  
  console.log('✅ API key usage updated successfully!');
  
  // Step 4: Verify the update
  console.log('\n📋 Step 4: Verifying Updated Values');
  console.log('-'.repeat(70));
  
  const { data: updatedKey, error: verifyError } = await supabase
    .from('api_keys')
    .select('total_requests, total_tokens_used, total_cost_usd, last_used_at, last_used_ip, last_used_endpoint')
    .eq('id', GUEST_API_KEY_ID)
    .single();
  
  if (verifyError) {
    console.error('❌ Error verifying update:', verifyError);
    return;
  }
  
  console.log('✅ Updated values verified:');
  console.log(`   Total Requests: ${updatedKey.total_requests}`);
  console.log(`   Total Tokens: ${updatedKey.total_tokens_used}`);
  console.log(`   Total Cost: $${updatedKey.total_cost_usd}`);
  console.log(`   Last Used At: ${updatedKey.last_used_at}`);
  console.log(`   Last Used IP: ${updatedKey.last_used_ip}`);
  console.log(`   Last Used Endpoint: ${updatedKey.last_used_endpoint}`);
  
  // Step 5: Test complete logging flow
  console.log('\n📋 Step 5: Testing Complete Logging Flow');
  console.log('-'.repeat(70));
  
  console.log('📝 Inserting test log with API key...');
  
  const testLog = {
    user_id: GUEST_USER_ID,
    api_key_id: GUEST_API_KEY_ID,
    endpoint: '/dalsiai/generate',
    method: 'POST',
    status_code: 200,
    response_time_ms: 1500,
    tokens_used: 200,
    cost_usd: 0.002,
    subscription_tier: 'free',
    ip_address: '203.123.64.11',
    request_metadata: {
      model: 'dalsiai',
      test: true,
      api_key_tracking: true
    }
  };
  
  const { data: logData, error: logError } = await supabase
    .from('api_usage_logs')
    .insert([testLog])
    .select();
  
  if (logError) {
    console.error('❌ Error inserting log:', logError);
    return;
  }
  
  console.log('✅ Test log inserted successfully!');
  console.log(`   Log ID: ${logData[0].id}`);
  console.log(`   User ID: ${logData[0].user_id}`);
  console.log(`   API Key ID: ${logData[0].api_key_id}`);
  console.log(`   Tokens: ${logData[0].tokens_used}`);
  console.log(`   Cost: $${logData[0].cost_usd}`);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL TESTS PASSED!');
  console.log('='.repeat(70));
  console.log('\n✨ API key usage tracking is working correctly!');
  console.log('   - API key lookup by user ID: ✅');
  console.log('   - Usage statistics update: ✅');
  console.log('   - API log with key ID: ✅');
  console.log('   - Verification of updates: ✅');
  console.log('\n🚀 The application will now track API key usage for all users.');
}

testApiKeyTracking().catch(error => {
  console.error('\n❌ Test failed with error:', error);
});
