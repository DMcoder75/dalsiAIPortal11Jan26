/**
 * Admin Authentication Context
 * Handles admin user authentication using custom a_users table
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      setLoading(true);
      
      // Check if admin session exists in localStorage
      const sessionData = localStorage.getItem('admin_session');
      
      if (!sessionData) {
        setAdminUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const session = JSON.parse(sessionData);
      
      // Verify session is still valid
      const { data, error } = await supabase.rpc('verify_admin_session', {
        p_user_id: session.user_id
      });

      if (error || !data || data.length === 0 || !data[0].is_valid) {
        console.error('Session verification failed:', error);
        localStorage.removeItem('admin_session');
        setAdminUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const userData = data[0];
      
      setAdminUser({
        id: session.user_id,
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role
      });
      setIsAdmin(true);
      setLoading(false);

      console.log('Admin session verified:', userData.username);

    } catch (error) {
      console.error('Error checking admin session:', error);
      localStorage.removeItem('admin_session');
      setAdminUser(null);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const adminLogin = async (username, password) => {
    try {
      console.log('Attempting admin login for:', username);

      // Call admin_login RPC function
      const { data, error } = await supabase.rpc('admin_login', {
        p_username: username,
        p_password: password
      });

      if (error) {
        console.error('Login RPC error:', error);
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error('Invalid response from login function');
      }

      const result = data[0];

      if (!result.success) {
        throw new Error(result.message || 'Login failed');
      }

      // Store session in localStorage
      const sessionData = {
        user_id: result.user_id,
        username: result.username,
        full_name: result.full_name,
        email: result.email,
        role: result.role,
        login_time: new Date().toISOString()
      };

      localStorage.setItem('admin_session', JSON.stringify(sessionData));

      setAdminUser({
        id: result.user_id,
        username: result.username,
        full_name: result.full_name,
        email: result.email,
        role: result.role
      });
      setIsAdmin(true);

      console.log('Admin login successful:', result.username);
      return { success: true, user: sessionData };

    } catch (error) {
      console.error('Admin login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const adminLogout = async () => {
    try {
      localStorage.removeItem('admin_session');
      setAdminUser(null);
      setIsAdmin(false);
      console.log('Admin logout successful');
    } catch (error) {
      console.error('Admin logout error:', error);
    }
  };

  const value = {
    adminUser,
    isAdmin,
    loading,
    adminLogin,
    adminLogout,
    checkAdminSession
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
