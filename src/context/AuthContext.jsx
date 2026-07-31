import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  updateProfile,
  getUserById
} from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount (instant 0ms render from localStorage cache)
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = localStorage.getItem('corn_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setLoading(false);
          // Verify & refresh user in background
          const fresh = await getUserById(parsed.id);
          if (fresh && fresh.status === 'ACTIVE') {
            setUser(fresh);
            localStorage.setItem('corn_current_user', JSON.stringify(fresh));
          } else if (fresh === null) {
            // User was deleted
            setUser(null);
            localStorage.removeItem('corn_current_user');
          }
        } else {
          setLoading(false);
        }
      } catch {
        localStorage.removeItem('corn_current_user');
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const result = await loginUser(emailOrUsername, password);
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('corn_current_user', JSON.stringify(result.user));
      }
      return result;
    } catch {
      return { success: false, message: 'Server connection error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('corn_current_user');
  };

  const register = async (data) => {
    return registerUser(data);
  };

  const updateUser = async (updates) => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      const result = await updateProfile(user.id, updates);
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('corn_current_user', JSON.stringify(result.user));
      }
      return result;
    } catch {
      return { success: false, message: 'Failed to update profile' };
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      logout,
      register,
      updateUser,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
