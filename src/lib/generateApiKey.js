/**
 * API Key Generation Utility
 * Generates secure API keys for portal users
 */

import { supabase } from './supabase';

/**
 * Generate a random API key string
 * Format: sk-dalsi-{random_string}
 * 
 * @returns {string} - Generated API key
 */
const generateKeyString = () => {
  const randomPart = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  return `sk-dalsi-${randomPart}`;
};

/**
 * Hash an API key using SHA-256
 * 
 * @param {string} key - API key to hash
 * @returns {Promise<string>} - Hashed key
 */
const hashApiKey = async (key) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Create an API key for a portal user
 * Sets is_internal = true for portal users
 * 
 * @param {string} userId - User UUID
 * @param {string} subscriptionTier - User's subscription tier (free, pro, enterprise)
 * @returns {Promise<Object>} - Created API key record
 */
export const createPortalUserApiKey = async (userId, subscriptionTier = 'free') => {
  try {
    // Generate API key
    const apiKey = generateKeyString();
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 16); // First 16 characters for display

    // Determine rate limits based on subscription tier
    const rateLimits = {
      free: { perMinute: 10, perHour: 100, perDay: 1000 },
      pro: { perMinute: 60, perHour: 1000, perDay: 10000 },
      enterprise: { perMinute: 200, perHour: 5000, perDay: 50000 },
      custom: { perMinute: 200, perHour: 5000, perDay: 50000 }
    };

    const limits = rateLimits[subscriptionTier] || rateLimits.free;

    // Insert API key into database
    const { data, error } = await supabase
      .from('api_keys')
      .insert([{
        user_id: userId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: 'Portal User API Key',
        is_active: true,
        is_internal: true,  // ← Set to true for portal users
        scopes: ['ai.chat', 'ai.code', 'ai.image'],
        rate_limit_per_minute: limits.perMinute,
        rate_limit_per_hour: limits.perHour,
        rate_limit_per_day: limits.perDay,
        subscription_tier: subscriptionTier,
        environment: 'production'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating API key:', error);
      throw error;
    }

    console.log('✅ API key created for portal user:', {
      userId: userId.substring(0, 8) + '...',
      keyId: data.id.substring(0, 8) + '...',
      prefix: keyPrefix,
      is_internal: true
    });

    return {
      ...data,
      full_key: apiKey // Only returned once, never stored
    };

  } catch (error) {
    console.error('❌ Failed to create portal user API key:', error);
    throw error;
  }
};

/**
 * Get or create API key for a user
 * Checks if user already has an active API key, creates one if not
 * 
 * @param {string} userId - User UUID
 * @param {string} subscriptionTier - User's subscription tier
 * @returns {Promise<Object>} - API key record
 */
export const ensureUserHasApiKey = async (userId, subscriptionTier = 'free') => {
  try {
    // Check if user already has an active API key
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('is_internal', true)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking for existing API key:', fetchError);
      throw fetchError;
    }

    if (existingKey) {
      console.log('✅ User already has an API key:', existingKey.id.substring(0, 8) + '...');
      return existingKey;
    }

    // Create new API key
    console.log('🔑 Creating new API key for user...');
    return await createPortalUserApiKey(userId, subscriptionTier);

  } catch (error) {
    console.error('❌ Failed to ensure user has API key:', error);
    throw error;
  }
};
