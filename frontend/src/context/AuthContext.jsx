'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/api-client';

const AuthContext = createContext({
  user: null,
  admin: null,
  role: 'guest',
  loading: true,
  loginGoogleUser: async () => {},
  loginAdminUser: async () => {},
  logoutUser: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [role, setRole] = useState('guest');
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/auth/me');
      if (res.data && res.data.status === 'success') {
        setRole(res.data.role || 'guest');
        if (res.data.role === 'user') {
          setUser(res.data.account);
          setAdmin(null);
        } else if (res.data.role === 'admin') {
          setAdmin(res.data.account);
          setUser(null);
        } else {
          setUser(null);
          setAdmin(null);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Session fetch error:', err);
      setRole('guest');
      setUser(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const loginGoogleUser = async (googlePayload) => {
    const res = await apiClient.post('/auth/google', googlePayload);
    if (res.data && res.data.status === 'success') {
      setUser(res.data.user);
      setRole('user');
    }
    return res.data;
  };

  const loginAdminUser = async (credentials) => {
    const res = await apiClient.post('/auth/admin/login', credentials);
    if (res.data && res.data.status === 'success') {
      setAdmin(res.data.admin);
      setRole('admin');
    }
    return res.data;
  };

  const logoutUser = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setUser(null);
      setAdmin(null);
      setRole('guest');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        role,
        loading,
        loginGoogleUser,
        loginAdminUser,
        logoutUser,
        refreshAuth: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
