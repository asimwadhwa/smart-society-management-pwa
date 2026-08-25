'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEmergency } from '@/hooks/useEmergency';
import { Building2, Home, ClipboardList, Siren, LogOut } from 'lucide-react';

export default function WatchmanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const { activeEmergency } = useEmergency();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    // Redirect non-watchman users to home
    if (!loading && user && user.role !== 'watchman') {
      router.push('/');
    }
  }, [user, loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && user.role !== 'watchman') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Access denied. Redirecting...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/watchman', label: 'Home', icon: Home },
    { href: '/watchman/gate-log', label: 'Gate Log', icon: ClipboardList },
    { href: '/watchman/emergency', label: 'Emergency', icon: Siren },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg block leading-tight">Watchman Portal</span>
                {user && (
                  <span className="text-xs text-gray-500">{user.name}</span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Emergency Banner */}
      {activeEmergency && (
        <div className="bg-red-500 text-white px-4 py-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">ACTIVE EMERGENCY</p>
                <p className="text-sm">Flat {activeEmergency.flat_no}</p>
              </div>
            </div>
            <Link href="/watchman/emergency">
              <Button size="sm" variant="secondary">View</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="p-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.href === '/watchman/emergency' && activeEmergency && (
                  <span className="absolute top-2 right-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
