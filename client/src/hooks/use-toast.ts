'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Simple toast state management
let toastListeners: ((toast: Toast | null) => void)[] = [];
let currentToast: Toast | null = null;

const notifyListeners = (toast: Toast | null) => {
  currentToast = toast;
  toastListeners.forEach((listener) => listener(toast));
};

export function subscribeToToasts(listener: (toast: Toast | null) => void) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter((l) => l !== listener);
  };
}

export function useToast() {
  const [, setUpdate] = useState(0);

  // Subscribe to toast updates
  useEffect(() => {
    const unsubscribe = subscribeToToasts(() => {
      setUpdate((u) => u + 1);
    });
    return unsubscribe;
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const newToast: Toast = {
      id: Math.random().toString(36).substring(7),
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
    };

    notifyListeners(newToast);

    // Auto-dismiss after duration
    setTimeout(() => {
      if (currentToast?.id === newToast.id) {
        notifyListeners(null);
      }
    }, options.duration || 5000);

    return newToast;
  }, []);

  const dismiss = useCallback(() => {
    notifyListeners(null);
  }, []);

  return {
    toast,
    dismiss,
    currentToast,
  };
}
