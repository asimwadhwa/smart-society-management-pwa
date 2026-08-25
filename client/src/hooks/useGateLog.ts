/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface GateLogEntry {
  _id: string;
  visitor_name: string;
  flat_no_visiting: string;
  purpose: string;
  vehicle_number: string | null;
  in_time: string;
  out_time: string | null;
  logged_by: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TodayEntriesResponse {
  success: boolean;
  data: GateLogEntry[];
  stats: {
    total: number;
    inside: number;
    exited: number;
  };
}

export interface GateLogHistoryResponse {
  success: boolean;
  data: GateLogEntry[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export function useGateLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create gate log entry
  const createEntry = useCallback(async (
    visitorName: string,
    flatNoVisiting: string,
    purpose: string,
    vehicleNumber?: string
  ): Promise<{ success: boolean; data: GateLogEntry; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const payload: {
        visitor_name: string;
        flat_no_visiting: string;
        purpose: string;
        vehicle_number?: string;
      } = {
        visitor_name: visitorName,
        flat_no_visiting: flatNoVisiting,
        purpose: purpose
      };
      
      if (vehicleNumber) payload.vehicle_number = vehicleNumber;
      
      const response = await api.post('/gatelog', payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create entry';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get today's entries
  const getTodayEntries = useCallback(async (): Promise<TodayEntriesResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/gatelog/today');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch entries';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark visitor out
  const markOutTime = useCallback(async (
    entryId: string
  ): Promise<{ success: boolean; data: GateLogEntry; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/gatelog/${entryId}/out`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to mark out time';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get history (for admin view)
  const getHistory = useCallback(async (
    page = 1,
    limit = 20,
    date?: string,
    flatNo?: string
  ): Promise<GateLogHistoryResponse> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (date) params.append('date', date);
      if (flatNo) params.append('flat_no', flatNo);
      
      const response = await api.get(`/gatelog/history?${params}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch history';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createEntry,
    getTodayEntries,
    markOutTime,
    getHistory
  };
}
