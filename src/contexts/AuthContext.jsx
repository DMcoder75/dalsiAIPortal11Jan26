import { createContext, useContext, useState, useEffect } from 'react'
import { 
  verifyJWT, 
  logoutJWT, 
  getCurrentUser, 
  isAuthenticated,
  setupAutoRefresh 
} from '../lib/jwtAuth'

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

  // Check for existing JWT session on mount
  useEffect(() => {
    checkJWTSession()
    initGuestSession()
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
      
      // Check if user has JWT token
      if (!isAuthenticated()) {
        console.log('📌 No JWT token found, checking for session_token fallback...');
        
        // Fallback: Check for session_token (database login)
        const sessionToken = localStorage.getItem('session_token');
        const userId = localStorage.getItem('user_id');
        const userInfo = localStorage.getItem('user_info');
        
        if (sessionToken && userId && userInfo) {
          console.log('✅ Found session_token, restoring user session');
          try {
            const user = JSON.parse(userInfo);
            setUser(user);
            setLoading(false);
            return;
          } catch (e) {
            console.error('❌ Error parsing user_info:', e);
          }
        }
        
        console.log('📌 No active session, user will start as guest');
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify JWT token
      console.log('🔐 Verifying JWT token...');
      const verification = await verifyJWT();
      
      if (verification.valid && verification.user) {
        console.log('✅ JWT session valid, user authenticated');
        setUser(verification.user);
      } else {
        console.log('⚠️ JWT token expired or invalid, clearing session');
        // Clear invalid token
        localStorage.removeItem('jwt_token');
        setUser(null);
      }
    } catch (error) {
      // Handle JWT verification errors gracefully
      console.warn('⚠️ JWT session check failed:', error.message);
      
      // If network error, don't clear token - might be temporary
      if (error.message && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('CORS'))) {
        console.log('📌 Network issue during JWT check, will retry on next action');
      } else {
        // Clear invalid token for other errors
        console.log('🧹 Clearing invalid JWT token');
        localStorage.removeItem('jwt_token');
      }
      
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const login = (userData) => {
    console.log('✅ User logged in:', userData.email);
    setUser(userData);
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
      setUser(null);
      
      console.log('✅ Logout successful');
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
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
