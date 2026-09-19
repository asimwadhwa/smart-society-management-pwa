'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    // Not logged in
    if (!user) {
      router.replace('/login');
      return;
    }

    // Super Admin is allowed to access all admin pages
    if (user.role === 'super_admin') {
      return;
    }

    // Manager and Admin are allowed
    if (
      user.role === 'manager' ||
      user.role === 'admin'
    ) {
      return;
    }

    // All other roles are not allowed
    router.replace('/');
  }, [user, loading, router]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div
          className="
            animate-spin
            rounded-full
            h-12
            w-12
            border-b-2
            border-primary
          "
        />
      </div>
    );
  }

  // ==========================================================
  // NOT AUTHENTICATED
  // ==========================================================

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // ==========================================================
  // ALLOWED ROLES
  // ==========================================================

  const isAllowed =
    user.role === 'super_admin' ||
    user.role === 'manager' ||
    user.role === 'admin';

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">
          Access denied. Redirecting...
        </p>
      </div>
    );
  }

  // ==========================================================
  // ADMIN PAGE
  // ==========================================================

  return <>{children}</>;
}