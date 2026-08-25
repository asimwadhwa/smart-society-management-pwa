'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

export interface EmergencyUser {
  _id: string;
  name: string;
  email: string;
  flat_no: string;
  phone?: string;
}

export interface Emergency {
  _id: string;
  triggered_by: EmergencyUser;
  flat_no: string;
  status: 'active' | 'resolved';
  triggered_at: string;
  resolved_by?: EmergencyUser;
  resolved_at?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyHistory {
  data: Emergency[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export function useEmergency() {
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for active emergency
  const checkActiveEmergency = useCallback(async () => {
    try {
      const response = await api.get('/emergency/active');
      setActiveEmergency(response.data.data || null);
      setError(null);
    } catch (err: unknown) {
      console.error('Error checking emergency:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to check emergency status');
      setActiveEmergency(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger a new emergency
  const triggerEmergency = useCallback(async (notes?: string) => {
    setTriggerLoading(true);
    setError(null);
    try {
      const response = await api.post('/emergency/trigger', { notes });
      setActiveEmergency(response.data.data);
      return response.data;
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to trigger emergency';
      setError(message);
      throw new Error(message);
    } finally {
      setTriggerLoading(false);
    }
  }, []);

  // Resolve an emergency
  const resolveEmergency = useCallback(async (id: string, notes?: string) => {
    setResolveLoading(true);
    setError(null);
    try {
      const response = await api.put(`/emergency/${id}/resolve`, { notes });
      setActiveEmergency(null);
      return response.data;
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to resolve emergency';
      setError(message);
      throw new Error(message);
    } finally {
      setResolveLoading(false);
    }
  }, []);

  // Get emergency history
  const getEmergencyHistory = useCallback(async (page = 1, limit = 10): Promise<EmergencyHistory> => {
    try {
      const response = await api.get(`/emergency/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (err: unknown) {
      console.error('Error fetching emergency history:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch history');
    }
  }, []);

  // Initial check and polling
  useEffect(() => {
    checkActiveEmergency();
    
    // Poll every 30 seconds
    const interval = setInterval(checkActiveEmergency, 30000);
    
    return () => clearInterval(interval);
  }, [checkActiveEmergency]);

  return {
    activeEmergency,
    loading,
    triggerLoading,
    resolveLoading,
    error,
    triggerEmergency,
    resolveEmergency,
    getEmergencyHistory,
    refresh: checkActiveEmergency,
  };
}
