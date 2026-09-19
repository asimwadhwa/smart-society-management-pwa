'use client';

import { useEffect } from 'react';
import {
  useRouter,
  usePathname,
} from 'next/navigation';

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
  const pathname = usePathname();


  // ==========================================================
  // AUTH
  // ==========================================================

  const {
    loading,
    user,
    isAuthenticated,
  } = useAuth();


  // ==========================================================
  // EMERGENCY
  // ==========================================================

  const {
    activeEmergency,
    loading: emergencyLoading,
    resolveEmergency,
    resolveLoading,
  } = useEmergency();


  const { toast } = useToast();


  // ==========================================================
  // AUTH REDIRECT
  // ONLY REDIRECT UNAUTHENTICATED USERS
  // ==========================================================

  useEffect(() => {

    if (
      !loading &&
      !isAuthenticated
    ) {

      router.replace('/login');

    }

  }, [
    loading,
    isAuthenticated,
    router,
  ]);


  // ==========================================================
  // ROLE
  // ==========================================================

  const isSuperAdmin =
    user?.role === 'super_admin';

  const isManager =
    user?.role === 'manager';

  const isAdmin =
    user?.role === 'admin';

  const isWatchman =
    user?.role === 'watchman';


  // ==========================================================
  // ADMIN ROUTES
  // ==========================================================

  const isAdminRoute =
    pathname?.startsWith('/admin');


  // ==========================================================
  // ALLOWED SUPER ADMIN ROUTES
  // ==========================================================

  const superAdminRoutes = [
    '/admin/users',
    '/admin/payments',
    '/admin/complaints',
    '/admin/societies',
  ];


  const isAllowedSuperAdminRoute =
    superAdminRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(route + '/')
    );


  // ==========================================================
  // IMPORTANT
  // DO NOT REDIRECT SUPER ADMIN FROM ADMIN ROUTES
  // ==========================================================

  useEffect(() => {

    if (
      loading ||
      !isAuthenticated ||
      !user
    ) {
      return;
    }


    // --------------------------------------------------------
    // SUPER ADMIN
    // --------------------------------------------------------

    if (isSuperAdmin) {

      if (isAllowedSuperAdminRoute) {
        return;
      }

      // Normal dashboard is allowed
      if (
        pathname === '/' ||
        pathname === ''
      ) {
        return;
      }

      return;
    }


    // --------------------------------------------------------
    // MANAGER / ADMIN
    // --------------------------------------------------------

    if (
      (isManager || isAdmin) &&
      isAdminRoute
    ) {
      return;
    }


    // --------------------------------------------------------
    // WATCHMAN
    // --------------------------------------------------------

    if (
      isWatchman &&
      pathname !== '/watchman'
    ) {

      router.replace('/watchman');

    }

  }, [
    loading,
    isAuthenticated,
    user,
    isSuperAdmin,
    isManager,
    isAdmin,
    isWatchman,
    isAdminRoute,
    isAllowedSuperAdminRoute,
    pathname,
    router,
  ]);


  // ==========================================================
  // EMERGENCY PERMISSION
  // ==========================================================

  const canResolve =
    user?.role === 'manager' ||
    user?.role === 'admin';


  // ==========================================================
  // RESOLVE EMERGENCY
  // ==========================================================

  const handleResolve = async (
    id: string
  ) => {

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
          error?.message ||
          'Failed to resolve emergency',
        variant: 'destructive',
      });

    }

  };


  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (loading) {

    return (
      <div
        className="
          min-h-screen
          w-full
          overflow-x-hidden
          bg-slate-50
          flex
          items-center
          justify-center
        "
      >

        <div className="text-center">

          <div
            className="
              w-12
              h-12
              rounded-full
              border-4
              border-blue-100
              border-t-blue-600
              animate-spin
              mx-auto
            "
          />

          <p
            className="
              mt-4
              text-slate-500
              text-sm
              font-medium
            "
          >
            Loading...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // NOT AUTHENTICATED
  // ==========================================================

  if (!isAuthenticated) {

    return (
      <div
        className="
          min-h-screen
          w-full
          bg-slate-50
          flex
          items-center
          justify-center
        "
      >

        <div className="text-center">

          <div
            className="
              w-10
              h-10
              rounded-full
              border-4
              border-blue-100
              border-t-blue-600
              animate-spin
              mx-auto
            "
          />

          <p
            className="
              mt-4
              text-slate-500
              text-sm
            "
          >
            Redirecting to login...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // MAIN LAYOUT
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        w-full
        max-w-full
        overflow-x-hidden
        bg-slate-50
      "
    >

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar />


      {/* =====================================================
          PAGE LAYOUT
      ===================================================== */}

      <div
        className="
          flex
          w-full
          min-w-0
        "
      >

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <Sidebar />


        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

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

            {/* =================================================
                EMERGENCY BANNER

                Super Admin ke liye hide.
                Society users ke liye show.
            ================================================= */}

            {!isSuperAdmin &&
              activeEmergency && (

                <div
                  className="
                    mb-6
                    w-full
                    min-w-0
                  "
                >

                  <EmergencyBanner
                    emergency={
                      activeEmergency
                    }

                    loading={
                      emergencyLoading
                    }

                    onResolve={
                      handleResolve
                    }

                    canResolve={
                      canResolve
                    }

                    resolveLoading={
                      resolveLoading
                    }

                  />

                </div>

              )}


            {/* =================================================
                PAGE CONTENT
            ================================================= */}

            <div
              className="
                w-full
                min-w-0
                max-w-full
              "
            >

              {children}

            </div>

          </div>

        </main>

      </div>


      {/* =====================================================
          TOASTER
      ===================================================== */}

      <Toaster />

    </div>
  );
}