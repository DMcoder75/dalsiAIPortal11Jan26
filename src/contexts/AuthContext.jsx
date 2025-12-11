import { createContext, useContext, useState, useEffect } from 'react'
import { 
  verifyJWT, 
  logoutJWT, 
  getCurrentUser, 
  isAuthenticated,
  setupAutoRefresh 
} from '../lib/jwtAuth'
import { setSupabaseJWT, clearSupabaseJWT } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guestSessionId, setGuestSessionId] = useState(null)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null)
  const [authError, setAuthError] = useState(null)

  // Check for existing JWT session on mount
  useEffect(() => {
    console.log('🔍 [AUTH_CONTEXT] Initializing auth context on mount');
    
    // Skip JWT check on callback pages - let the callback page handle auth
    // On other pages, restore user from localStorage
    const isCallbackPage = window.location.pathname.includes('/auth/') && 
                          (window.location.pathname.includes('/callback') ||
                           window.location.pathname.includes('/verify'));
    
    if (!isCallbackPage) {
      console.log('🔍 Checking JWT session on non-callback page');
      checkJWTSession();
    } else {
      console.log('⏭️ Skipping JWT check on callback page - callback will handle auth');
      setLoading(false);
    }
    
    initGuestSession();
  }, [])

  // Setup automatic token refresh when user is authenticated
  useEffect(() => {
    if (user && !autoRefreshInterval) {
      console.log('⏰ Setting up automatic JWT token refresh');
      const intervalId = setupAutoRefresh();
      setAutoRefreshInterval(intervalId);
    }

    // Cleanup on unmount or logout
    return () => {
      if (autoRefreshInterval) {
        console.log('🛑 Clearing automatic token refresh');
        clearInterval(autoRefreshInterval);
      }
    };
  }, [user]);

  const initGuestSession = () => {
    // Generate or retrieve guest session ID
    let sessionId = localStorage.getItem('guest_session_id')
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      localStorage.setItem('guest_session_id', sessionId)
    }
    setGuestSessionId(sessionId)
  }

  const checkJWTSession = async () => {
    try {
      console.log('🔍 Checking JWT session...');
      setAuthError(null);
      
      // Check if user has JWT token
      if (!isAuthenticated()) {
        console.log('📌 No JWT token found, user is guest');
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify JWT token validity (lightweight check)
      console.log('🔐 Verifying JWT token with auth service...');
      const verification = await verifyJWT();
      
      if (verification.valid) {
        console.log('✅ JWT token is valid');
        // Token is valid, use the stored user data from login
        const storedUserInfo = localStorage.getItem('user_info');
        console.log('📦 Raw stored user_info:', storedUserInfo);
        if (storedUserInfo) {
          try {
            const userData = JSON.parse(storedUserInfo);
            console.log('✅ Using stored user data from login:', userData);
            console.log('🔍 User first_name:', userData.first_name);
            console.log('🔍 User email:', userData.email);
            
            // Set JWT token in Supabase client for authenticated requests
            const token = localStorage.getItem('jwt_token');
            if (token) {
              setSupabaseJWT(token);
            }
            
            setUser(userData);
            setAuthError(null);
          } catch (e) {
            console.error('❌ Error parsing stored user info:', e);
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_info');
            setUser(null);
            setAuthError('Session error. Please login again.');
          }
        } else {
          console.warn('⚠️ Token valid but no stored user data');
          localStorage.removeItem('jwt_token');
          setUser(null);
          setAuthError('Session error. Please login again.');
        }
      } else {
        console.log('❌ JWT token is invalid or expired - clearing session');
        // Token is invalid, clear everything
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
        setUser(null);
        setAuthError('Session expired. Please login again.');
      }
    } catch (error) {
      // Handle JWT verification errors
      console.error('❌ JWT session check failed:', error.message);
      
      // Check if this is a network error
      const isNetworkError = error.message && (
        error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('CORS') ||
        error.message.includes('Failed to fetch')
      );
      
      if (isNetworkError) {
        console.warn('🌐 Network error - Auth service is unavailable');
        console.log('🔄 Keeping user logged in using localStorage data (network error)');
        
        // On network error, try to restore user from localStorage
        const storedUserInfo = localStorage.getItem('user_info');
        const storedToken = localStorage.getItem('jwt_token');
        
        if (storedUserInfo && storedToken) {
          try {
            const userData = JSON.parse(storedUserInfo);
            console.log('✅ Restored user from localStorage despite network error:', userData.email);
            setUser(userData);
            setAuthError(null); // Don't show error if we have cached data
          } catch (e) {
            console.error('❌ Error parsing stored user info:', e);
            setUser(null);
            setAuthError('Session error. Please login again.');
          }
        } else {
          console.log('⚠️ No cached user data available');
          setUser(null);
          setAuthError('Auth service unavailable. Please check your connection.');
        }
      } else {
        console.error('🔴 Auth service error - clearing session');
        // Clear invalid token only on actual auth errors (not network errors)
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
        setUser(null);
        setAuthError('Authentication service error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const login = (userData) => {
    console.log('✅ User logged in:', userData.email);
    console.log('📦 Storing user data to localStorage:', userData);
    // Store complete user data to localStorage
    localStorage.setItem('user_info', JSON.stringify(userData));
    
    // Get the JWT token and set it in Supabase client
    const token = localStorage.getItem('jwt_token');
    if (token) {
      setSupabaseJWT(token);
    }
    
    setUser(userData);
    setAuthError(null);
  }

  const logout = async () => {
    try {
      console.log('👋 Logging out user...');
      
      // Clear auto-refresh interval
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
      
      // Clear JWT token and user info
      logoutJWT();
      clearSupabaseJWT();
      setUser(null);
      setAuthError(null);
      
      console.log('✅ Logout successful');
      
      // Reload page to ensure clean state
      console.log('🔄 Reloading page after logout...');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  const clearGuestSession = () => {
    localStorage.removeItem('guest_session_id')
    localStorage.removeItem('guest_messages')
    localStorage.removeItem('dalsi_guest_messages')
    setGuestSessionId(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    checkSession: checkJWTSession,
    guestSessionId,
    clearGuestSession,
    isAuthenticated: !!user,
    authError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
