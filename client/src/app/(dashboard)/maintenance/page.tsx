'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { useEmergency } from '@/hooks/useEmergency';
import { useToast } from '@/hooks/use-toast';

import api from '@/lib/api';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  Building2,
  Crown,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  UserCog,
} from 'lucide-react';


// ============================================================
// DASHBOARD DATA TYPES
// ============================================================

interface DashboardMaintenance {
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  lateFeesApplied: number;
}

interface DashboardComplaints {
  openCount: number;
  inProgressCount: number;
}

interface DashboardData {
  maintenance: DashboardMaintenance;
  complaints: DashboardComplaints;
}


// ============================================================
// SOCIETY TYPE
// ============================================================

interface Society {
  _id: string;
  name: string;
  society_code: string;
  address?: string;
  city?: string;
  state?: string;
  contact_number?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;

  // Added for dashboard display
  totalUsers?: number;
}


// ============================================================
// SOCIETY STATS TYPE
// ============================================================

interface SocietyStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  residents: number;
  admins: number;
  managers: number;
  watchmen: number;
}


// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_DATA: DashboardData = {
  maintenance: {
    amount: 0,
    dueDate: new Date().toISOString(),
    status: 'pending',
    lateFeesApplied: 0,
  },

  complaints: {
    openCount: 0,
    inProgressCount: 0,
  },
};


// ============================================================
// DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {
  const router = useRouter();

  const {
    user,
    loading,
  } = useAuth();

  const { toast } = useToast();

  const {
    activeEmergency,
    loading: emergencyLoading,
    triggerEmergency,
    resolveEmergency,
    triggerLoading,
    resolveLoading,
  } = useEmergency();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    dashboardData,
    setDashboardData,
  ] = useState<DashboardData>(DEFAULT_DATA);

  const [
    dataLoading,
    setDataLoading,
  ] = useState(true);


  // ==========================================================
  // SUPER ADMIN STATE
  // ==========================================================

  const [
    societies,
    setSocieties,
  ] = useState<Society[]>([]);

  const [
    societiesLoading,
    setSocietiesLoading,
  ] = useState(false);

  const [
    selectedSociety,
    setSelectedSociety,
  ] = useState<Society | null>(null);

  const [
    selectedSocietyStats,
    setSelectedSocietyStats,
  ] = useState<SocietyStats | null>(null);

  const [
    statsLoading,
    setStatsLoading,
  ] = useState(false);


  // ==========================================================
  // ROLE CHECKS
  // ==========================================================

  const isSuperAdmin =
    user?.role === 'super_admin';

  const isManager =
    user?.role === 'manager';

  const isAdmin =
    !!user &&
    ['manager', 'admin'].includes(
      user.role
    );

  const societyName =
    (user as typeof user & {
      society?: {
        name?: string;
      } | null;
      society_name?: string;
    })?.society?.name ||
    (user as typeof user & {
      society_name?: string;
    })?.society_name ||
    'Society Management';


  // ==========================================================
  // REDIRECT WATCHMAN
  // ==========================================================

  useEffect(() => {
    if (
      !loading &&
      user?.role === 'watchman'
    ) {
      router.replace('/watchman');
    }
  }, [
    user,
    loading,
    router,
  ]);


  // ==========================================================
  // FETCH SUPER ADMIN SOCIETIES
  // ==========================================================

  const fetchSocieties = async (
    showToast = false
  ) => {
    try {
      setSocietiesLoading(true);

      const response =
        await api.get('/societies');

      if (
        response.data?.success
      ) {
        const societyData: Society[] =
          response.data.data || [];

        // ----------------------------------------------------
        // Fetch user count for every society
        // ----------------------------------------------------

        const societiesWithStats =
          await Promise.all(
            societyData.map(
              async (society) => {
                try {
                  const statsResponse =
                    await api.get(
                      `/societies/${society._id}/stats`
                    );

                  return {
                    ...society,
                    totalUsers:
                      Number(
                        statsResponse.data?.data
                          ?.totalUsers || 0
                      ),
                  };
                } catch {
                  return {
                    ...society,
                    totalUsers: 0,
                  };
                }
              }
            )
          );

        setSocieties(
          societiesWithStats
        );

        // ----------------------------------------------------
        // Keep selected society
        // ----------------------------------------------------

        setSelectedSociety(
          (previous) => {
            if (
              previous
            ) {
              const updated =
                societiesWithStats.find(
                  (society) =>
                    society._id ===
                    previous._id
                );

              if (updated) {
                return updated;
              }
            }

            return (
              societiesWithStats[0] ||
              null
            );
          }
        );

        if (showToast) {
          toast({
            title: 'Refreshed',
            description:
              'Society data has been refreshed.',
          });
        }
      }

    } catch (error: any) {
      console.error(
        'Failed to fetch societies:',
        error
      );

      toast({
        title: 'Societies Error',
        description:
          error?.response?.data?.message ||
          'Failed to load societies.',
        variant: 'destructive',
      });

    } finally {
      setSocietiesLoading(false);
    }
  };


  // ==========================================================
  // LOAD SOCIETIES
  // ==========================================================

  useEffect(() => {
    if (
      loading ||
      !user ||
      user.role !== 'super_admin'
    ) {
      return;
    }

    fetchSocieties();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    user,
  ]);


  // ==========================================================
  // FETCH SELECTED SOCIETY STATS
  // ==========================================================

  useEffect(() => {
    if (
      loading ||
      !user ||
      user.role !== 'super_admin' ||
      !selectedSociety
    ) {
      return;
    }

    const fetchSocietyStats =
      async () => {
        try {
          setStatsLoading(true);

          const response =
            await api.get(
              `/societies/${selectedSociety._id}/stats`
            );

          if (
            response.data?.success
          ) {
            setSelectedSocietyStats(
              response.data.data
            );
          } else {
            setSelectedSocietyStats(
              null
            );
          }

        } catch (error) {
          console.error(
            'Failed to fetch society stats:',
            error
          );

          setSelectedSocietyStats(
            null
          );

        } finally {
          setStatsLoading(false);
        }
      };

    fetchSocietyStats();

  }, [
    loading,
    user,
    selectedSociety,
  ]);


  // ==========================================================
  // FETCH NORMAL USER DASHBOARD DATA
  // ==========================================================

  useEffect(() => {
    if (
      loading ||
      !user ||
      user.role === 'super_admin' ||
      user.role === 'watchman'
    ) {
      setDataLoading(false);
      return;
    }

    const fetchDashboardData =
      async () => {
        try {
          setDataLoading(true);

          // --------------------------------------------------
          // Maintenance
          // --------------------------------------------------

          const maintenanceResponse =
            await api.get(
              '/maintenance/current'
            );

          if (
            maintenanceResponse.data
              ?.success
          ) {
            const maintenance =
              maintenanceResponse.data
                .data;

            setDashboardData(
              (prev) => ({
                ...prev,

                maintenance: {
                  amount:
                    Number(
                      maintenance
                        ?.total_amount || 0
                    ),

                  dueDate:
                    maintenance
                      ?.due_date ||
                    new Date()
                      .toISOString(),

                  status:
                    maintenance
                      ?.status ||
                    'pending',

                  lateFeesApplied:
                    Number(
                      maintenance
                        ?.late_fee || 0
                    ),
                },
              })
            );
          }


          // --------------------------------------------------
          // Complaints
          // --------------------------------------------------

          try {
            const complaintsResponse =
              await api.get(
                '/complaints'
              );

            if (
              complaintsResponse
                .data?.success
            ) {
              const complaintData =
                complaintsResponse.data
                  .data || [];

              const openCount =
                complaintData.filter(
                  (complaint: any) =>
                    complaint.status ===
                    'open'
                ).length;

              const inProgressCount =
                complaintData.filter(
                  (complaint: any) =>
                    complaint.status ===
                    'in-progress'
                ).length;

              setDashboardData(
                (prev) => ({
                  ...prev,

                  complaints: {
                    openCount,
                    inProgressCount,
                  },
                })
              );
            }

          } catch (
            complaintError
          ) {
            console.error(
              'Failed to fetch complaints:',
              complaintError
            );
          }

        } catch (error) {
          console.error(
            'Failed to fetch dashboard data:',
            error
          );

          toast({
            title: 'Dashboard Error',
            description:
              'Failed to load latest dashboard data.',
            variant:
              'destructive',
          });

        } finally {
          setDataLoading(false);
        }
      };

    fetchDashboardData();

  }, [
    loading,
    user,
    toast,
  ]);


  // ==========================================================
  // SUPER ADMIN REFRESH
  // ==========================================================

  const handleRefreshSocieties =
    async () => {
      await fetchSocieties(true);
    };


  // ==========================================================
  // SCROLL TO SOCIETIES
  // ==========================================================

  const handleOpenSocieties =
    () => {
      const element =
        document.getElementById(
          'societies-section'
        );

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    };


  const handleOpenUsers =
    () => {
      router.push('/admin/users');
    };


  const handleOpenPayments =
    () => {
      router.push('/admin/payments');
    };


  const handleOpenComplaints =
    () => {
      router.push('/admin/complaints');
    };


  // ==========================================================
  // SELECT SOCIETY
  // ==========================================================

  const handleSelectSociety =
    (
      society: Society
    ) => {
      setSelectedSociety(
        society
      );

      setTimeout(() => {
        const element =
          document.getElementById(
            'selected-society-section'
          );

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    };


  // ==========================================================
  // EMERGENCY TRIGGER
  // ==========================================================

  const handleTriggerEmergency =
    async (
      notes?: string
    ) => {
      try {
        await triggerEmergency(
          notes
        );

        toast({
          title:
            'Emergency Alert Sent',
          description:
            'All residents and staff have been notified.',
        });

      } catch (error: any) {
        toast({
          title:
            'Failed to send alert',
          description:
            error?.message ||
            'Please try again',
          variant:
            'destructive',
        });
      }
    };


  // ==========================================================
  // EMERGENCY RESOLVE
  // ==========================================================

  const handleResolveEmergency =
    async (
      id: string
    ) => {
      try {
        await resolveEmergency(
          id
        );

        toast({
          title:
            'Emergency Resolved',
          description:
            'All residents have been notified.',
        });

      } catch (error: any) {
        toast({
          title:
            'Failed to resolve',
          description:
            error?.message ||
            'Please try again',
          variant:
            'destructive',
        });
      }
    };


  // ==========================================================
  // AUTH LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div
          className="
            w-10
            h-10
            rounded-full
            border-4
            border-blue-100
            border-t-blue-600
            animate-spin
          "
        />
      </div>
    );
  }


  // ==========================================================
  // SUPER ADMIN DASHBOARD
  // ==========================================================

  if (isSuperAdmin) {

    const totalSocieties =
      societies.length;

    const activeSocieties =
      societies.filter(
        (society) =>
          society.is_active
      ).length;

    const inactiveSocieties =
      societies.filter(
        (society) =>
          !society.is_active
      ).length;

    const totalUsers =
      societies.reduce(
        (
          total,
          society
        ) =>
          total +
          Number(
            society.totalUsers || 0
          ),
        0
      );


    return (
      <div className="space-y-8">

        {/* ==================================================
            SUPER ADMIN HEADER
        ================================================== */}

        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-4
          "
        >

          <div>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-gradient-to-br
                  from-red-500
                  to-red-700
                  flex
                  items-center
                  justify-center
                  shadow-lg
                "
              >
                <Crown
                  className="
                    w-6
                    h-6
                    text-white
                  "
                />
              </div>

              <div>

                <h1
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-slate-900
                  "
                >
                  Super Admin Dashboard
                </h1>

                <p
                  className="
                    text-slate-500
                    mt-1
                  "
                >
                  Manage all societies and their users
                </p>

              </div>

            </div>

          </div>


          <Button
            onClick={
              handleRefreshSocieties
            }
            disabled={
              societiesLoading
            }
            variant="outline"
            className="gap-2"
          >

            <RefreshCw
              className={`
                w-4
                h-4
                ${
                  societiesLoading
                    ? 'animate-spin'
                    : ''
                }
              `}
            />

            Refresh

          </Button>

        </div>


        {/* ==================================================
            SUPER ADMIN INFO
        ================================================== */}

        <div
          className="
            flex
            items-center
            gap-3
            p-4
            rounded-xl
            bg-red-50
            border
            border-red-100
          "
        >

          <Shield
            className="
              w-5
              h-5
              text-red-600
            "
          />

          <div>

            <p
              className="
                font-semibold
                text-red-800
              "
            >
              Super Administrator
            </p>

            <p
              className="
                text-sm
                text-red-600
              "
            >
              {user?.email}
            </p>

          </div>

        </div>


        {/* ==================================================
            OVERVIEW CARDS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-6
          "
        >

          {/* Total Societies */}

          <Card
            className="
              border-0
              shadow-sm
            "
          >

            <CardContent
              className="p-6"
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Total Societies
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-slate-900
                      mt-2
                    "
                  >
                    {totalSocieties}
                  </p>

                </div>

                <div
                  className="
                    w-12
                    h-12
                    rounded-xl
                    bg-blue-100
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Building2
                    className="
                      w-6
                      h-6
                      text-blue-600
                    "
                  />

                </div>

              </div>

            </CardContent>

          </Card>


          {/* Active Societies */}

          <Card
            className="
              border-0
              shadow-sm
            "
          >

            <CardContent
              className="p-6"
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Active Societies
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-slate-900
                      mt-2
                    "
                  >
                    {activeSocieties}
                  </p>

                </div>

                <div
                  className="
                    w-12
                    h-12
                    rounded-xl
                    bg-green-100
                    flex
                    items-center
                    justify-center
                  "
                >

                  <CheckCircle
                    className="
                      w-6
                      h-6
                      text-green-600
                    "
                  />

                </div>

              </div>

            </CardContent>

          </Card>


          {/* Inactive Societies */}

          <Card
            className="
              border-0
              shadow-sm
            "
          >

            <CardContent
              className="p-6"
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Inactive Societies
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-slate-900
                      mt-2
                    "
                  >
                    {inactiveSocieties}
                  </p>

                </div>

                <div
                  className="
                    w-12
                    h-12
                    rounded-xl
                    bg-red-100
                    flex
                    items-center
                    justify-center
                  "
                >

                  <XCircle
                    className="
                      w-6
                      h-6
                      text-red-600
                    "
                  />

                </div>

              </div>

            </CardContent>

          </Card>


          {/* Users */}

          <Card
            className="
              border-0
              shadow-sm
            "
          >

            <CardContent
              className="p-6"
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Total Users
                  </p>

                  <p
                    className="
                      text-3xl
                      font-bold
                      text-slate-900
                      mt-2
                    "
                  >
                    {totalUsers}
                  </p>

                </div>

                <div
                  className="
                    w-12
                    h-12
                    rounded-xl
                    bg-purple-100
                    flex
                    items-center
                    justify-center
                  "
                >

                  <Users
                    className="
                      w-6
                      h-6
                      text-purple-600
                    "
                  />

                </div>

              </div>

            </CardContent>

          </Card>

        </div>


        {/* ==================================================
            SOCIETY LIST
        ================================================== */}

        <div
          id="societies-section"
          className="scroll-mt-24"
        >

          <Card
            className="
              border-0
              shadow-sm
            "
          >

            <CardHeader>

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-3
                "
              >

                <CardTitle
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <Building2
                    className="
                      w-5
                      h-5
                      text-blue-600
                    "
                  />

                  All Societies

                </CardTitle>

                <Badge
                  variant="outline"
                  className="
                    w-fit
                    bg-blue-50
                    text-blue-700
                    border-blue-200
                  "
                >
                  {totalSocieties} Societies
                </Badge>

              </div>

            </CardHeader>


            <CardContent>

              {societiesLoading ? (

                <div
                  className="
                    flex
                    items-center
                    justify-center
                    py-16
                  "
                >

                  <RefreshCw
                    className="
                      w-8
                      h-8
                      animate-spin
                      text-blue-600
                    "
                  />

                </div>

              ) : societies.length === 0 ? (

                <div
                  className="
                    text-center
                    py-16
                  "
                >

                  <Building2
                    className="
                      w-14
                      h-14
                      mx-auto
                      text-slate-300
                    "
                  />

                  <h3
                    className="
                      mt-4
                      font-semibold
                      text-slate-700
                    "
                  >
                    No societies found
                  </h3>

                  <p
                    className="
                      text-sm
                      text-slate-500
                      mt-1
                    "
                  >
                    No society has been created yet.
                  </p>

                </div>

              ) : (

                <div className="space-y-3">

                  {societies.map(
                    (society) => (

                      <button
                        key={
                          society._id
                        }
                        type="button"
                        onClick={() =>
                          handleSelectSociety(
                            society
                          )
                        }
                        className={`
                          w-full
                          text-left
                          p-4
                          rounded-xl
                          border
                          transition-all
                          duration-200
                          ${
                            selectedSociety?._id ===
                            society._id
                              ? 'border-blue-300 bg-blue-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                          }
                        `}
                      >

                        <div
                          className="
                            flex
                            flex-col
                            md:flex-row
                            md:items-center
                            md:justify-between
                            gap-4
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              gap-4
                            "
                          >

                            <div
                              className="
                                w-12
                                h-12
                                rounded-xl
                                bg-blue-100
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                              "
                            >

                              <Building2
                                className="
                                  w-6
                                  h-6
                                  text-blue-600
                                "
                              />

                            </div>


                            <div>

                              <h3
                                className="
                                  font-semibold
                                  text-slate-900
                                "
                              >
                                {society.name}
                              </h3>

                              <p
                                className="
                                  text-sm
                                  text-slate-500
                                  mt-0.5
                                "
                              >
                                Code:{' '}
                                {
                                  society.society_code
                                }
                              </p>

                              {society.city && (
                                <p
                                  className="
                                    text-xs
                                    text-slate-400
                                    mt-1
                                  "
                                >
                                  {society.city}
                                  {society.state
                                    ? `, ${society.state}`
                                    : ''}
                                </p>
                              )}

                            </div>

                          </div>


                          <div
                            className="
                              flex
                              items-center
                              gap-3
                              flex-wrap
                            "
                          >

                            <Badge
                              variant="outline"
                              className={
                                society.is_active
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {society.is_active
                                ? 'Active'
                                : 'Inactive'}
                            </Badge>


                            <Badge
                              variant="outline"
                              className="
                                bg-purple-50
                                text-purple-700
                                border-purple-200
                              "
                            >
                              <Users
                                className="
                                  w-3
                                  h-3
                                  mr-1
                                "
                              />

                              {society.totalUsers || 0}
                              {' '}
                              Users
                            </Badge>


                            <ArrowRight
                              className="
                                w-4
                                h-4
                                text-slate-400
                              "
                            />

                          </div>

                        </div>

                      </button>

                    )
                  )}

                </div>

              )}

            </CardContent>

          </Card>

        </div>


        {/* ==================================================
            SELECTED SOCIETY DETAILS
        ================================================== */}

        {selectedSociety && (

          <div
            id="selected-society-section"
            className="scroll-mt-24"
          >

            <Card
              className="
                border-0
                shadow-sm
              "
            >

              <CardHeader>

                <div
                  className="
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                  "
                >

                  <div>

                    <CardTitle
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <Building2
                        className="
                          w-5
                          h-5
                          text-blue-600
                        "
                      />

                      {selectedSociety.name}

                    </CardTitle>

                    <p
                      className="
                        text-sm
                        text-slate-500
                        mt-1
                      "
                    >
                      Society Code:{' '}
                      {
                        selectedSociety.society_code
                      }
                    </p>

                  </div>


                  <Badge
                    variant="outline"
                    className={
                      selectedSociety.is_active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }
                  >
                    {selectedSociety.is_active
                      ? 'Active Society'
                      : 'Inactive Society'}
                  </Badge>

                </div>

              </CardHeader>


              <CardContent>

                {statsLoading ? (

                  <div
                    className="
                      flex
                      items-center
                      justify-center
                      py-10
                    "
                  >

                    <RefreshCw
                      className="
                        w-7
                        h-7
                        animate-spin
                        text-blue-600
                      "
                    />

                  </div>

                ) : (

                  <div className="space-y-6">

                    {/* Stats */}

                    <div
                      className="
                        grid
                        grid-cols-2
                        md:grid-cols-4
                        gap-4
                      "
                    >

                      <div
                        className="
                          p-4
                          rounded-xl
                          bg-slate-50
                        "
                      >

                        <Users
                          className="
                            w-5
                            h-5
                            text-blue-600
                          "
                        />

                        <p
                          className="
                            text-xs
                            text-slate-500
                            mt-2
                          "
                        >
                          Total Users
                        </p>

                        <p
                          className="
                            text-2xl
                            font-bold
                            text-slate-900
                          "
                        >
                          {
                            selectedSocietyStats
                              ?.totalUsers ?? 0
                          }
                        </p>

                      </div>


                      <div
                        className="
                          p-4
                          rounded-xl
                          bg-slate-50
                        "
                      >

                        <UserCog
                          className="
                            w-5
                            h-5
                            text-green-600
                          "
                        />

                        <p
                          className="
                            text-xs
                            text-slate-500
                            mt-2
                          "
                        >
                          Residents
                        </p>

                        <p
                          className="
                            text-2xl
                            font-bold
                            text-slate-900
                          "
                        >
                          {
                            selectedSocietyStats
                              ?.residents ?? 0
                          }
                        </p>

                      </div>


                      <div
                        className="
                          p-4
                          rounded-xl
                          bg-slate-50
                        "
                      >

                        <Shield
                          className="
                            w-5
                            h-5
                            text-purple-600
                          "
                        />

                        <p
                          className="
                            text-xs
                            text-slate-500
                            mt-2
                          "
                        >
                          Admins
                        </p>

                        <p
                          className="
                            text-2xl
                            font-bold
                            text-slate-900
                          "
                        >
                          {
                            selectedSocietyStats
                              ?.admins ?? 0
                          }
                        </p>

                      </div>


                      <div
                        className="
                          p-4
                          rounded-xl
                          bg-slate-50
                        "
                      >

                        <Crown
                          className="
                            w-5
                            h-5
                            text-amber-600
                          "
                        />

                        <p
                          className="
                            text-xs
                            text-slate-500
                            mt-2
                          "
                        >
                          Managers
                        </p>

                        <p
                          className="
                            text-2xl
                            font-bold
                            text-slate-900
                          "
                        >
                          {
                            selectedSocietyStats
                              ?.managers ?? 0
                          }
                        </p>

                      </div>

                    </div>


                    {/* Society Details */}

                    <div
                      className="
                        grid
                        grid-cols-1
                        md:grid-cols-2
                        gap-4
                        pt-4
                        border-t
                        border-slate-100
                      "
                    >

                      <div>

                        <p
                          className="
                            text-xs
                            text-slate-400
                          "
                        >
                          Address
                        </p>

                        <p
                          className="
                            text-sm
                            text-slate-700
                            mt-1
                          "
                        >
                          {selectedSociety.address ||
                            'Not provided'}
                        </p>

                      </div>


                      <div>

                        <p
                          className="
                            text-xs
                            text-slate-400
                          "
                        >
                          Contact Number
                        </p>

                        <p
                          className="
                            text-sm
                            text-slate-700
                            mt-1
                          "
                        >
                          {selectedSociety.contact_number ||
                            'Not provided'}
                        </p>

                      </div>

                    </div>

                  </div>

                )}

              </CardContent>

            </Card>

          </div>

        )}


        {/* ==================================================
            SUPER ADMIN ACTIONS
        ================================================== */}

        <Card
          className="
            border-0
            shadow-sm
            bg-gradient-to-r
            from-slate-900
            to-slate-800
            text-white
          "
        >

          <CardHeader>

            <CardTitle
              className="
                flex
                items-center
                gap-2
                text-white
              "
            >

              <Zap
                className="
                  w-5
                  h-5
                  text-blue-400
                "
              />

              Super Admin Actions

            </CardTitle>

          </CardHeader>


          <CardContent>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-4
                gap-3
              "
            >

              {/* Societies */}

              <Button
                type="button"
                onClick={
                  handleOpenSocieties
                }
                variant="secondary"
                className="
                  w-full
                  h-auto
                  py-4
                  flex
                  flex-col
                  gap-2
                  bg-slate-700/50
                  hover:bg-slate-700
                  border-0
                  text-white
                "
              >

                <Building2
                  className="
                    w-5
                    h-5
                  "
                />

                <span
                  className="
                    text-xs
                    font-medium
                  "
                >
                  Societies
                </span>

              </Button>


              {/* Users */}

              <Button
                type="button"
                onClick={handleOpenUsers}
                variant="secondary"
                className="
                  w-full
                  h-auto
                  py-4
                  flex
                  flex-col
                  gap-2
                  bg-slate-700/50
                  hover:bg-slate-700
                  border-0
                  text-white
                "
              >

                <Users
                  className="
                    w-5
                    h-5
                  "
                />

                <span
                  className="
                    text-xs
                    font-medium
                  "
                >
                  Users
                </span>

              </Button>


              {/* Payments */}

              <Button
                type="button"
                onClick={handleOpenPayments}
                variant="secondary"
                className="
                  w-full
                  h-auto
                  py-4
                  flex
                  flex-col
                  gap-2
                  bg-slate-700/50
                  hover:bg-slate-700
                  border-0
                  text-white
                "
              >

                <BarChart3
                  className="
                    w-5
                    h-5
                  "
                />

                <span
                  className="
                    text-xs
                    font-medium
                  "
                >
                  Payments
                </span>

              </Button>


              {/* Complaints */}

              <Button
                type="button"
                onClick={handleOpenComplaints}
                variant="secondary"
                className="
                  w-full
                  h-auto
                  py-4
                  flex
                  flex-col
                  gap-2
                  bg-slate-700/50
                  hover:bg-slate-700
                  border-0
                  text-white
                "
              >

                <FileText
                  className="
                    w-5
                    h-5
                  "
                />

                <span
                  className="
                    text-xs
                    font-medium
                  "
                >
                  Complaints
                </span>

              </Button>

            </div>

          </CardContent>

        </Card>

      </div>
    );
  }


  // ==========================================================
  // NORMAL USER GREETING
  // ==========================================================

  const hour =
    new Date().getHours();

  const greeting =
    hour < 12
      ? 'Good Morning'
      : hour < 17
      ? 'Good Afternoon'
      : 'Good Evening';


  // ==========================================================
  // NORMAL USER DASHBOARD
  // ==========================================================

  return (
    <div className="space-y-8">


      {/* ====================================================
          EMERGENCY BANNER
      ==================================================== */}

      <EmergencyBanner
        emergency={
          activeEmergency
        }
        loading={
          emergencyLoading
        }
        onResolve={
          handleResolveEmergency
        }
        canResolve={
          isAdmin || false
        }
        resolveLoading={
          resolveLoading
        }
      />


      {/* ====================================================
          WELCOME HEADER
      ==================================================== */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
        "
      >

        <div>

          <h1
            className="
              text-2xl
              sm:text-3xl
              font-bold
              text-slate-900
              tracking-tight
            "
          >

            {greeting},{' '}

            {user?.name
              ?.split(' ')[0]}

          </h1>


          <p
            className="
              text-slate-500
              mt-1
              flex
              items-center
              gap-2
            "
          >

            <MapPin
              className="
                w-4
                h-4
              "
            />

            Flat {user?.flat_no}

            {' • '}

            {societyName}

          </p>

        </div>


        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <Badge
            variant="outline"
            className="
              px-3
              py-1.5
              text-sm
              font-medium
              bg-white
            "
          >

            <Calendar
              className="
                w-4
                h-4
                mr-1.5
                text-slate-400
              "
            />

            {new Date()
              .toLocaleDateString(
                'en-IN',
                {
                  weekday:
                    'long',
                  month:
                    'short',
                  day:
                    'numeric',
                }
              )}

          </Badge>


          {isAdmin && (

            <Badge
              className="
                bg-blue-100
                text-blue-700
                hover:bg-blue-100
                px-3
                py-1.5
              "
            >

              <Shield
                className="
                  w-4
                  h-4
                  mr-1.5
                "
              />

              {user?.role ===
              'manager'
                ? 'Manager'
                : 'Admin'}

            </Badge>

          )}

        </div>

      </div>


      {/* ====================================================
          QUICK STATS
      ==================================================== */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-6
        "
      >

        <PaymentCard
          amount={
            dashboardData
              .maintenance
              .amount
          }
          dueDate={
            dashboardData
              .maintenance
              .dueDate
          }
          status={
            dashboardData
              .maintenance
              .status
          }
          lateFeesApplied={
            dashboardData
              .maintenance
              .lateFeesApplied
          }
          loading={
            dataLoading
          }
        />


        <ComplaintsWidget
          openCount={
            dashboardData
              .complaints
              .openCount
          }
          inProgressCount={
            dashboardData
              .complaints
              .inProgressCount
          }
          loading={
            dataLoading
          }
        />


        <AssetStatusWidget
          isAdmin={
            isAdmin || false
          }
        />

      </div>


      {/* ====================================================
          EMERGENCY + PROFILE
      ==================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-5
          gap-6
        "
      >

        {/* Emergency */}

        <Card
          className="
            lg:col-span-3
            overflow-hidden
            border-0
            shadow-sm
            bg-gradient-to-br
            from-white
            to-slate-50
          "
        >

          <CardHeader
            className="pb-3"
          >

            <CardTitle
              className="
                flex
                items-center
                gap-2
                text-lg
              "
            >

              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-red-100
                  flex
                  items-center
                  justify-center
                "
              >

                <AlertTriangle
                  className="
                    w-4
                    h-4
                    text-red-600
                  "
                />

              </div>

              Lift Emergency

            </CardTitle>


            <p
              className="
                text-sm
                text-slate-500
              "
            >
              Use only in case of actual emergency when someone is stuck in the lift
            </p>

          </CardHeader>


          <CardContent>

            <EmergencyButton
              onTrigger={
                handleTriggerEmergency
              }
              hasActiveEmergency={
                !!activeEmergency
              }
              userFlat={
                user?.flat_no || ''
              }
              triggerLoading={
                triggerLoading
              }
            />

          </CardContent>

        </Card>


        {/* Profile */}

        <Card
          className="
            lg:col-span-2
            border-0
            shadow-sm
          "
        >

          <CardHeader
            className="pb-3"
          >

            <CardTitle
              className="
                flex
                items-center
                gap-2
                text-lg
              "
            >

              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-blue-100
                  flex
                  items-center
                  justify-center
                "
              >

                <Activity
                  className="
                    w-4
                    h-4
                    text-blue-600
                  "
                />

              </div>

              Your Profile

            </CardTitle>

          </CardHeader>


          <CardContent
            className="space-y-4"
          >

            <div
              className="
                flex
                items-center
                gap-4
              "
            >

              <div
                className="
                  w-14
                  h-14
                  rounded-full
                  bg-gradient-to-br
                  from-blue-400
                  to-blue-600
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >

                <span
                  className="
                    text-white
                    font-bold
                    text-lg
                  "
                >
                  {user?.name
                    ?.split(' ')
                    .map(
                      (n) =>
                        n[0]
                    )
                    .join('')
                    .slice(
                      0,
                      2
                    )
                    .toUpperCase()}
                </span>

              </div>


              <div
                className="
                  min-w-0
                "
              >

                <h3
                  className="
                    font-semibold
                    text-slate-900
                    truncate
                  "
                >
                  {user?.name}
                </h3>

                <p
                  className="
                    text-sm
                    text-slate-500
                    capitalize
                  "
                >
                  {user?.role}
                </p>

              </div>

            </div>


            <div
              className="
                space-y-2
                pt-2
                border-t
                border-slate-100
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  text-sm
                "
              >

                <Mail
                  className="
                    w-4
                    h-4
                    text-slate-400
                  "
                />

                <span
                  className="
                    text-slate-600
                    truncate
                  "
                >
                  {user?.email}
                </span>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-3
                  text-sm
                "
              >

                <Phone
                  className="
                    w-4
                    h-4
                    text-slate-400
                  "
                />

                <span
                  className="
                    text-slate-600
                  "
                >
                  {user?.phone ||
                    'Not provided'}
                </span>

              </div>


              <div
                className="
                  flex
                  items-center
                  gap-3
                  text-sm
                "
              >

                <MapPin
                  className="
                    w-4
                    h-4
                    text-slate-400
                  "
                />

                <span
                  className="
                    text-slate-600
                  "
                >
                  Flat {user?.flat_no}
                </span>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* ====================================================
          ADMIN QUICK ACTIONS
      ==================================================== */}

      {isAdmin && (

        <Card
          className="
            border-0
            shadow-sm
            bg-gradient-to-r
            from-slate-900
            to-slate-800
            text-white
          "
        >

          <CardHeader
            className="pb-4"
          >

            <CardTitle
              className="
                flex
                items-center
                gap-2
                text-lg
                text-white
              "
            >

              <Zap
                className="
                  w-5
                  h-5
                  text-blue-400
                "
              />

              Admin Quick Actions

            </CardTitle>

          </CardHeader>


          <CardContent>

            <div
              className="
                grid
                grid-cols-2
                md:grid-cols-4
                gap-3
              "
            >

              <Link
                href="/admin/users"
              >

                <Button
                  variant="secondary"
                  className="
                    w-full
                    h-auto
                    py-4
                    flex
                    flex-col
                    gap-2
                    bg-slate-700/50
                    hover:bg-slate-700
                    border-0
                    text-white
                  "
                >

                  <Users
                    className="
                      w-5
                      h-5
                    "
                  />

                  <span
                    className="
                      text-xs
                      font-medium
                    "
                  >
                    Manage Users
                  </span>

                </Button>

              </Link>


              <Link
                href="/admin/payments"
              >

                <Button
                  variant="secondary"
                  className="
                    w-full
                    h-auto
                    py-4
                    flex
                    flex-col
                    gap-2
                    bg-slate-700/50
                    hover:bg-slate-700
                    border-0
                    text-white
                  "
                >

                  <BarChart3
                    className="
                      w-5
                      h-5
                    "
                  />

                  <span
                    className="
                      text-xs
                      font-medium
                    "
                  >
                    All Payments
                  </span>

                </Button>

              </Link>


              <Link
                href="/admin/complaints"
              >

                <Button
                  variant="secondary"
                  className="
                    w-full
                    h-auto
                    py-4
                    flex
                    flex-col
                    gap-2
                    bg-slate-700/50
                    hover:bg-slate-700
                    border-0
                    text-white
                  "
                >

                  <FileText
                    className="
                      w-5
                      h-5
                    "
                  />

                  <span
                    className="
                      text-xs
                      font-medium
                    "
                  >
                    All Complaints
                  </span>

                </Button>

              </Link>


              <Link
                href="/admin/assets"
              >

                <Button
                  variant="secondary"
                  className="
                    w-full
                    h-auto
                    py-4
                    flex
                    flex-col
                    gap-2
                    bg-slate-700/50
                    hover:bg-slate-700
                    border-0
                    text-white
                  "
                >

                  <Settings
                    className="
                      w-5
                      h-5
                    "
                  />

                  <span
                    className="
                      text-xs
                      font-medium
                    "
                  >
                    Manage Assets
                  </span>

                </Button>

              </Link>

            </div>

          </CardContent>

        </Card>

      )}

    </div>
  );
}