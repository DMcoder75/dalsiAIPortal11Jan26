/**
 * API Logging Service
 * 
 * Seamlessly logs all API calls to the api_usage_logs table
 * Captures endpoint, tokens used, cost, status, and other metadata
 * Supports both authenticated and guest users with IP tracking
 */

import { createClient } from '@supabase/supabase-js';
import { loggingDiagnostics } from './loggingDiagnostics';
import { getGuestUserId } from '../lib/guestUser';
import { getUserApiKey, updateApiKeyUsage } from '../lib/apiKeyManager';

// Ensure diagnostics is available globally
if (typeof window !== 'undefined') {
  window.loggingDiagnostics = window.loggingDiagnostics || {
    getDiagnostics: () => loggingDiagnostics.getDiagnostics(),
    print: () => loggingDiagnostics.printDiagnostics(),
    export: () => loggingDiagnostics.exportDiagnostics(),
    health: () => loggingDiagnostics.healthCheck(),
    reset: () => loggingDiagnostics.reset(),
    enable: () => loggingDiagnostics.setEnabled(true),
    disable: () => loggingDiagnostics.setEnabled(false),
    getSuccessRate: () => loggingDiagnostics.getSuccessRate(),
    getStats: () => loggingDiagnostics.stats,
    getLogs: () => loggingDiagnostics.logs,
    help: () => { console.log('Logging diagnostics available'); }
  };
  console.log('📊 [API_LOGGING] Diagnostics system initialized');
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a unique guest identifier based on browser fingerprint
 * This creates a consistent identifier for guest users without external API calls
 * @returns {string} - Guest identifier (can be used as IP substitute for tracking)
 */
export const getGuestIdentifier = () => {
  try {
    // Create a browser fingerprint from available data
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      navigator.hardwareConcurrency || 'unknown'
    ].join('|');
    
    // Simple hash function to create a consistent ID
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const guestId = 'guest_' + Math.abs(hash).toString(16);
    console.log('✅ Guest identifier generated:', guestId);
    return guestId;
  } catch (error) {
    console.warn('⚠️ Could not generate guest identifier:', error);
    return 'guest_unknown';
  }
};

/**
 * Get client IP address from ipify API
 * Falls back to guest identifier if API fails
 * @returns {Promise<string>} - Client IP address or guest identifier
 */
export const getClientIp = async () => {
  try {
    console.log('🌐 Attempting to fetch client IP from ipify...');
    
    // Try to get IP from ipify API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Client IP fetched from ipify:', data.ip);
      return data.ip;
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch IP from ipify, using guest identifier instead:', error.message);
  }
  
  // Fallback to guest identifier
  return getGuestIdentifier();
};

/**
 * Log an API call to the database
 * Uses the api_usage_logs table schema
 * 
 * @param {Object} logData - The log data to save
 * @param {string} logData.user_id - User ID
 * @param {string} logData.endpoint - API endpoint (e.g., '/dalsiai/generate')
 * @param {string} logData.method - HTTP method (GET, POST, etc.)
 * @param {number} logData.status_code - HTTP status code
 * @param {number} logData.response_time_ms - Response time in milliseconds
 * @param {number} logData.tokens_used - Tokens consumed
 * @param {number} logData.cost_usd - Cost in USD
 * @param {string} logData.subscription_tier - User's subscription tier
 * @param {string} logData.api_key_id - API key ID used
 * @param {string} logData.ip_address - Client IP address
 * @param {string} logData.user_agent - User agent string
 * @param {string} logData.error_message - Error message if any
 * @param {number} logData.request_size_bytes - Request size in bytes
 * @param {number} logData.response_size_bytes - Response size in bytes
 * @param {Object} logData.request_metadata - Additional metadata (JSONB)
 * @param {number} logData.rate_limit_remaining - Rate limit remaining
 * @param {string} logData.rate_limit_reset - Rate limit reset time
 * @returns {Promise<Object>} - The inserted log record or error
 */
export const logApiCall = async (logData) => {
  try {
    // Record attempt in diagnostics
    loggingDiagnostics.recordAttempt(logData);

    // Validate required fields (endpoint and method are mandatory)
    if (!logData.endpoint || !logData.method) {
      console.warn('⚠️ Missing required fields for API logging:', {
        endpoint: logData.endpoint,
        method: logData.method
      });
      loggingDiagnostics.recordFailure({
        user_id: logData.user_id,
        endpoint: logData.endpoint,
        error: 'VALIDATION_ERROR',
        error_message: 'Missing required fields for API logging'
      });
      return null;
    }

    // Fetch API key for the user if not provided
    let apiKeyId = logData.api_key_id;
    if (!apiKeyId && logData.user_id) {
      const apiKey = await getUserApiKey(logData.user_id);
      if (apiKey) {
        apiKeyId = apiKey.id;
        console.log('✅ API key fetched for user:', apiKey.name);
      } else {
        console.warn('⚠️ No API key found for user:', logData.user_id.substring(0, 8) + '...');
      }
    }

    // Prepare the log record - using api_usage_logs table schema
    const record = {
      // The user_id should be a UUID (for logged-in or the Guest user) or null.
      // The check for 'guest_' is no longer needed here as the component now passes the UUID for the Guest user.
      user_id: logData.user_id || null,
      endpoint: logData.endpoint,
      method: logData.method,
      status_code: logData.status_code || 200,
      response_time_ms: logData.response_time_ms || 0,
      request_size_bytes: logData.request_size_bytes || 0,
      response_size_bytes: logData.response_size_bytes || 0,
      ip_address: logData.ip_address || null,
      api_key_id: apiKeyId || null,
      tokens_used: logData.tokens_used || 0,
      cost_usd: logData.cost_usd || 0,
      subscription_tier: logData.subscription_tier || 'free',
      error_message: logData.error_message || null,
      request_metadata: {
        ...logData.request_metadata
      },
      user_agent: logData.user_agent || navigator.userAgent,
      rate_limit_remaining: logData.rate_limit_remaining || null,
      rate_limit_reset: logData.rate_limit_reset || null,
    };

    console.log('📝 Logging API call:', {
      endpoint: logData.endpoint,
      user_id: logData.user_id,
      status_code: logData.status_code,
      tokens_used: logData.tokens_used,
      cost_usd: logData.cost_usd,
      ip_address: logData.ip_address
    });

    // Insert into database
    const { data, error } = await supabase
      .from('api_usage_logs')
      .insert([record]);

    if (error) {
      console.error('❌ Error logging API call:', error);
      loggingDiagnostics.recordFailure({
        user_id: logData.user_id,
        endpoint: logData.endpoint,
        error: 'DATABASE_ERROR',
        error_message: error.message || 'Failed to insert log into database'
      });
      return null;
    }

    console.log('✅ API call logged successfully');
    
    // Update API key usage statistics
    if (apiKeyId) {
      await updateApiKeyUsage(apiKeyId, {
        tokens_used: logData.tokens_used || 0,
        cost_usd: logData.cost_usd || 0,
        endpoint: logData.endpoint,
        ip_address: logData.ip_address
      });
    }
    
    // Record success in diagnostics
    loggingDiagnostics.recordSuccess({
      user_id: logData.user_id,
      endpoint: logData.endpoint,
      response_id: data?.[0]?.id
    });

    return data?.[0] || null;

  } catch (error) {
    console.error('❌ Unexpected error in API logging:', error);
    loggingDiagnostics.recordFailure({
      user_id: logData.user_id,
      endpoint: logData.endpoint,
      error: 'UNEXPECTED_ERROR',
      error_message: error.message || 'Unexpected error in API logging'
    });
    return null;
  }
};

/**
 * Log a chat API call with automatic metadata extraction
 * Supports both authenticated and guest users
 * 
 * @param {Object} chatData - Chat-specific data
 * @param {string} chatData.user_id - User ID (or guest user ID)
 * @param {string} chatData.endpoint - API endpoint
 * @param {string} chatData.method - HTTP method (default: POST)
 * @param {number} chatData.response_time_ms - Response time in ms
 * @param {number} chatData.status_code - HTTP status code
 * @param {number} chatData.tokens_used - Tokens consumed
 * @param {number} chatData.cost_usd - Cost in USD
 * @param {string} chatData.subscription_tier - Subscription tier
 * @param {string} chatData.api_key_id - API key ID
 * @param {string} chatData.error_message - Error message if any
 * @param {string} chatData.ip_address - Client IP address (optional)
 * @param {number} chatData.request_size_bytes - Request size in bytes
 * @param {number} chatData.response_size_bytes - Response size in bytes
 * @param {Object} chatData.metadata - Additional metadata
 * @returns {Promise<Object>} - The inserted log record
 */
export const logChatApiCall = async (chatData) => {
  // Get client IP if not provided
  let clientIp = chatData.ip_address;
  if (!clientIp) {
    clientIp = await getClientIp();
  }
  
  return logApiCall({
    user_id: chatData.user_id,
    endpoint: chatData.endpoint || '/dalsiai/generate',
    method: chatData.method || 'POST',
    status_code: chatData.status_code || 200,
    response_time_ms: chatData.response_time_ms || 0,
    tokens_used: chatData.tokens_used || 0,
    cost_usd: chatData.cost_usd || 0,
    subscription_tier: chatData.subscription_tier || 'free',
    api_key_id: chatData.api_key_id || null,
    error_message: chatData.error_message || null,
    ip_address: clientIp,
    user_agent: navigator.userAgent,
    request_size_bytes: chatData.request_size_bytes || 0,
    response_size_bytes: chatData.response_size_bytes || 0,
    request_metadata: {
      model: chatData.metadata?.model || 'dalsiai',
      message_length: chatData.metadata?.messageLength || 0,
      response_length: chatData.metadata?.responseLength || 0,
      session_id: chatData.metadata?.sessionId || null,
      is_guest: chatData.metadata?.isGuest || false,
      ...chatData.metadata
    },
    rate_limit_remaining: chatData.rate_limit_remaining || null,
    rate_limit_reset: chatData.rate_limit_reset || null
  });
};

/**
 * Log a guest API call
 * Uses the guest user ID and captures IP address
 * 
 * @param {Object} guestData - Guest call data
 * @param {string} guestData.user_id - Guest user UUID from the public.users table
 * @param {string} guestData.endpoint - API endpoint
 * @param {number} guestData.response_time_ms - Response time in ms
 * @param {number} guestData.status_code - HTTP status code
 * @param {number} guestData.tokens_used - Tokens consumed
 * @param {number} guestData.cost_usd - Cost in USD
 * @param {string} guestData.error_message - Error message if any
 * @param {string} guestData.ip_address - Client IP address (optional)
 * @param {number} guestData.request_size_bytes - Request size in bytes
 * @param {number} guestData.response_size_bytes - Response size in bytes
 * @param {Object} guestData.metadata - Additional metadata
 * @returns {Promise<Object>} - The inserted log record
 */
export const logGuestApiCall = async (guestData) => {
  // Get the guest user ID from the users table
  const guestUserId = await getGuestUserId();
  
  if (!guestUserId) {
    console.error('❌ Cannot log guest API call: Guest user not found in database');
    return null;
  }
  
  // Ensure IP address is present for tracking
  if (!guestData.ip_address) {
    console.warn('⚠️ IP address missing for guest API call, will use null');
  }

  return logChatApiCall({
    user_id: guestUserId, // Use the guest user UUID from users table
    endpoint: guestData.endpoint || '/dalsiai/generate',
    method: 'POST',
    status_code: guestData.status_code || 200,
    response_time_ms: guestData.response_time_ms || 0,
    tokens_used: guestData.tokens_used || 0,
    cost_usd: guestData.cost_usd || 0,
    subscription_tier: 'free',
    api_key_id: null,
    error_message: guestData.error_message || null,
    ip_address: guestData.ip_address, // Use IP as the distinguishing factor
    request_size_bytes: guestData.request_size_bytes || 0,
    response_size_bytes: guestData.response_size_bytes || 0,
    request_metadata: {
      isGuest: true,
      guest_session_id: guestData.guest_session_id || null, // Store session ID in metadata
      model: guestData.metadata?.model || 'dalsiai',
      messageLength: guestData.metadata?.messageLength || 0,
      responseLength: guestData.metadata?.responseLength || 0,
      sessionId: guestData.metadata?.sessionId || null,
      ...guestData.metadata
    },
    rate_limit_remaining: guestData.rate_limit_remaining || null,
    rate_limit_reset: guestData.rate_limit_reset || null
  });
};

/**
 * Get API usage statistics for a user
 * 
 * @param {string} user_id - User ID
 * @param {Object} options - Query options
 * @param {string} options.timeRange - 'day', 'week', 'month', 'all'
 * @param {string} options.endpoint - Filter by specific endpoint
 * @returns {Promise<Object>} - Usage statistics
 */
export const getUserApiStats = async (user_id, options = {}) => {
  try {
    let query = supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', user_id);

    // Apply time range filter
    if (options.timeRange && options.timeRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (options.timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    // Apply endpoint filter
    if (options.endpoint) {
      query = query.eq('endpoint', options.endpoint);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching API stats:', error);
      return null;
    }

    // Calculate statistics
    const stats = {
      total_calls: data?.length || 0,
      total_tokens: data?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0,
      total_cost: data?.reduce((sum, log) => sum + (log.cost_usd || 0), 0) || 0,
      average_response_time: data?.length > 0
        ? data.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / data.length
        : 0,
      endpoints: [...new Set(data?.map(log => log.endpoint) || [])],
      errors: data?.filter(log => log.error_message)?.length || 0,
      status_codes: {}
    };

    // Count status codes
    data?.forEach(log => {
      const code = log.status_code;
      stats.status_codes[code] = (stats.status_codes[code] || 0) + 1;
    });

    return stats;

  } catch (error) {
    console.error('❌ Unexpected error fetching API stats:', error);
    return null;
  }
};

/**
 * Get guest API usage statistics by IP address
 * 
 * @param {string} ip_address - Client IP address or guest identifier
 * @param {Object} options - Query options
 * @param {string} options.timeRange - 'day', 'week', 'month', 'all'
 * @returns {Promise<Object>} - Usage statistics for the IP
 */
/**
 * Get logging diagnostics
 * Returns current state of logging system for debugging
 */
export const getLoggingDiagnostics = () => {
  return loggingDiagnostics.getDiagnostics();
};

/**
 * Run health check on logging system
 */
export const checkLoggingHealth = () => {
  return loggingDiagnostics.healthCheck();
};

export const getGuestApiStatsByIp = async (ip_address, options = {}) => {
  try {
    let query = supabase
      .from('api_usage_logs')
      .select('*')
      .eq('ip_address', ip_address);

    // Apply time range filter
    if (options.timeRange && options.timeRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (options.timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching guest API stats:', error);
      return null;
    }

    // Calculate statistics
    const stats = {
      ip_address: ip_address,
      total_calls: data?.length || 0,
      total_tokens: data?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0,
      total_cost: data?.reduce((sum, log) => sum + (log.cost_usd || 0), 0) || 0,
      average_response_time: data?.length > 0
        ? data.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / data.length
        : 0,
      endpoints: [...new Set(data?.map(log => log.endpoint) || [])],
      errors: data?.filter(log => log.error_message)?.length || 0,
      first_seen: data?.[data.length - 1]?.created_at,
      last_seen: data?.[0]?.created_at,
      status_codes: {}
    };

    // Count status codes
    data?.forEach(log => {
      const code = log.status_code;
      stats.status_codes[code] = (stats.status_codes[code] || 0) + 1;
    });

    return stats;

  } catch (error) {
    console.error('❌ Unexpected error fetching guest API stats:', error);
    return null;
  }
};
