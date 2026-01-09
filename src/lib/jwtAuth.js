/**
 * JWT Authentication Service
 * Integrates with NeoDalsi API for JWT-based authentication
 * 
 * API Base URL: https://api.neodalsi.com
 * Endpoints:
 * - POST /api/auth/login - Login and get JWT token
 * - POST /api/auth/verify - Verify JWT token
 * - POST /api/auth/refresh - Refresh JWT token
 * - POST /api/auth/gmail/signup - Initiate Gmail OAuth for signup
 * - POST /api/auth/gmail/login - Initiate Gmail OAuth for login
 * - POST /api/auth/gmail/callback - Handle Gmail OAuth callback
 */

import logger from './logger'

const API_BASE_URL = 'https://api.neodalsi.com';

/**
 * Login user and get JWT token
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - { success, token, user }
 */
export const loginWithJWT = async (email, password) => {
  try {
    console.log('🔐 Logging in with JWT...');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    // Store debug info to localStorage
    localStorage.setItem('DEBUG_API_RESPONSE', JSON.stringify({
      timestamp: new Date().toISOString(),
      fullResponse: data,
      userObject: data.user,
      hasFirstName: !!data.user?.first_name,
      firstNameValue: data.user?.first_name
    }));
    
    console.log('📥 [JWT_AUTH] Full API response:', data);
    console.log('📥 [JWT_AUTH] User object from API:', data.user);
    console.log('📥 [JWT_AUTH] Has first_name:', !!data.user?.first_name);
    console.log('📥 [JWT_AUTH] First name value:', data.user?.first_name);

    if (!response.ok) {
      console.error('❌ Login failed:', data);
      throw new Error(data.error || 'Login failed');
    }

    if (!data.success || !data.token) {
      throw new Error('Invalid response from server');
    }

    console.log('✅ Login successful');
    
    console.log('💾 [JWT_AUTH] Storing user_info:', JSON.stringify(data.user));
    // Store JWT token in localStorage
    localStorage.setItem('jwt_token', data.token);
    console.log('✅ [JWT_AUTH] Verified stored:', localStorage.getItem('user_info'));
    localStorage.setItem('user_info', JSON.stringify(data.user));

    return {
      success: true,
      token: data.token,
      user: data.user
    };

  } catch (error) {
    console.error('❌ JWT login error:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 * 
 * @param {string} token - JWT token to verify (optional, uses stored token if not provided)
 * @returns {Promise<Object>} - { valid, user }
 */
export const verifyJWT = async (token = null) => {
  try {
    const jwtToken = token || localStorage.getItem('jwt_token');
    
    if (!jwtToken) {
      console.warn('⚠️ No JWT token found');
      return { valid: false, user: null };
    }

    console.log('🔍 Verifying JWT token...');

    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Token verification failed:', data);
      return { valid: false, user: null };
    }

    if (!data.valid) {
      console.warn('⚠️ Token is invalid');
      return { valid: false, user: null };
    }

    console.log('✅ Token is valid');
    return {
      valid: true,
      user: data.user || null
    };

  } catch (error) {
    console.error('❌ JWT verification error:', error);
    return { valid: false, user: null };
  }
};

/**
 * Refresh JWT token
 * 
 * @returns {Promise<Object>} - { success, token }
 */
export const refreshJWT = async () => {
  try {
    const currentToken = localStorage.getItem('jwt_token');
    
    if (!currentToken) {
      console.warn('⚠️ No JWT token to refresh');
      return { success: false, error: 'No token found' };
    }

    console.log('🔄 Refreshing JWT token...');

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Token refresh failed:', data);
      
      // If refresh fails, clear the token
      if (response.status === 401) {
        clearJWT();
      }
      
      throw new Error(data.error || 'Token refresh failed');
    }

    if (!data.success || !data.token) {
      throw new Error('Invalid response from server');
    }

    console.log('✅ Token refreshed successfully');
    
    // Store new token
    localStorage.setItem('jwt_token', data.token);

    return {
      success: true,
      token: data.token
    };

  } catch (error) {
    console.error('❌ JWT refresh error:', error);
    throw error;
  }
};

/**
 * Get current JWT token
 * 
 * @returns {string|null} - JWT token or null
 */
export const getJWT = () => {
  return localStorage.getItem('jwt_token');
};

/**
 * Get current user info from localStorage
 * 
 * @returns {Object|null} - User object or null
 */
export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('user_info');
  if (!userInfo) return null;
  
  try {
    return JSON.parse(userInfo);
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
};

/**
 * Clear JWT token and user info (logout)
 */
export const clearJWT = () => {
  console.log('🗑️ Clearing JWT token and user info');
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_info');
};

/**
 * Check if user is authenticated (has valid JWT)
 * 
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('jwt_token');
};

/**
 * Logout user
 * Clears JWT token and user info
 */
export const logoutJWT = () => {
  console.log('👋 Logging out...');
  clearJWT();
  
  // Also clear old session-based auth if it exists
  localStorage.removeItem('session_token');
  localStorage.removeItem('user_id');
};

/**
 * Auto-refresh token before expiration
 * JWT tokens expire after 24 hours
 * This function should be called periodically (e.g., every 23 hours)
 * 
 * @returns {Promise<boolean>} - Success status
 */
export const autoRefreshToken = async () => {
  try {
    const token = getJWT();
    if (!token) return false;

    // Verify token first
    const verification = await verifyJWT(token);
    
    if (!verification.valid) {
      console.log('Token is invalid, cannot refresh');
      return false;
    }

    // Refresh token
    await refreshJWT();
    return true;

  } catch (error) {
    console.error('Auto-refresh failed:', error);
    return false;
  }
};

/**
 * Setup automatic token refresh
 * Refreshes token every 23 hours (before 24-hour expiration)
 * 
 * @returns {number} - Interval ID (can be used to clear interval)
 */
export const setupAutoRefresh = () => {
  // Refresh every 23 hours (82800000 ms)
  const REFRESH_INTERVAL = 23 * 60 * 60 * 1000;
  
  console.log('⏰ Setting up automatic token refresh (every 23 hours)');
  
  const intervalId = setInterval(async () => {
    console.log('⏰ Auto-refresh triggered');
    await autoRefreshToken();
  }, REFRESH_INTERVAL);

  return intervalId;
};

/**
 * Make authenticated API request with JWT
 * Automatically includes Authorization header
 * Handles token expiration and refresh
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getJWT();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      console.log('🔄 Token expired, attempting refresh...');
      
      try {
        await refreshJWT();
        
        // Retry request with new token
        const newToken = getJWT();
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          }
        });

        return retryResponse;

      } catch (refreshError) {
        console.error('Token refresh failed, logging out');
        logoutJWT();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;

  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
};

/**
 * Sign up with Gmail (OAuth)
 * Initiates Gmail OAuth flow for new user signup
 * 
 * @returns {Promise<Object>} - { success, redirecting: true }
 */
export const signupWithGmail = async () => {
  try {
    console.log('🔐 [GMAIL_AUTH] Initiating Gmail signup...');
    
    // Get redirect URI from current domain
    const redirectUri = `${window.location.origin}/auth/gmail/callback`;
    console.log('📍 Redirect URI:', redirectUri);
    
    // Call Gmail signup endpoint
    const response = await fetch(`${API_BASE_URL}/api/auth/gmail/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Gmail signup failed:', data);
      throw new Error(data.error || 'Gmail signup failed');
    }

    if (!data.success || !data.auth_url) {
      console.error('❌ Invalid response format:', data);
      throw new Error('Invalid response from server');
    }

    console.log('✅ Gmail signup URL generated');
    console.log('🔄 Redirecting to Google OAuth...');
    
    // Redirect to Gmail OAuth consent screen
    window.location.href = data.auth_url;

    return {
      success: true,
      redirecting: true
    };

  } catch (error) {
    console.error('❌ Gmail signup error:', error);
    throw error;
  }
};

/**
 * Login with Gmail (OAuth)
 * Initiates Gmail OAuth flow for existing user login
 * 
 * @returns {Promise<Object>} - { success, redirecting: true }
 */
export const loginWithGmail = async () => {
  try {
    console.log('🔐 [GMAIL_AUTH] Initiating Gmail login...');
    
    // Get redirect URI from current domain
    const redirectUri = `${window.location.origin}/auth/gmail/callback`;
    console.log('📍 Redirect URI:', redirectUri);
    
    // Call Gmail login endpoint
    const response = await fetch(`${API_BASE_URL}/api/auth/gmail/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect_uri: redirectUri
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Gmail login failed:', data);
      throw new Error(data.error || 'Gmail login failed');
    }

    if (!data.success || !data.auth_url) {
      console.error('❌ Invalid response format:', data);
      throw new Error('Invalid response from server');
    }

    console.log('✅ Gmail login URL generated');
    console.log('🔄 Redirecting to Google OAuth...');
    
    // Redirect to Gmail OAuth consent screen
    window.location.href = data.auth_url;

    return {
      success: true,
      redirecting: true
    };

  } catch (error) {
    console.error('❌ Gmail login error:', error);
    throw error;
  }
};

/**
 * Handle Gmail OAuth callback
 * Called after user authorizes Gmail access
 * Exchanges authorization code for JWT token and user data
 * 
 * @param {string} code - Authorization code from Google
 * @param {string} state - State parameter for CSRF protection
 * @returns {Promise<Object>} - { success, token, user }
 */
export const handleGmailCallback = async (code, state) => {
  try {
    console.log('🔐 [GMAIL_AUTH] Handling Gmail callback...');
    console.log('📝 Code:', code ? 'present' : 'missing');
    console.log('📝 State:', state ? 'present' : 'missing');
    
    // Validate parameters
    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    // Get guest_session_id from localStorage for migration
    const guestUserId = localStorage.getItem('guest_session_id');
    console.log('📝 Guest Session ID:', guestUserId ? 'present' : 'not present');

    // Exchange authorization code for JWT token
    console.log('🔄 Exchanging code for JWT token...');
    const response = await fetch(`${API_BASE_URL}/api/auth/gmail/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
        guest_user_id: guestUserId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Gmail callback failed:', data);
      throw new Error(data.error || 'Gmail authentication failed');
    }

    if (!data.success || !data.token || !data.user) {
      console.error('❌ Invalid response format:', data);
      throw new Error('Invalid response from server');
    }

    console.log('✅ Gmail authentication successful');
    console.log('📦 User data:', data.user);
    console.log('🎁 Subscription tier:', data.user.subscription_tier);

    // Store JWT token and user info
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user_info', JSON.stringify(data.user));

    return {
      success: true,
      token: data.token,
      user: data.user
    };

  } catch (error) {
    console.error('❌ Gmail callback error:', error);
    throw error;
  }
};
