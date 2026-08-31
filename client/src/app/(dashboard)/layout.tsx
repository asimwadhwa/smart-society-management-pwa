'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEmergency } from '@/hooks/useEmergency';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import EmergencyBanner from '@/components/dashboard/EmergencyBanner';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    loading,
    user,
    isAuthenticated,
  } = useAuth();

  const {
    activeEmergency,
    loading: emergencyLoading,
    resolveEmergency,
    resolveLoading,
  } = useEmergency();

  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [
    loading,
    isAuthenticated,
    router,
  ]);

  // Check if user can resolve emergency
  const canResolve =
    user?.role === 'manager' ||
    user?.role === 'admin';

  const handleResolve = async (id: string) => {
    try {
      await resolveEmergency(id);

      toast({
        title: 'Emergency Resolved',
        description:
          'The emergency has been marked as resolved and all residents have been notified.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message ||
          'Failed to resolve emergency',
        variant: 'destructive',
      });
    }
  };

  // Loading screen
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />

          <p className="mt-4 text-slate-500 text-sm font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50">
      {/* Navbar */}
      <Navbar />

      {/* Page Layout */}
      <div className="flex w-full min-w-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main
          className="
            flex-1
            min-w-0
            w-full
            max-w-full
            lg:ml-64
            min-h-[calc(100vh-4rem)]
            overflow-x-hidden
          "
        >
          <div
            className="
              w-full
              min-w-0
              max-w-7xl
              mx-auto
              p-4
              lg:p-8
              pb-24
              lg:pb-8
              overflow-x-hidden
            "
          >
            {/* Emergency Banner */}
            {activeEmergency && (
              <div className="mb-6 w-full min-w-0">
                <EmergencyBanner
                  emergency={activeEmergency}
                  loading={emergencyLoading}
                  onResolve={handleResolve}
                  canResolve={canResolve}
                  resolveLoading={resolveLoading}
                />
              </div>
            )}

            {/* Page Content */}
            <div className="w-full min-w-0 max-w-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Toast */}
      <Toaster />
    </div>
  );
}