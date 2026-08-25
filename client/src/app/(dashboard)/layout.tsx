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
  const { loading, user, isAuthenticated } = useAuth();
  const { activeEmergency, loading: emergencyLoading, resolveEmergency, resolveLoading } = useEmergency();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Check if user can resolve emergency (manager or admin)
  const canResolve = user?.role === 'manager' || user?.role === 'admin';

  const handleResolve = async (id: string) => {
    try {
      await resolveEmergency(id);
      toast({
        title: 'Emergency Resolved',
        description: 'The emergency has been marked as resolved and all residents have been notified.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resolve emergency',
        variant: 'destructive',
      });
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        {/* Main content area with proper spacing for sidebar and mobile bottom nav */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto">
            {/* Emergency Banner - shows globally when active */}
            {activeEmergency && (
              <div className="mb-6">
                <EmergencyBanner
                  emergency={activeEmergency}
                  loading={emergencyLoading}
                  onResolve={handleResolve}
                  canResolve={canResolve}
                  resolveLoading={resolveLoading}
                />
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
