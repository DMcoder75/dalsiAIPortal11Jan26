/**
 * JWT Authentication Service
 * Integrates with NeoDalsi API for JWT-based authentication
 * 
 * API Base URL: https://api.neodalsi.com
 * Endpoints:
 * - POST /api/auth/login - Login and get JWT token
 * - POST /api/auth/verify - Verify JWT token
 * - POST /api/auth/refresh - Refresh JWT token
 */

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

    if (!response.ok) {
      console.error('❌ Login failed:', data);
      throw new Error(data.error || 'Login failed');
    }

    if (!data.success || !data.token) {
      throw new Error('Invalid response from server');
    }

    console.log('✅ Login successful');
    
    // Store JWT token in localStorage
    localStorage.setItem('jwt_token', data.token);
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
      
      // If token is expired or invalid, clear it
      if (response.status === 401) {
        clearJWT();
      }
      
      return { valid: false, user: null, error: data.error };
    }

    if (!data.valid) {
      console.warn('⚠️ Token is not valid');
      clearJWT();
      return { valid: false, user: null };
    }

    console.log('✅ Token verified successfully');
    
    // Update stored user info
    if (data.user) {
      localStorage.setItem('user_info', JSON.stringify(data.user));
    }

    return {
      valid: true,
      user: data.user
    };

  } catch (error) {
    console.error('❌ JWT verification error:', error);
    return { valid: false, user: null, error: error.message };
  }
};

/**
 * Refresh JWT token
 * Gets a new token with extended expiration
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
