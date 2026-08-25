'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEmergency } from '@/hooks/useEmergency';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SOCIETY_NAME } from '@/lib/constants';
import {
  PaymentCard,
  ComplaintsWidget,
  AssetStatusWidget,
  EmergencyBanner,
  EmergencyButton,
} from '@/components/dashboard';
import {
  AlertTriangle,
  Users,
  BarChart3,
  FileText,
  Settings,
  Activity,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  Zap,
} from 'lucide-react';

// Mock data - will be replaced with API calls later
const MOCK_DATA = {
  maintenance: {
    amount: 1000,
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 18).toISOString(),
    status: 'pending' as const,
    lateFeesApplied: 0,
  },
  complaints: {
    openCount: 2,
    inProgressCount: 1,
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { 
    activeEmergency, 
    loading: emergencyLoading, 
    triggerEmergency, 
    resolveEmergency,
    triggerLoading,
    resolveLoading,
  } = useEmergency();
  
  const [dashboardData, setDashboardData] = useState(MOCK_DATA);
  const [dataLoading, setDataLoading] = useState(true);

  // Check if user is admin/manager
  const isAdmin = user && ['manager', 'admin'].includes(user.role);

  // Redirect watchman to their dedicated portal
  useEffect(() => {
    if (!loading && user?.role === 'watchman') {
      router.replace('/watchman');
    }
  }, [user, loading, router]);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setDataLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle emergency trigger
  const handleTriggerEmergency = async (notes?: string) => {
    try {
      await triggerEmergency(notes);
      toast({
        title: 'Emergency Alert Sent',
        description: 'All residents and staff have been notified.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send alert',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Handle emergency resolve (admin only)
  const handleResolveEmergency = async (id: string) => {
    try {
      await resolveEmergency(id);
      toast({
        title: 'Emergency Resolved',
        description: 'All residents have been notified.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resolve',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  // Get current hour for greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8">
      {/* Emergency Banner - Always at top if active */}
      <EmergencyBanner
        emergency={activeEmergency}
        loading={emergencyLoading}
        onResolve={handleResolveEmergency}
        canResolve={isAdmin || false}
        resolveLoading={resolveLoading}
      />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Flat {user?.flat_no} • {SOCIETY_NAME}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-white">
            <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Badge>
          {isAdmin && (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1.5">
              <Shield className="w-4 h-4 mr-1.5" />
              {user?.role === 'manager' ? 'Manager' : 'Admin'}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Payment Card */}
        <PaymentCard
          amount={dashboardData.maintenance.amount}
          dueDate={dashboardData.maintenance.dueDate}
          status={dashboardData.maintenance.status}
          lateFeesApplied={dashboardData.maintenance.lateFeesApplied}
          loading={dataLoading}
        />

        {/* Complaints Widget */}
        <ComplaintsWidget
          openCount={dashboardData.complaints.openCount}
          inProgressCount={dashboardData.complaints.inProgressCount}
          loading={dataLoading}
        />

        {/* Asset Status Widget */}
        <AssetStatusWidget
          isAdmin={isAdmin || false}
        />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Emergency Section - Takes 3 columns */}
        <Card className="lg:col-span-3 overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              Lift Emergency
            </CardTitle>
            <p className="text-sm text-slate-500">
              Use only in case of actual emergency when someone is stuck in the lift
            </p>
          </CardHeader>
          <CardContent>
            <EmergencyButton
              onTrigger={handleTriggerEmergency}
              hasActiveEmergency={!!activeEmergency}
              userFlat={user?.flat_no || ''}
              triggerLoading={triggerLoading}
            />
          </CardContent>
        </Card>

        {/* Profile Card - Takes 2 columns */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{user?.name}</h3>
                <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{user?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Flat {user?.flat_no}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Quick Actions */}
      {isAdmin && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Zap className="w-5 h-5 text-blue-400" />
              Admin Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/admin/users">
                <Button variant="secondary" className="w-full h-auto py-4 flex flex-col gap-2 bg-slate-700/50 hover:bg-slate-700 border-0 text-white">
                  <Users className="w-5 h-5" />
                  <span className="text-xs font-medium">Manage Users</span>
                </Button>
              </Link>
              <Link href="/admin/payments">
                <Button variant="secondary" className="w-full h-auto py-4 flex flex-col gap-2 bg-slate-700/50 hover:bg-slate-700 border-0 text-white">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-xs font-medium">All Payments</span>
                </Button>
              </Link>
              <Link href="/admin/complaints">
                <Button variant="secondary" className="w-full h-auto py-4 flex flex-col gap-2 bg-slate-700/50 hover:bg-slate-700 border-0 text-white">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-medium">All Complaints</span>
                </Button>
              </Link>
              <Link href="/admin/assets">
                <Button variant="secondary" className="w-full h-auto py-4 flex flex-col gap-2 bg-slate-700/50 hover:bg-slate-700 border-0 text-white">
                  <Settings className="w-5 h-5" />
                  <span className="text-xs font-medium">Manage Assets</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
