/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';

export interface ComplaintUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  flat_no: string;
}

export interface Complaint {
  _id: string;
  user_id: ComplaintUser;
  flat_no: string;
  description: string;
  image_url: string | null;
  status: 'open' | 'in-progress' | 'resolved';
  admin_notes: string | null;
  resolved_by: ComplaintUser | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintsResponse {
  success: boolean;
  data: Complaint[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface AdminComplaintsResponse extends ComplaintsResponse {
  stats: {
    open: number;
    'in-progress': number;
    resolved: number;
  };
}

export interface UploadUrlResponse {
  success: boolean;
  data: {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
    urlEndpoint: string;
  };
}

export function useComplaints() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's complaints
  const getMyComplaints = useCallback(async (
    page = 1,
    limit = 10,
    status?: string
  ): Promise<ComplaintsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.append('status', status);
      
      const response = await api.get(`/complaints?${params}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch complaints';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all complaints (admin only)
  const getAllComplaints = useCallback(async (
    page = 1,
    limit = 10,
    status?: string
  ): Promise<AdminComplaintsResponse> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.append('status', status);
      
      const response = await api.get(`/complaints/all?${params}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch complaints';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get complaint by ID
  const getComplaintById = useCallback(async (id: string): Promise<{ success: boolean; data: Complaint }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/complaints/${id}`);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch complaint';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new complaint
  const createComplaint = useCallback(async (
    description: string,
    imageUrl?: string
  ): Promise<{ success: boolean; data: Complaint; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const payload: { description: string; image_url?: string } = { description };
      if (imageUrl) payload.image_url = imageUrl;
      
      const response = await api.post('/complaints', payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create complaint';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update complaint status (admin only)
  const updateComplaintStatus = useCallback(async (
    id: string,
    status: 'open' | 'in-progress' | 'resolved',
    adminNotes?: string
  ): Promise<{ success: boolean; data: Complaint; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const payload: { status: string; admin_notes?: string } = { status };
      if (adminNotes) payload.admin_notes = adminNotes;
      
      const response = await api.put(`/complaints/${id}/status`, payload);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update complaint status';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get upload URL for ImageKit
  const getUploadUrl = useCallback(async (): Promise<UploadUrlResponse> => {
    setError(null);
    try {
      const response = await api.post('/complaints/upload-url');
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to get upload URL';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // Upload image to ImageKit
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    try {
      // Get authentication parameters
      const { data: authParams } = await getUploadUrl();
      
      // Create form data for ImageKit upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('publicKey', authParams.publicKey);
      formData.append('signature', authParams.signature);
      formData.append('expire', String(authParams.expire));
      formData.append('token', authParams.token);
      formData.append('fileName', `complaint_${Date.now()}_${file.name}`);
      formData.append('folder', '/complaints');
      
      // Upload to ImageKit
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      
      const data = await response.json();
      return data.url;
    } catch (err: any) {
      const message = err.message || 'Failed to upload image';
      setError(message);
      throw new Error(message);
    }
  }, [getUploadUrl]);

  return {
    loading,
    error,
    getMyComplaints,
    getAllComplaints,
    getComplaintById,
    createComplaint,
    updateComplaintStatus,
    getUploadUrl,
    uploadImage,
  };
}
