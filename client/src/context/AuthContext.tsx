'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { User, LoginCredentials, RegisterData, ManagerSetupData, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  managerSetup: (data: ManagerSetupData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if token exists in localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Add timestamp to bypass cache
      const response = await api.get(`/auth/me?_t=${Date.now()}`);
      if (response.data.success && response.data.data?.user) {
        setUser(response.data.data.user);
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (_error) {
      // Token invalid or expired, clear it
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success && response.data.data?.user) {
        // Store token in localStorage
        if (response.data.data.token) {
          localStorage.setItem('token', response.data.data.token);
        }
        setUser(response.data.data.user);
        return { success: true, message: response.data.message, user: response.data.data.user };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  // Register function (for residents)
  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', data);
      if (response.data.success) {
        // Don't auto-login, redirect to login page
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  // Manager setup function (first user)
  const managerSetup = async (data: ManagerSetupData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/manager-setup', data);
      if (response.data.success && response.data.data?.user) {
        // Store token in localStorage
        if (response.data.data.token) {
          localStorage.setItem('token', response.data.data.token);
        }
        setUser(response.data.data.user);
        return { success: true, message: response.data.message, user: response.data.data.user };
      }
      return { success: false, message: response.data.message || 'Setup failed' };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Manager setup failed. Please try again.';
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    managerSetup,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
