'use client';

import { useEffect, useState } from 'react';
import { Toast, subscribeToToasts } from '@/hooks/use-toast';

interface ToasterProps {
  className?: string;
}

export function Toaster({ className }: ToasterProps) {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToToasts(setToast);
    return unsubscribe;
  }, []);

  if (!toast) return null;

  const bgColor = toast.variant === 'destructive' 
    ? 'bg-red-600' 
    : 'bg-gray-900';

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className || ''}`}>
      <div 
        className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-bottom-5`}
        role="alert"
      >
        {toast.title && (
          <p className="font-semibold">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm opacity-90 mt-1">{toast.description}</p>
        )}
      </div>
    </div>
  );
}
